import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { DataSource, Repository } from 'typeorm';

import { EVENT } from '../../../constants';
import { GeneratorProvider } from '../../../providers';
import { LoggerService } from '../../../shared/services/logger.service';
import { NflowService } from '../../nflow/services/nflow.service';
import { B2bVoucherCodeDto } from '../dtos/b2b-voucher-code.dto';
import { B2bVoucherEntity } from '../entities/b2b-voucher.entity';
import { B2bVoucherCodeEntity } from '../entities/b2b-voucher-code.entity';
import { B2bVoucherStatus } from '../enums/b2b-voucher.enum';
import { B2bVoucherCodeStatus } from '../enums/b2b-voucher-code.enum';
import { B2bVoucherService } from '../services/b2b-voucher.service';

@Injectable()
export class B2bVoucherListener {
  private readonly _b2bVoucherRepository: Repository<B2bVoucherEntity>;
  private readonly _b2bVoucherCodeRepository: Repository<B2bVoucherCodeEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    private readonly _logger: LoggerService,
    private readonly _dataSource: DataSource,
    private readonly _nflow: NflowService,
    private readonly _emitter: EventEmitter2,
    private readonly _b2bVoucher: B2bVoucherService,
  ) {
    this._b2bVoucherRepository =
      this._dataSource.getRepository(B2bVoucherEntity);
    this._b2bVoucherCodeRepository =
      this._dataSource.getRepository(B2bVoucherCodeEntity);
  }

  @OnEvent(EVENT.B2B_VOUCHER.CREATED)
  async handleB2bVoucherCreated(id: string) {
    const entity = await this._b2bVoucherRepository.findOne({
      where: {
        id,
        status: B2bVoucherStatus.ACTIVE,
      },
      relations: ['invoice'],
    });
    if (!entity) {
      this._logger.error(`[B2B Voucher] Voucher ${id} not found`);
      return;
    }

    let codes: B2bVoucherCodeEntity[] = [];

    try {
      codes = await this.generateVoucherCodes(entity);
    } catch (error) {
      this._logger.error(error);
    }

    const isGenerated = !!codes.length;

    await this._b2bVoucherRepository.update(id, {
      status: isGenerated
        ? B2bVoucherStatus.COMPLETED
        : B2bVoucherStatus.FAILED,
    });

    if (isGenerated) {
      const voucherCodes = this._mapper.mapArray(
        codes,
        B2bVoucherCodeEntity,
        B2bVoucherCodeDto,
      );
      await this._nflow.createB2bCodes(voucherCodes);
      await this._b2bVoucher.handleIssueInvoice(entity);
    }
  }

  private async generateVoucherCodes(
    entity: B2bVoucherEntity,
  ): Promise<B2bVoucherCodeEntity[]> {
    const requiredQuantity = entity.codeQuantity;
    if (requiredQuantity <= 0) return [];

    const maxAttempt = 5;

    for (let attempt = 0; attempt < maxAttempt; attempt++) {
      const newCodes = this.generateCodes(requiredQuantity);

      const voucherCodes: Array<Partial<B2bVoucherCodeEntity>> = Array.from(
        newCodes,
      ).map((code) => ({
        b2bVoucherId: entity.id,
        code,
      }));

      try {
        const result = await this._b2bVoucherCodeRepository.save(voucherCodes);
        return result;
      } catch (error) {
        this._logger.warn(
          `[B2B Voucher] Attempt ${attempt + 1} failed to save some codes. Retrying...`,
        );
      }
    }

    return [];
  }

  private generateCodes(quantity: number): string[] {
    if (quantity <= 0) {
      return [];
    }

    const codes = new Set<string>();

    while (codes.size < quantity) {
      const code = GeneratorProvider.generateVoucherCode();
      codes.add(code);
    }

    return Array.from(codes);
  }

  @OnEvent(EVENT.B2B_VOUCHER.RECALLED)
  async handleB2bVoucherRecalled(b2bVoucherId: string) {
    const entities = await this._dataSource
      .getRepository(B2bVoucherCodeEntity)
      .find({
        where: {
          b2bVoucherId: b2bVoucherId,
          status: B2bVoucherCodeStatus.RECALLED,
        },
        select: ['id'],
      });

    if (!entities) {
      this._logger.error(
        `[B2B Voucher] Codes for voucher ${b2bVoucherId} not found`,
      );
      return;
    }

    const codeIds = entities.map((entity) => entity.id);
    await this._nflow.recallB2bCodes(codeIds);
  }

  @OnEvent(EVENT.B2B_VOUCHER.USED)
  async handleB2bVoucherUsed(voucherId: string) {
    const b2bCode = await this._b2bVoucherCodeRepository.findOneBy({
      voucherId,
      status: B2bVoucherCodeStatus.REDEEMED,
    });
    if (!b2bCode) {
      this._logger.error(`[B2B Voucher] Voucher ${voucherId} not found`);
      return;
    }

    const result = await this._b2bVoucherCodeRepository.update(b2bCode.id, {
      status: B2bVoucherCodeStatus.USED,
    });

    if (result?.affected) {
      this._emitter.emit(EVENT.SYNC.B2B_VOUCHER_CODE, b2bCode.id);
    }
  }

  @OnEvent(EVENT.B2B_VOUCHER.ROLLBACK)
  async handleB2bVoucherRollback(voucherId: string) {
    const b2bCode = await this._b2bVoucherCodeRepository.findOneBy({
      voucherId,
      status: B2bVoucherCodeStatus.USED,
    });
    if (!b2bCode) {
      this._logger.error(`[B2B Voucher] Voucher ${voucherId} not found`);
      return;
    }

    const result = await this._b2bVoucherCodeRepository.update(b2bCode.id, {
      status: B2bVoucherCodeStatus.REDEEMED,
    });

    if (result?.affected) {
      this._emitter.emit(EVENT.SYNC.B2B_VOUCHER_CODE, b2bCode.id);
    }
  }
}
