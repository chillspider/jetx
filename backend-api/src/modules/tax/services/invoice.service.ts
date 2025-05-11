import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Queue } from 'bull';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { DataSource, FindOptionsWhere, In, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { EVENT, QUEUE } from '../../../constants';
import { SyncActionEnum } from '../../../constants/action';
import { DEFAULT_TIMEZONE } from '../../../constants/config';
import { W24Error } from '../../../constants/error-code';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { TranslationService } from '../../../shared/services/translation.service';
import { IEasyInvoiceResult } from '../../easyinvoice/interfaces/easy-invoice-result.interface';
import { IInvoiceRequest } from '../../easyinvoice/interfaces/invoice.interface';
import { OrderEntity } from '../../order/entities/order.entity';
import { OrderItemEntity } from '../../order/entities/order-item.entity';
import { OrderStatusEnum } from '../../order/enums/order-status.enum';
import { OrderTypeEnum } from '../../order/enums/order-type.enum';
import { PackageVoucherEntity } from '../../package/entities/package-voucher.entity';
import { WashPackageStatus } from '../../package/enums/voucher-package-status.enum';
import { ProductTypeEnum } from '../../product/enums/products.enum';
import { InvoiceDto } from '../dtos/invoice.dto';
import {
  CreateB2bInvoiceRequestDto,
  InvoiceBillingRequestDto,
  InvoiceItemRequestDto,
} from '../dtos/requests/issue-b2b-invoice.request.dto';
import { InvoiceEntity } from '../entities/invoice.entity';
import { InvoiceBillingEntity } from '../entities/invoice-billing.entity';
import { InvoiceItemEntity } from '../entities/invoice-item.entity';
import { InvoiceProviderEntity } from '../entities/invoice-provider.entity';
import { InvoiceIssueType } from '../enums/invoice-issue-type.enum';
import { InvoiceProcessEnum } from '../enums/invoice-process.enum';
import { InvoiceProviderStatus } from '../enums/invoice-provider-status.enum';
import { InvoiceStatusEnum } from '../enums/invoice-status.enum';
import { InvoiceType } from '../enums/invoice-type.enum';
import { IInvoiceConnector } from '../interfaces/invoice-connector.interface';
import { InvoiceProviderService } from './invoice-provider.service';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class InvoiceService {
  private readonly _invoiceRepository: Repository<InvoiceEntity>;
  private readonly _invoiceProviderRepository: Repository<InvoiceProviderEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    @InjectQueue(QUEUE.INVOICE.PUBLISH)
    private readonly _queue: Queue<InvoiceEntity>,
    private readonly _dataSource: DataSource,
    private readonly _logger: LoggerService,
    private readonly _invoiceProvider: InvoiceProviderService,
    private readonly _config: ApiConfigService,
    private readonly _emitter: EventEmitter2,
    private readonly _i18n: TranslationService,
  ) {
    this._invoiceRepository = this._dataSource.getRepository(InvoiceEntity);
    this._invoiceProviderRepository = this._dataSource.getRepository(
      InvoiceProviderEntity,
    );
  }

  public save(entity: Partial<InvoiceEntity>): Promise<InvoiceEntity> {
    try {
      return this._invoiceRepository.save(entity);
    } catch (err) {
      this._logger.error(err);
      return null;
    }
  }

  public get(
    findData: FindOptionsWhere<InvoiceEntity>,
  ): Promise<InvoiceEntity> {
    try {
      return this._invoiceRepository.findOne({ where: findData });
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }

  public async getList(
    query: PaginationRequestDto,
  ): Promise<PaginationResponseDto<InvoiceDto>> {
    const [items, meta] = await this._invoiceRepository
      .createQueryBuilder('invoices')
      .orderBy('invoices.createdAt', query.order)
      .paginate(query);

    const dtos = this._mapper.mapArray(items, InvoiceEntity, InvoiceDto);
    return dtos.toPagination(meta);
  }

  public async getDetail(id: string): Promise<InvoiceDto> {
    const entity = await this._invoiceRepository.findOneBy({ id });

    if (!entity) {
      throw new BadRequestException(W24Error.NotFound('Invoice'));
    }

    return this._mapper.map(entity, InvoiceEntity, InvoiceDto);
  }

  public async create(dto: InvoiceDto): Promise<InvoiceDto> {
    const entity = this._mapper.map(dto, InvoiceDto, InvoiceEntity);
    const savedEntity = await this.save(entity);

    return this._mapper.map(savedEntity, InvoiceEntity, InvoiceDto);
  }

  public async update(dto: InvoiceDto): Promise<InvoiceDto> {
    if (!dto.id) {
      throw new BadRequestException(W24Error.MissingRequiredField('Id'));
    }

    const entity = await this._invoiceRepository.findOneBy({ id: dto.id });
    if (!entity) {
      throw new BadRequestException(W24Error.NotFound('Invoice'));
    }

    const updatedEntity = this._mapper.map(dto, InvoiceDto, InvoiceEntity);
    if (!updatedEntity.invoiceBillingId && updatedEntity.invoiceBilling?.id) {
      updatedEntity.invoiceBilling.invoiceId = dto.id;
      updatedEntity.invoiceBillingId = updatedEntity.invoiceBilling.id;
    }

    const result = await this.save(updatedEntity);

    return this._mapper.map(result, InvoiceEntity, InvoiceDto);
  }

  public async import(
    orderId: string,
    isReissue: boolean = false,
  ): Promise<InvoiceDto> {
    const [order, items] = await Promise.all([
      this._dataSource.getRepository(OrderEntity).findOneBy({
        id: orderId,
        status: OrderStatusEnum.COMPLETED,
      }),
      this._dataSource.getRepository(OrderItemEntity).findBy({
        orderId: orderId,
      }),
    ]);
    if (!order || !items?.length) {
      throw new BadRequestException(W24Error.NotFound('Order'));
    }

    try {
      const invoice = await this.prepareOrderInvoice(order, items, isReissue);

      await this._queue.add(InvoiceProcessEnum.PUBLISH, invoice, {
        jobId: invoice.orderId,
      });

      return this._mapper.map(invoice, InvoiceEntity, InvoiceDto);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async publish(invoice: InvoiceEntity): Promise<boolean> {
    const setting = await this.getProvider();
    if (!setting) return false;

    const service = this._invoiceProvider.resolveService(
      setting.type,
      setting.config,
    );

    if (!service) return false;

    return this.createAndIssueInvoice(setting, service, invoice);
  }

  public async createAndIssueInvoice(
    setting: InvoiceProviderEntity,
    service: IInvoiceConnector,
    invoice: InvoiceEntity,
  ): Promise<boolean> {
    const payload = this.preparePayload(invoice);
    try {
      await this._invoiceRepository.update(
        { id: invoice.id },
        {
          status: InvoiceStatusEnum.Processing,
          provider: setting.type,
        },
      );
    } catch (err) {
      this._logger.error(err);
    }

    try {
      const res =
        await service.createAndIssueInvoice<IEasyInvoiceResult>(payload);

      let status = InvoiceStatusEnum.Completed;

      if (!res?.result) {
        status = InvoiceStatusEnum.Failed;
      }
      // ! Auto send issuance notice in development mode
      else if (this._config.isDevelopment) {
        const mail = invoice.invoiceBilling?.email;
        if (mail) {
          await service.sendIssuanceNotice(res.externalId, mail);
        }
      }

      await this._invoiceRepository.update(
        {
          id: invoice.id,
        },
        {
          status: status,
          externalId: res?.externalId,
          data: res?.data,
          provider: setting.type,
        },
      );

      if (invoice.issuedType !== InvoiceIssueType.B2B) {
        this._emitter.emit(EVENT.SYNC.ORDER, {
          id: invoice.orderId,
          action: SyncActionEnum.Sync,
        });
      }
    } catch (err) {
      this._logger.error(err);
      return false;
    }

    return true;
  }

  public async resendInvoice(
    orderId: string,
    email?: string,
  ): Promise<boolean> {
    const order = await this._dataSource.getRepository(OrderEntity).findOneBy({
      id: orderId,
      status: OrderStatusEnum.COMPLETED,
    });
    if (!order) {
      throw new BadRequestException(W24Error.NotFound('Order'));
    }

    const invoice = await this._invoiceRepository.findOne({
      where: {
        orderId: order.id,
      },
      relations: ['items', 'invoiceBilling'],
    });

    if (!invoice) {
      // ! Create invoice if not exists
      await this.import(orderId, true);
      throw new BadRequestException(W24Error.UnexpectedError);
    }

    if (invoice.status !== InvoiceStatusEnum.Completed || !invoice.externalId) {
      // ! Re-publish invoice if not completed
      await this._queue.add(InvoiceProcessEnum.PUBLISH, invoice, {
        jobId: invoice.orderId,
      });
      throw new BadRequestException(W24Error.InvoiceNotCompleted);
    }

    const mail = email || invoice.invoiceBilling?.email;
    if (!mail) {
      throw new BadRequestException(W24Error.MissingRequiredField('Email'));
    }

    const setting = await this.getProvider(invoice.provider);
    if (!setting) return false;

    const service = this._invoiceProvider.resolveService(
      setting.type,
      setting.config,
    );
    if (!service) return false;

    return service.sendIssuanceNotice(invoice.externalId, mail);
  }

  private async getProvider(
    type?: InvoiceType,
  ): Promise<InvoiceProviderEntity> {
    try {
      const builder = this._invoiceProviderRepository
        .createQueryBuilder('providers')
        .where({
          status: InvoiceProviderStatus.ACTIVE,
        });

      if (type) {
        builder.andWhere({ type: type });
      }

      return builder.getOne();
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }

  private async prepareOrderInvoice(
    order: OrderEntity,
    orderItems: OrderItemEntity[],
    isReissue: boolean = false,
  ): Promise<InvoiceEntity> {
    const isDiscountEnabled = this._config.invoice.enabledDiscount;

    const invoice = await this._invoiceRepository.findOne({
      where: {
        orderId: order.id,
      },
      relations: ['items', 'invoiceBilling'],
    });

    if (invoice?.status === InvoiceStatusEnum.Completed) {
      throw new BadRequestException(W24Error.UnprocessableContent);
    }

    const isVoucherPaid = await this.isVoucherPaid(order);
    const invoiceId = invoice?.id ?? uuid();

    const items = this.buildInvoiceItems({
      orderItems,
      invoiceId,
      isDiscountEnabled,
      isVoucherPaid,
    });

    const billing: InvoiceBillingEntity = {
      id: invoice?.invoiceBilling?.id ?? uuid(),
      name: order.customerName,
      billingName: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      invoiceId: invoiceId,
    };

    const discountAmount = isDiscountEnabled ? order.discountAmount : 0;

    let issuedDate = dayjs.tz(order.createdAt).format('YYYY-MM-DDTHH:mm:ssZ');

    if (isReissue) {
      issuedDate = dayjs().format('YYYY-MM-DDTHH:mm:ssZ');
    }

    const entity: InvoiceEntity = {
      id: invoiceId,
      orderId: order.id,
      orderIncrementId: order.incrementId,
      items: items,
      status: InvoiceStatusEnum.Draft,
      issuedDate: issuedDate,
      totalAmount: order.grandTotal,
      discountAmount: discountAmount,
      invoiceBilling: billing,
      invoiceBillingId: billing.id,
      data: undefined,
      issuedType: InvoiceIssueType.ORDER,
    };

    try {
      const result = await this._dataSource.transaction(async (manager) => {
        if (invoice?.id) {
          await manager.delete(InvoiceItemEntity, {
            invoiceId: invoice.id,
          });
        }
        return manager.save(InvoiceEntity, entity);
      });

      return result;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  private preparePayload(invoice: InvoiceEntity): IInvoiceRequest {
    const isB2B = invoice.issuedType === InvoiceIssueType.B2B;
    const orderId = `${isB2B ? 'B2B-' : ''}${invoice.orderIncrementId}`;

    return {
      id: invoice.id,
      orderId: orderId,
      buyer: invoice.invoiceBilling
        ? {
            code: invoice.invoiceBilling.code,
            name: invoice.invoiceBilling.name,
            billingName: invoice.invoiceBilling.billingName,
            email: invoice.invoiceBilling.email,
            phone: invoice.invoiceBilling.phone,
            address: invoice.invoiceBilling.address,
          }
        : undefined,
      arisingDate: dayjs(invoice.issuedDate)
        .tz(DEFAULT_TIMEZONE)
        .format('DD/MM/YYYY'),
      totalAmount: invoice.totalAmount,
      discountAmount: invoice.discountAmount,
      items: (invoice.items || []).map((i) => ({
        sku: i.sku,
        name: i.name,
        qty: i.qty,
        taxRate: i.taxRate,
        discountAmount: i.discountAmount,
        unit: i.unit,
        price: i.price,
      })),
    };
  }

  private buildInvoiceItems({
    orderItems,
    invoiceId,
    isDiscountEnabled,
    isVoucherPaid,
  }: {
    orderItems: OrderItemEntity[];
    invoiceId: string;
    isDiscountEnabled: boolean;
    isVoucherPaid: boolean;
  }): InvoiceItemEntity[] {
    return orderItems.flatMap((i) => {
      if (
        i.productType === ProductTypeEnum.PACKAGE &&
        i.data?.packageInvoiceInfo?.length
      ) {
        return i.data.packageInvoiceInfo.map((p) => {
          const item = new InvoiceItemEntity();
          item.invoiceId = invoiceId;
          item.sku = i.id;
          item.taxRate = this._config.taxRate;
          item.qty = i.qty ?? 1;
          item.discountAmount = 0;
          item.name = p.name;
          item.unit = p.unit || this.getProductUnit(i.productType);
          item.price = p.total;
          return item;
        });
      }

      const item = new InvoiceItemEntity();
      item.invoiceId = invoiceId;
      item.sku = i.id;
      item.name = this.formattedProductName(i, isVoucherPaid);
      item.taxRate = this._config.taxRate;
      item.unit = this.getProductUnit(i.productType);
      item.qty = i.qty ?? 1;
      item.price = isDiscountEnabled ? i.originPrice : i.price;
      item.discountAmount = isDiscountEnabled ? i.discountAmount : 0;

      return item;
    });
  }

  public async cancelInvoice(orderId: string): Promise<boolean> {
    try {
      const invoice = await this._invoiceRepository.findOneBy({
        orderId: orderId,
        status: InvoiceStatusEnum.Completed,
      });
      if (!invoice) {
        throw new BadRequestException(W24Error.NotFound('Invoice'));
      }

      if (!invoice.externalId) {
        throw new BadRequestException(W24Error.NotFound('External_Id'));
      }

      const setting = await this.getProvider(invoice.provider);
      if (!setting) return false;

      const service = this._invoiceProvider.resolveService(
        setting.type,
        setting.config,
      );
      if (!service) return false;

      const isCanceled = await service.cancelInvoice(invoice.externalId);
      if (!isCanceled) {
        throw new BadRequestException(W24Error.UnexpectedError);
      }

      await this._invoiceRepository.update(
        { id: invoice.id },
        { status: InvoiceStatusEnum.Canceled },
      );

      this._emitter.emit(EVENT.SYNC.ORDER, {
        id: orderId,
        action: SyncActionEnum.Sync,
      });

      return true;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  private formattedProductName(
    item: OrderItemEntity,
    isVoucherPaid: boolean,
  ): string {
    if (item.productType !== ProductTypeEnum.WASHING) {
      return item.productName;
    }

    let name = this._i18n.t('common.washingService');

    if (item.data?.modeName) {
      name += ` - ${item.data.modeName}`;
    }

    if (isVoucherPaid) {
      name = this._i18n.t('common.serviceDifferencePrice') + ` ${name}`;

      const voucherId = item.discountIds?.[0];
      if (voucherId) {
        name += ` ${voucherId}`;
      }
    }

    return name.trim();
  }

  private getProductUnit(type: ProductTypeEnum): string {
    if (type === ProductTypeEnum.PACKAGE) {
      return 'Gói dịch vụ';
    }

    return 'Lần';
  }

  private async isVoucherPaid(order: OrderEntity): Promise<boolean> {
    if (!order) return false;
    if (order.type !== OrderTypeEnum.DEFAULT) return false;

    const voucherIds = order.discountIds;
    if (!voucherIds?.length) return false;

    try {
      return this._dataSource.getRepository(PackageVoucherEntity).existsBy({
        voucherId: In(voucherIds),
        status: WashPackageStatus.COMPLETED,
      });
    } catch (error) {
      this._logger.error(error);
      return false;
    }
  }

  public async issueB2bInvoice(
    dto: CreateB2bInvoiceRequestDto,
  ): Promise<InvoiceDto> {
    const entity = await this.prepareB2bInvoice(dto);
    if (!entity) {
      throw new BadRequestException(W24Error.UnexpectedError);
    }

    const setting = await this.getProvider();
    if (!setting) {
      throw new BadRequestException(W24Error.NotFound('Invoice Provider'));
    }

    const service = this._invoiceProvider.resolveService(
      setting.type,
      setting.config,
    );

    if (!service) {
      throw new BadRequestException(W24Error.NotFound('Invoice Provider'));
    }

    const isIssued = await this.createAndIssueInvoice(setting, service, entity);
    if (!isIssued) {
      throw new BadRequestException(W24Error.UnexpectedError);
    }

    const invoice = await this._invoiceRepository.findOne({
      where: {
        id: entity.id,
      },
      relations: ['items', 'invoiceBilling'],
    });
    return this._mapper.map(invoice, InvoiceEntity, InvoiceDto);
  }

  private async prepareB2bInvoice(
    dto: CreateB2bInvoiceRequestDto,
  ): Promise<InvoiceEntity> {
    const invoice = await this._invoiceRepository.findOne({
      where: { orderId: dto.orderId },
      relations: ['items', 'invoiceBilling'],
    });
    if (invoice?.status === InvoiceStatusEnum.Completed) {
      throw new BadRequestException(W24Error.UnprocessableContent);
    }

    const invoiceId = invoice?.id ?? uuid();

    const { items, total } = this.buildB2bInvoiceItems({
      items: dto.items,
      invoiceId,
    });

    const billing = this._mapper.map(
      dto.invoiceBilling,
      InvoiceBillingRequestDto,
      InvoiceBillingEntity,
    );
    billing.id = invoice?.invoiceBilling?.id ?? uuid();
    billing.invoiceId = invoiceId;

    const issuedDate = dayjs.tz().format('YYYY-MM-DDTHH:mm:ssZ');

    const entity: InvoiceEntity = {
      id: invoiceId,
      orderId: dto.orderId,
      orderIncrementId: dto.orderIncrementId,
      items: items,
      status: InvoiceStatusEnum.Draft,
      issuedDate: issuedDate,
      totalAmount: total,
      discountAmount: 0,
      invoiceBilling: billing,
      invoiceBillingId: billing.id,
      data: undefined,
      issuedType: InvoiceIssueType.B2B,
    };

    try {
      const result = await this._dataSource.transaction(async (manager) => {
        if (invoice?.id) {
          await manager.delete(InvoiceItemEntity, {
            invoiceId: invoice.id,
          });
        }
        return manager.save(InvoiceEntity, entity);
      });

      return result;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  private buildB2bInvoiceItems({
    items,
    invoiceId,
  }: {
    items: InvoiceItemRequestDto[];
    invoiceId: string;
  }): {
    items: InvoiceItemEntity[];
    total: number;
  } {
    const entities = this._mapper.mapArray(
      items,
      InvoiceItemRequestDto,
      InvoiceItemEntity,
    );

    let total = 0;

    const mappingItems = entities.map((e) => {
      e.invoiceId = invoiceId;
      e.unit ??= 'Lần';
      e.taxRate = this._config.taxRate;
      e.discountAmount = 0;
      e.qty ??= 1;

      total += e.price;

      return e;
    });

    return {
      items: mappingItems,
      total,
    };
  }
}
