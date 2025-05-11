import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, FindOptionsWhere, Not, Repository } from 'typeorm';

import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { W24Error } from '../../../constants/error-code';
import { LoggerService } from '../../../shared/services/logger.service';
import { EasyInvoiceSetting } from '../../easyinvoice/dtos/easy-invoice-setting.dto';
import { EasyInvoiceFactoryService } from '../../easyinvoice/services/easy-invoice-factory.service';
import { InvoiceProviderDto } from '../dtos/invoice-provider.dto';
import { InvoiceProviderRequestDto } from '../dtos/requests/invoice-provider.request.dto';
import { InvoiceProviderEntity } from '../entities/invoice-provider.entity';
import { InvoiceProviderStatus } from '../enums/invoice-provider-status.enum';
import { InvoiceType } from '../enums/invoice-type.enum';
import { IInvoiceConnector } from '../interfaces/invoice-connector.interface';
import { EncryptService } from './encrypt.service';

@Injectable()
export class InvoiceProviderService {
  private readonly repo: Repository<InvoiceProviderEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    private readonly _dataSource: DataSource,
    private readonly _logger: LoggerService,
    private readonly _encryptService: EncryptService,
    private readonly _encrypt: EncryptService,
    private readonly _easyinvoice: EasyInvoiceFactoryService,
  ) {
    this.repo = this._dataSource.getRepository(InvoiceProviderEntity);
  }

  public save(
    entity: Partial<InvoiceProviderEntity>,
  ): Promise<InvoiceProviderEntity> {
    try {
      return this._dataSource.transaction(async (manager) => {
        const providerRepo = manager.getRepository(InvoiceProviderEntity);
        const provider = await providerRepo.save(entity);

        if (provider.status === InvoiceProviderStatus.ACTIVE) {
          await providerRepo.update(
            { id: Not(provider.id) },
            { status: InvoiceProviderStatus.INACTIVE },
          );
        }

        return provider;
      });
    } catch (err) {
      this._logger.error(err);
      return null;
    }
  }

  public get(
    findData: FindOptionsWhere<InvoiceProviderEntity>,
  ): Promise<InvoiceProviderEntity> {
    try {
      return this.repo.findOne({ where: findData });
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }

  public async getList(
    query: PaginationRequestDto,
  ): Promise<PaginationResponseDto<InvoiceProviderDto>> {
    const [items, meta] = await this.repo
      .createQueryBuilder('providers')
      .orderBy('providers.createdAt', query.order)
      .paginate(query);

    const dtos = this._mapper.mapArray(
      items,
      InvoiceProviderEntity,
      InvoiceProviderDto,
    );
    return dtos.toPagination(meta);
  }

  public async getDetail(id: string): Promise<InvoiceProviderDto> {
    const entity = await this.repo.findOneBy({ id });

    if (!entity) {
      throw new BadRequestException(W24Error.NotFound('Provider'));
    }

    return this._mapper.map(entity, InvoiceProviderEntity, InvoiceProviderDto);
  }

  public async create(
    dto: InvoiceProviderRequestDto,
  ): Promise<InvoiceProviderDto> {
    const entity = this._mapper.map(
      dto,
      InvoiceProviderRequestDto,
      InvoiceProviderEntity,
    );

    if (entity.config.password) {
      entity.config.password = this._encryptService.encryptPassword(
        entity.config.password,
      );
    }

    const result = await this.save(entity);
    return this._mapper.map(result, InvoiceProviderEntity, InvoiceProviderDto);
  }

  public async update(
    dto: InvoiceProviderRequestDto,
  ): Promise<InvoiceProviderDto> {
    if (!dto.id) {
      throw new BadRequestException(W24Error.MissingRequiredField('Id'));
    }

    const entity = await this.get({ id: dto.id });

    if (!entity) {
      throw new BadRequestException(W24Error.NotFound('Provider'));
    }

    const updateEntity = this._mapper.map(
      dto,
      InvoiceProviderRequestDto,
      InvoiceProviderEntity,
    );

    if (!updateEntity.config?.password) {
      updateEntity.config.password = entity.config.password;
    } else {
      updateEntity.config.password = this._encryptService.encryptPassword(
        updateEntity.config.password,
      );
    }

    const result = await this.save(updateEntity);
    return this._mapper.map(result, InvoiceProviderEntity, InvoiceProviderDto);
  }

  public async delete(id: string): Promise<boolean> {
    try {
      const provider = await this.get({ id });
      if (!provider) {
        throw new BadRequestException(W24Error.NotFound('Provider'));
      }

      await this.repo.delete(id);
      return true;
    } catch (error) {
      this._logger.error(error);
      return false;
    }
  }

  public async testConnection(id: string): Promise<boolean> {
    const provider = await this.get({ id });

    if (!provider) {
      throw new BadRequestException(W24Error.NotFound('Provider'));
    }

    const connector = this.resolveService(provider.type, provider.config);
    if (!connector) {
      throw new BadRequestException(W24Error.InvalidField('Provider'));
    }

    const canConnect = await connector.testConnection();
    return canConnect;
  }

  public resolveService(
    type: InvoiceType,
    config: EasyInvoiceSetting,
  ): IInvoiceConnector {
    switch (type) {
      case InvoiceType.EASYINVOICE: {
        const password = this._encrypt.decryptPassword(config.password);
        return this._easyinvoice.create({
          ...config,
          password,
        }) as IInvoiceConnector;
      }
      default:
        return null;
    }
  }
}
