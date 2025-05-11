import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DataSource, Not, Repository } from 'typeorm';

import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { W24Error } from '../../../constants/error-code';
import { GPayService } from '../../payment/services/gpay.service';
import { UserTokenDto } from '../dtos/user-token.dto';
import { UserTokenEntity } from '../entities/user-token.entity';

@Injectable()
export class UserTokenService {
  private readonly _userTokenRepository: Repository<UserTokenEntity>;

  constructor(
    private _dataSource: DataSource,
    @InjectMapper() private readonly _mapper: Mapper,
    @Inject(REQUEST) private readonly _req: any,
    private readonly _gpay: GPayService,
  ) {
    this._userTokenRepository = this._dataSource.getRepository(UserTokenEntity);
  }

  public async getUserTokens(
    query: PaginationRequestDto,
  ): Promise<PaginationResponseDto<UserTokenDto>> {
    const userId = this._req.user.id;
    if (!userId) throw new ForbiddenException();

    const builder = this._userTokenRepository
      .createQueryBuilder('tokens')
      .where({ createdBy: userId })
      .orderBy('tokens.isDefault', 'DESC')
      .addOrderBy('tokens.createdAt', query.order);

    const [items, meta] = await builder.paginate(query);

    const dtos = this._mapper.mapArray(items, UserTokenEntity, UserTokenDto);
    return dtos.toPagination(meta);
  }

  public async delete(id: string): Promise<boolean> {
    const userId = this._req.user.id;
    if (!userId) throw new ForbiddenException();

    const userToken = await this._userTokenRepository.findOneBy({
      id,
      createdBy: userId,
    });
    if (!userToken) {
      throw new BadRequestException(W24Error.NotFound('Token'));
    }

    const isDeleted = await this._gpay.deleteToken(userToken.token);
    if (!isDeleted) {
      throw new BadRequestException(W24Error.UnexpectedError);
    }

    return this._dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(UserTokenEntity);

      if (userToken.isDefault) {
        const nextDefault = await repo.findOneBy({
          createdBy: userId,
          id: Not(id),
        });
        if (nextDefault) {
          await repo.update(nextDefault.id, { isDefault: true });
        }
      }

      await repo.delete(id);

      return true;
    });
  }

  public async setDefaultToken(id: string): Promise<boolean> {
    const userId = this._req.user.id;
    if (!userId) throw new ForbiddenException();

    const userToken = await this._userTokenRepository.findOneBy({
      id,
      createdBy: userId,
    });
    if (!userToken) {
      throw new BadRequestException(W24Error.NotFound('Token'));
    }

    return this._dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(UserTokenEntity);

      await repo.update(
        { id: Not(id), createdBy: userId },
        { isDefault: false },
      );
      await repo.update(id, { isDefault: true });

      return true;
    });
  }
}
