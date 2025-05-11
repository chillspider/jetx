import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { Brackets, DataSource, In, Not } from 'typeorm';

import { toUtc } from '../../../common/utils';
import { QUEUE } from '../../../constants';
import { LoggerService } from '../../../shared/services/logger.service';
import { NflowService } from '../../nflow/services/nflow.service';
import { EventValidityDto } from '../../voucher/dtos/event-validity.dto';
import { VoucherMetadataDto } from '../../voucher/dtos/voucher-metadata.dto';
import { VoucherValidityDto } from '../../voucher/dtos/voucher-validity.dto';
import { VoucherEntity } from '../../voucher/entities/voucher.entity';
import { VoucherStatusEnum } from '../../voucher/enums/vouchers.enum';
import { SyncLogDto } from '../dtos/sync-log.dto';
import { SyncLogEntity } from '../entities/sync-log.entity';
import { SyncTypeEnum } from '../enums/sync-action.enum';

@Injectable()
export class SyncService {
  constructor(
    @InjectQueue(QUEUE.SYNC.VOUCHER)
    private readonly _queue: Queue<string>,
    private readonly _dataSource: DataSource,
    private readonly _logger: LoggerService,
    private readonly _nflow: NflowService,
  ) {}

  public async log(dto: SyncLogDto): Promise<void> {
    try {
      await this._dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(SyncLogEntity);

        // Make sure only one log for each object
        await repo.delete({ objectId: dto.objectId, type: dto.type });
        await repo.save(dto);
      });
    } catch (error) {
      this._logger.error(error);
    }
  }

  /**
   * @deprecated remove in next release
   */
  // TODO: Remove this method in the next release
  public async addValidityVoucher({
    checkValidity = true,
  }: {
    checkValidity?: boolean;
  }): Promise<void> {
    try {
      const events = await this._nflow.search<EventValidityDto>(
        NflowService.EVENT,
        {
          select: Object.keys(new EventValidityDto()),
        },
      );
      if (!events?.length) return;

      const builder = this._dataSource
        .getRepository(VoucherEntity)
        .createQueryBuilder('voucher')
        .where('voucher.status = :status', {
          status: VoucherStatusEnum.AVAILABLE,
        });

      if (checkValidity) {
        builder.andWhere(
          new Brackets((qb) => {
            qb.where('voucher.validity IS NULL');
            qb.orWhere(`voucher.validity = '{}'`);
          }),
        );
      }

      const availableVouchers = await builder.getMany();

      const voucherIds = availableVouchers?.map((voucher) => voucher.id);
      if (!voucherIds?.length) return;

      const validity: VoucherValidityDto = {
        excludeTimes: events.map((event) => ({
          guid: event.guid,
          name: event.name,
          description: event.description,
          start: toUtc(event.start),
          end: toUtc(event.end),
        })),
      };

      const result = await this._dataSource.getRepository(VoucherEntity).update(
        {
          id: In(voucherIds),
          status: VoucherStatusEnum.AVAILABLE,
        },
        {
          validity: validity,
        },
      );

      if (result?.affected) {
        const jobs = voucherIds.map((id) => ({
          name: SyncTypeEnum.VOUCHER,
          data: id,
        }));

        await this._queue.addBulk(jobs);
      }
    } catch (error) {
      this._logger.error(error);
    }
  }

  public async syncVoucher(): Promise<void> {
    const batchSize = 1000;
    let offset = 0;
    let vouchers: VoucherEntity[] = [];

    do {
      try {
        vouchers = await this._dataSource.getRepository(VoucherEntity).find({
          skip: offset,
          take: batchSize,
          where: {
            status: Not(VoucherStatusEnum.DRAFT),
          },
          select: ['id'],
          order: {
            createdAt: 'DESC',
          },
        });

        const jobs = (vouchers || []).map((v) => ({
          name: SyncTypeEnum.VOUCHER,
          data: v.id,
        }));

        await this._queue.addBulk(jobs);

        offset += batchSize;
      } catch (error) {
        this._logger.error(error);
      }
    } while (vouchers.length === batchSize);
  }

  public async syncVoucherById(id: string): Promise<void> {
    await this._queue.add(SyncTypeEnum.VOUCHER, id);
  }

  public async migrateVoucherMetadata(): Promise<void> {
    const batchSize = 1000;
    let offset = 0;
    let vouchers: VoucherEntity[] = [];

    do {
      try {
        vouchers = await this._dataSource.getRepository(VoucherEntity).find({
          skip: offset,
          take: batchSize,
          order: {
            createdAt: 'DESC',
          },
        });

        const updateData = await this._getVoucherMetadata(vouchers);
        const ids = Object.keys(updateData);

        if (ids?.length) {
          // Construct the VALUES clause for the raw SQL query
          const values = Object.entries(updateData)
            .map(
              ([id, metadata]) =>
                `('${id}'::uuid, '${JSON.stringify(metadata)}'::json)`,
            )
            .join(', ');

          const query = `
            UPDATE vouchers
            SET data = v.data
            FROM (VALUES ${values}) AS v(id, data)
            WHERE vouchers.id = v.id
          `;
          await this._dataSource.query(query);

          this._logger.info(
            `Updated ${ids.length} vouchers with metadata offset ${offset}`,
          );
        }
      } catch (error) {
        this._logger.error(error);
      } finally {
        offset += batchSize;
      }
    } while (vouchers.length === batchSize);
  }

  private async _getVoucherMetadata(
    entities: VoucherEntity[],
  ): Promise<Record<string, VoucherMetadataDto>> {
    try {
      const voucherIds = entities.map((e) => e.id);
      const orderIds = entities
        .filter((e) => e.status === VoucherStatusEnum.USED && e.orderId)
        .map((e) => e.orderId);

      const tasks = [
        this._dataSource.query(
          `SELECT package_id, order_id, voucher_id FROM package_vouchers WHERE voucher_id = ANY($1) AND status = 'completed'`,
          [voucherIds],
        ),
      ];

      if (orderIds?.length) {
        tasks.push(
          this._dataSource.query(
            `SELECT id, data, increment_id, created_at FROM orders WHERE id = ANY($1)`,
            [orderIds],
          ),
        );
      }

      const [pkgVoucher, orderVoucher] = await Promise.all(tasks);

      const voucherMap: Record<string, VoucherMetadataDto> = {};
      for (const voucher of entities) {
        const pkg = (pkgVoucher || []).find(
          (p: any) => p.voucher_id === voucher.id,
        );
        const order = (orderVoucher || []).find(
          (o: any) => o.id === voucher.orderId,
        );

        if (pkg || order) {
          voucherMap[voucher.id] = {
            packageId: pkg?.package_id,
            orderPackageId: pkg?.order_id,
            stationId: order?.data?.stationId,
            stationName: order?.data?.stationName,
            orderIncrementId: order?.increment_id,
            orderCreatedAt: order?.created_at,
          };
        }
      }

      return voucherMap;
    } catch (error) {
      this._logger.error(error);
      return {};
    }
  }

  public async migrateVoucherExclusion(): Promise<void> {
    const events = await this._nflow.search<EventValidityDto>(
      NflowService.EVENT,
      {
        select: Object.keys(new EventValidityDto()),
      },
    );
    if (!events?.length) return;

    const excludeTimes = events.map((event) => ({
      guid: event.guid,
      name: event.name,
      description: event.description,
      start: toUtc(event.start),
      end: toUtc(event.end),
    }));

    const batchSize = 1000;
    let offset = 0;
    let vouchers: VoucherEntity[] = [];
    const repository = this._dataSource.getRepository(VoucherEntity);

    do {
      vouchers = await repository
        .createQueryBuilder('v')
        .where({
          status: VoucherStatusEnum.AVAILABLE,
        })
        .andWhere(
          new Brackets((qb) => {
            qb.where(`v.name = 'Tặng lượt rửa DELUXE'`)
              .orWhere(`v.name = 'Miễn phí 1 lần rửa xe'`)
              .orWhere(`v.data->>'orderPackageId' IS NOT NULL`)
              .orWhere(`v.validity->>'excludeTimes' != '[]'`);
          }),
        )
        .skip(offset)
        .take(batchSize)
        .orderBy('v.createdAt', 'ASC')
        .getMany();

      this._logger.info(
        `[Migrate Voucher Exclusion] Start offset ${offset} - ${vouchers.length}`,
      );

      if (vouchers.length) {
        const voucherIds = vouchers.map((v) => v.id);
        await repository.query(
          `
          UPDATE vouchers
          SET validity = validity || jsonb_build_object('excludeTimes', $1::jsonb)
          WHERE id = ANY($2)
          `,
          [JSON.stringify(excludeTimes), voucherIds],
        );
      }
      offset += batchSize;
    } while (vouchers.length === batchSize);

    this._logger.info(`[Migrate Voucher Exclusion] Done`);
  }
}
