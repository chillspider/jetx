import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Injectable } from '@nestjs/common';
import { JobOptions, Queue } from 'bull';
import { isArray } from 'lodash';
import { Brackets, DataSource, In, IsNull, Like } from 'typeorm';

import { getImageBuffer } from '../../../common/utils';
import { QUEUE } from '../../../constants';
import { SyncActionEnum } from '../../../constants/action';
import { IMG_PATH } from '../../../constants/config';
import { LoggerService } from '../../../shared/services/logger.service';
import { UploadService } from '../../../shared/services/upload.service';
import { CarDetectorEntity } from '../../car-detector/entities/car-detector.entity';
import { OrderEntity } from '../../order/entities/order.entity';
import { OrderStatusEnum } from '../../order/enums/order-status.enum';
import { OrderTypeEnum } from '../../order/enums/order-type.enum';
import { UserEntity } from '../../user/entities/user.entity';
import { UserType } from '../../user/enums/user-type.enum';
import { SyncRequestDto } from '../dtos/requests/sync.request.dto';
import { SyncLogDto } from '../dtos/sync-log.dto';
import { SyncLogEntity } from '../entities/sync-log.entity';
import { SyncTypeEnum } from '../enums/sync-action.enum';

type BulkJob = {
  data: SyncRequestDto;
  opts?: Omit<JobOptions, 'repeat'> | undefined;
  name?: string;
};

