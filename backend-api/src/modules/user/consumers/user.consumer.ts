import { Process, Processor } from '@nestjs/bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job } from 'bull';
import { Brackets, DataSource, Not } from 'typeorm';

import { normalizeEmail } from '../../../common/utils';
import { EVENT, QUEUE } from '../../../constants';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { VoucherService } from '../../../shared/services/voucher.service';
import { ActivityLogDto } from '../../activity-logs/dtos/activity-log.dto';
import { IFreeWashVoucherLog } from '../../activity-logs/dtos/activity-value.dto';
import { ActivityLogEntity } from '../../activity-logs/entities/activity-log.entity';
import { ActionActivityEnum } from '../../activity-logs/enums/action-activity.enum';
import { NflowService } from '../../nflow/services/nflow.service';
import { UserEntity } from '../entities/user.entity';
import { UserStatus } from '../enums/user-status.enum';
import { UserType } from '../enums/user-type.enum';

@Processor(QUEUE.USER.REDEEM_VOUCHER)
export class UserConsumer {
  constructor(
    private readonly _voucherService: VoucherService,
    private readonly _config: ApiConfigService,
    private readonly _dataSource: DataSource,
    private readonly _logger: LoggerService,
    private readonly _nflow: NflowService,
    private readonly _emitter: EventEmitter2,
  ) {}

  @Process(QUEUE.USER.REDEEM_VOUCHER)
  async handleRedeemVoucher(job: Job<string>) {
    try {
      const id = job.data;
      if (!id) return;

      const user = await this._dataSource
        .getRepository(UserEntity)
        .findOneBy({ id });

      const isNewUser = await this._validateNewUser(user);
      if (!isNewUser) return;

      const canRedeemed = await this._validateFreeWashRedeemed(user.email);
      if (!canRedeemed) return;

      const excludeTimes = await this._nflow.getEvents();
      const voucher = await this._voucherService.createFreeWashVoucher(
        user,
        excludeTimes,
      );

      if (voucher) {
        const log: ActivityLogDto = {
          objectId: user.id,
          action: ActionActivityEnum.UserRedeemedFreeWash,
          value: {
            voucherId: voucher.id,
            email: user.email,
          } as IFreeWashVoucherLog,
        };
        this._emitter.emit(EVENT.ACTIVITY_LOG, log);
      }
    } catch (error) {
      this._logger.error(error);
    }
  }

  private async _validateNewUser(user: UserEntity): Promise<boolean> {
    try {
      if (!this._config.voucher.freeNewUser) {
        return false;
      }

      if (user.type !== UserType.CLIENT) {
        return false;
      }

      const builder = this._dataSource
        .getRepository(UserEntity)
        .createQueryBuilder('u')
        .withDeleted()
        .where({
          id: Not(user.id),
          status: Not(UserStatus.INACTIVE),
        });

      builder.andWhere(
        new Brackets((qb) => {
          // * deleted email is <email>:deleted:<timestamp>
          qb.where(`SPLIT_PART(u.email, ':deleted:', 1) = :email`, {
            email: user.email,
          }).orWhere({ socialId: user.socialId });
        }),
      );

      const result = await builder.getOne();
      return !result;
    } catch (error) {
      this._logger.error(error);
      return false;
    }
  }

  private async _validateFreeWashRedeemed(email: string): Promise<boolean> {
    try {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) {
        return false;
      }

      const [localPart, domain] = normalizedEmail.split('@');

      const logs = await this._dataSource
        .getRepository(ActivityLogEntity)
        .createQueryBuilder('logs')
        .where({
          action: ActionActivityEnum.UserRedeemedFreeWash,
        })
        .andWhere(
          `logs.value IS NOT NULL
            AND SPLIT_PART("logs"."value"::jsonb->>'email', '@', 1) LIKE :localPart
            AND SPLIT_PART("logs"."value"::jsonb->>'email', '@', 2) =:domain
            `,
          {
            localPart: `${localPart}%`,
            domain,
          },
        )
        .getMany();

      if (!logs?.length) return true;

      return logs.every(
        (log) => normalizeEmail(log.value?.email) !== normalizedEmail,
      );
    } catch (error) {
      this._logger.error(error);
      return true;
    }
  }
}
