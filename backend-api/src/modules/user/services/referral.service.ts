import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { ReferralAndNameDto, ReferralDto } from '../dtos/referral.dto';
import { ReferralEntity } from '../entities/referral.entity';

@Injectable()
export class ReferralService {
  private readonly _referralRepository: Repository<ReferralEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    private readonly _dataSource: DataSource,
  ) {
    this._referralRepository = this._dataSource.getRepository(ReferralEntity);
  }

  public async getReferrals(
    query: PaginationRequestDto,
  ): Promise<PaginationResponseDto<ReferralDto>> {
    const [items, meta] = await this._referralRepository
      .createQueryBuilder('referrals')
      .leftJoinAndSelect('referrals.referralUser', 'referralUser')
      .leftJoinAndSelect('referrals.referredUser', 'referredUser')
      .select([
        'referrals.id',
        'referrals.referralId',
        'referrals.referredId',
        'referrals.referralCode',
        'referrals.createdAt',
        'referralUser.email',
        'referralUser.lastName',
        'referralUser.firstName',
        'referredUser.email',
        'referredUser.lastName',
        'referredUser.firstName',
      ])
      .orderBy('referrals.createdAt', query.order)
      .paginate(query);

    const dtos = this._mapper.mapArray(
      items,
      ReferralEntity,
      ReferralAndNameDto,
    );
    return dtos.toPagination(meta);
  }
}