@Injectable()
export class SyncService {
  constructor(
    @InjectQueue(QUEUE.SYNC.USER)
    private readonly _queue: Queue<SyncRequestDto>,
    @InjectQueue(QUEUE.SYNC.ORDER)
    private readonly _orderQueue: Queue<SyncRequestDto>,
    @InjectQueue(QUEUE.SYNC.CAMPAIGN)
    private readonly _campaignQueue: Queue<SyncRequestDto>,
    private readonly _dataSource: DataSource,
    private readonly _logger: LoggerService,
    private readonly _upload: UploadService,
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

  public async getUnSyncedUsers(): Promise<UserEntity[]> {
    // Get list users not synced
    const users = await this._dataSource.getRepository(UserEntity).find({
      where: {
        type: UserType.CLIENT,
        nflowId: IsNull(),
      },
      select: ['id'],
      order: { createdAt: 'ASC' },
    });

    return users;
  }

  public async handleSyncUsers(): Promise<void> {
    const users = await this.getUnSyncedUsers();
    if (!users?.length) return;

    const jobs = users.map((user) => ({
      data: {
        action: SyncActionEnum.Sync,
        id: user.id,
      },
      opts: {
        jobId: `${SyncActionEnum.Sync}_${user.id}`,
      },
      name: SyncTypeEnum.USER,
    }));

    await this._queue.addBulk(jobs);
  }

  public async handleRetrySyncs({
    type,
  }: {
    type?: SyncTypeEnum;
  }): Promise<void> {
    const builder = this._dataSource
      .getRepository(SyncLogEntity)
      .createQueryBuilder('sl')
      .where({ synced: false });

    if (type) {
      builder.andWhere({ type: type });
    }

    const logs = await builder.orderBy('sl.created_at', 'ASC').getMany();
    if (!logs?.length) return;

    const userJobs: BulkJob[] = [];
    const orderJobs: BulkJob[] = [];

    logs.forEach((log) => {
      const job = {
        data: {
          action: log.action,
          id: log.objectId,
        },
        opts: {
          jobId: `${log.action}_${log.objectId}`,
        },
        name: type,
      };

      switch (log.type) {
        case SyncTypeEnum.USER:
          userJobs.push(job);
          break;
        case SyncTypeEnum.ORDER:
        case SyncTypeEnum.ORDER_ITEM:
        case SyncTypeEnum.ORDER_TRANSACTION:
          orderJobs.push(job);
          break;

        default:
          break;
      }
    });

    if (userJobs.length) {
      await this._queue.addBulk(userJobs);
    }

    if (orderJobs.length) {
      await this._orderQueue.addBulk(orderJobs);
    }
  }

  public async getUnSyncedOrders(): Promise<OrderEntity[]> {
    const orders = await this._dataSource
      .getRepository(OrderEntity)
      .createQueryBuilder('o')
      .where('o.nflow_id IS NULL')
      .andWhere(
        new Brackets((qb) => {
          qb.where(`(o.type != :tokenizeType AND o.status != :draftStatus)`, {
            tokenizeType: OrderTypeEnum.TOKENIZE,
            draftStatus: OrderStatusEnum.DRAFT,
          }).orWhere(
            `(o.type = :tokenizeType AND o.status = :completedStatus)`,
            {
              tokenizeType: OrderTypeEnum.TOKENIZE,
              completedStatus: OrderStatusEnum.COMPLETED,
            },
          );
        }),
      )
      .select(['o.id'])
      .orderBy('o.created_at', 'ASC')
      .getMany();

    return orders;
  }

  public async handleSyncOrders(): Promise<void> {
    const orders = await this.getUnSyncedOrders();

    if (!orders?.length) return;

    const jobs = orders.map((order) => ({
      name: SyncTypeEnum.ORDER,
      data: {
        action: SyncActionEnum.Sync,
        id: order.id,
      },
      opts: {
        jobId: `${SyncActionEnum.Sync}_${order.id}`,
      },
    }));

    await this._orderQueue.addBulk(jobs);
  }

  public async handleSyncs(): Promise<void> {
    const syncTasks = [
      {
        name: 'retry syncs failure',
        handler: this.handleRetrySyncs.bind(this),
      },
      {
        name: 'sync users',
        handler: this.handleSyncUsers.bind(this),
      },
      {
        name: 'sync orders',
        handler: this.handleSyncOrders.bind(this),
      },
    ];

    for (const task of syncTasks) {
      try {
        this._logger.info(`[SYNC]: Start ${task.name}`);
        await task.handler();
        this._logger.info(`[SYNC]: End ${task.name}`);
      } catch (error) {
        this._logger.error(`[SYNC]: Failed ${task.name} >>>>`);
        this._logger.error(error);
      }
    }
  }

  public async handleSync(
    data: string | string[],
    type: SyncTypeEnum,
  ): Promise<void> {
    try {
      const queue = this.getQueue(type);

      if (isArray(data)) {
        const jobs = data.map((id) => ({
          data: {
            action: SyncActionEnum.Sync,
            id,
          },
          opts: {
            jobId: `${SyncActionEnum.Sync}_${id}`,
          },
          name: type,
        }));

        await queue.addBulk(jobs);

        return;
      }

      await queue.add(
        type,
        {
          action: SyncActionEnum.Sync,
          id: data,
        },
        {
          jobId: `${SyncActionEnum.Sync}_${data}`,
        },
      );
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  private getQueue(type: SyncTypeEnum): Queue<SyncRequestDto> {
    switch (type) {
      case SyncTypeEnum.ORDER:
        return this._orderQueue;
      case SyncTypeEnum.USER:
        return this._queue;
      case SyncTypeEnum.CAMPAIGN:
        return this._campaignQueue;
      default:
        throw new BadRequestException('Invalid sync type');
    }
  }

  public async migrateUserStationId(): Promise<void> {
    const batchSize = 1000;
    const repository = this._dataSource.getRepository(UserEntity);

    let users: UserEntity[] = [];
    let offset = 0;

    do {
      this._logger.info(
        `[MIGRATE USER STATION ID]: Processing (${(offset + 1) * batchSize})`,
      );

      users = await repository.find({
        where: {
          stationId: IsNull(),
        },
        withDeleted: true,
        select: ['id', 'stationId'],
        skip: offset,
        take: batchSize,
        order: {
          createdAt: 'ASC',
        },
      });

      const migrateUserIds = users.filter((u) => !u.stationId).map((u) => u.id);

      const orders = await this._dataSource
        .getRepository(OrderEntity)
        .createQueryBuilder('o')
        .where({
          customerId: In(migrateUserIds),
          status: OrderStatusEnum.COMPLETED,
          type: OrderTypeEnum.DEFAULT,
        })
        .andWhere(`o.data->>'stationId' IS NOT NULL`)
        .distinctOn(['o.customerId'])
        .select(['o.customerId', 'o.data', 'o.id'])
        .orderBy('o.customerId', 'ASC')
        .addOrderBy('o.createdAt', 'ASC')
        .getMany();

      if (orders?.length) {
        const values = orders
          .map(
            ({ customerId, data }) =>
              `('${customerId}'::uuid, '${data?.stationId}')`,
          )
          .join(', ');

        const query = `
            UPDATE users
            SET station_id = v.station_id
            FROM (VALUES ${values}) AS v(id, station_id)
            WHERE users.id = v.id
          `;
        try {
          await repository.query(query);
        } catch (error) {
          this._logger.error(error);
        }
      }

      this._logger.info(
        `[MIGRATE USER STATION ID]: Migrated (${(offset + 1) * batchSize})`,
      );

      offset += batchSize;
    } while (users.length === batchSize);

    this._logger.info(`[MIGRATE USER STATION ID]: Migrated done`);
  }

  public async migrateDetectorImages(): Promise<void> {
    const batchSize = 100;
    const repository = this._dataSource.getRepository(CarDetectorEntity);

    const detectors = await repository.find({
      where: {
        imageUrl: Like('https://source-us.yigoli.com%'),
      },
      select: ['id', 'imageUrl'],
    });

    const total = detectors.length;
    this._logger.info(`[MIGRATE DETECTOR IMAGES]: Total ${total} detectors`);
    if (!total) {
      this._logger.info(`[MIGRATE DETECTOR IMAGES]: No detectors to migrate`);
      return;
    }

    let step = 1;

    while (detectors.length > 0) {
      const batch = detectors.splice(0, batchSize);
      const updates: Array<{ id: string; imageUrl: string }> = [];

      this._logger.info(
        `[MIGRATE DETECTOR IMAGES]: Processing (${Math.max(step * batchSize, total)}/${total})`,
      );

      // Process images
      for (const detector of batch) {
        try {
          this._logger.log(`[MIGRATE DETECTOR IMAGES]: Image ${detector.id}`);

          const image = await getImageBuffer(detector.imageUrl);
          const url = await this._upload.uploadImageFromBuffer(
            image.buffer,
            IMG_PATH.CAR,
          );

          updates.push({
            id: detector.id,
            imageUrl: url,
          });
        } catch (error) {
          console.error(
            `Failed to process image for detector ${detector.id}:`,
            error,
          );
        }
      }

      // Perform batch update
      if (updates.length > 0) {
        const values = updates
          .map(({ id, imageUrl }) => `('${id}'::uuid, '${imageUrl}')`)
          .join(', ');

        const query = `
        UPDATE car_detectors
        SET image_url = v.image_url
        FROM (VALUES ${values}) AS v(id, image_url)
        WHERE car_detectors.id = v.id
      `;

        try {
          await repository.query(query);
        } catch (error) {
          this._logger.error(error);
        }
      }

      step++;
    }

    this._logger.info(`[MIGRATE DETECTOR IMAGES]: Migrated done`);
  }

  public async migrateStationForPackageOrders(): Promise<void> {
    const batchSize = 1000;
    const repository = this._dataSource.getRepository(OrderEntity);

    let orders: OrderEntity[] = [];
    let latestId: string;

    do {
      orders = await repository
        .createQueryBuilder('o')
        .where({
          status: OrderStatusEnum.COMPLETED,
          type: OrderTypeEnum.PACKAGE,
        })
        .andWhere(`o.data->>'stationId' IS NULL`)
        .skip(0)
        .take(batchSize)
        .orderBy('o.createdAt', 'ASC')
        .getMany();

      if (!orders?.length) break;

      const latestOrderId = orders[orders.length - 1].id;
      if (latestId && latestOrderId === latestId) break;

      latestId = latestOrderId;

      if (orders?.length) {
        const firstUsageVouchers: Array<{
          order_package_id: string;
          station_id: string;
          station_name: string;
        }> = await this._dataSource.query(
          `
          SELECT DISTINCT ON (v.data->>'orderPackageId')
            v.data->>'orderPackageId' as order_package_id,
            v.data->>'stationId' as station_id,
            v.data->>'stationName' AS station_name
          FROM vouchers AS v
          WHERE
            v.status = 'used'
            AND v.data->>'stationId' IS NOT NULL
            AND v.data->>'stationName' IS NOT NULL
            AND v.data->>'orderPackageId' = ANY($1)
          ORDER BY v.data->>'orderPackageId', v.updated_at ASC
        `,
          [orders.map((o) => o.id)],
        );

        if (firstUsageVouchers?.length) {
          const values = firstUsageVouchers
            .map(
              ({ order_package_id, station_id, station_name }) =>
                `('${order_package_id}'::uuid, '${station_id}', '${station_name}')`,
            )
            .join(', ');

          console.log(values);

          const query = `
            UPDATE orders
            SET data = data || jsonb_build_object('stationId', v.station_id, 'stationName', v.station_name)
            FROM (VALUES ${values}) AS v(id, station_id, station_name)
            WHERE orders.id = v.id;
          `;

          try {
            await repository.query(query);
          } catch (error) {
            this._logger.error(error);
          }
        }
      }
    } while (orders.length === batchSize);
  }
}
