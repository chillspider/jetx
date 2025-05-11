import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SchedulerRegistry } from '@nestjs/schedule';
import dayjs from 'dayjs';
import {
  DataSource,
  EntityManager,
  In,
  IsNull,
  Not,
  Repository,
} from 'typeorm';
import { v4 as uuid } from 'uuid';

import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import {
  getAddressString,
  getUtcNow,
  isPositiveNumber,
  normalizeEmail,
} from '../../../common/utils';
import { CRON, EVENT, LANGUAGE } from '../../../constants';
import { SyncActionEnum } from '../../../constants/action';
import { YGL_TEST_DEVICE } from '../../../constants/config';
import { W24Error } from '../../../constants/error-code';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { TranslationService } from '../../../shared/services/translation.service';
import { VoucherService } from '../../../shared/services/voucher.service';
import { DeviceEntity } from '../../device/entities/device.entity';
import { DeviceStatusEnum } from '../../device/enums/device-status.enum';
import { OrderMembershipDto } from '../../membership/dtos/order-membership.dto';
import { UserMembershipDto } from '../../membership/dtos/user-membership.dto';
import { MembershipService } from '../../membership/services/membership.service';
import { PackageService } from '../../package/services/package.service';
import { PackageUtils } from '../../package/services/package.utils';
import { GPayResponseData } from '../../payment/dtos/gpay/gpay-response';
import { OrderTransactionDto } from '../../payment/dtos/order-transaction.dto';
import { OrderTransactionEntity } from '../../payment/entities/order-transaction.entity';
import { ApiOperationGPayEnum } from '../../payment/enums/api-operation-gpay.enum';
import {
  PaymentMethod,
  PaymentProvider,
} from '../../payment/enums/payment-method.enum';
import {
  GPayCardBrand,
  GPayEWalletBrand,
  GPayPaymentMethod,
} from '../../payment/enums/source-gpay.enum';
import { TransactionStatus } from '../../payment/enums/transaction-status.enum';
import { IGPayRequestData } from '../../payment/interfaces/payment-gpay.interface';
import { GPayService } from '../../payment/services/gpay.service';
import { PaymentService } from '../../payment/services/payment.service';
import { ProductTypeEnum } from '../../product/enums/products.enum';
import { StationEntity } from '../../station/entities/station.entity';
import { StationModeService } from '../../station/services/station-mode.service';
import { UserDto } from '../../user/dtos/user.dto';
import { UserTokenEntity } from '../../user/entities/user-token.entity';
import { VehicleEntity } from '../../user/entities/vehicle.entity';
import { UserService } from '../../user/services/user.service';
import { OperationMachineRequest } from '../../yigoli/dtos/operation-machine.request';
import { ClientType } from '../../yigoli/enums/client-type.enum';
import { OperationType } from '../../yigoli/enums/operation-type.enum';
import { WashMode } from '../../yigoli/enums/wash-mode.enum';
import { YigoliService } from '../../yigoli/services/yigoli.service';
import { OrderDto } from '../dtos/order.dto';
import { OrderItemDto } from '../dtos/order-item.dto';
import { OrderMetaData } from '../dtos/order-metadata.dto';
import { OrderUpdateInfoRequest } from '../dtos/order-update-info.dto';
import { OrderVoucherDto } from '../dtos/order-voucher.dto';
import {
  PaymentProcessRequest,
  PaymentProcessResponse,
} from '../dtos/payment-process';
import { OperationOrderDeviceRequest } from '../dtos/requests/operation-order-device.request';
import { PaymentOrderRequest } from '../dtos/requests/payment-order.request';
import { PaymentPackageRequest } from '../dtos/requests/payment-package.request';
import {
  CreateOrderRequest,
  UpdateOrderRequest,
} from '../dtos/requests/place-order.request';
import { PaymentOrderResponse } from '../dtos/responses/payment-order.response.dto';
import { OrderEntity } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';
import {
  FailedOrderStatuses,
  OrderStatusEnum,
} from '../enums/order-status.enum';
import { OrderTypeEnum } from '../enums/order-type.enum';
import { VoucherIssueTypeEnum, VoucherModelEnum } from '../enums/vouchers.enum';
import { OrderUtils } from '../utils/order.utils';
import { VoucherDto, VoucherMetadataDto } from './../dtos/voucher.dto';

@Injectable()
export class OrderService {
  private _deviceRepository: Repository<DeviceEntity>;
  private _orderRepository: Repository<OrderEntity>;
  private _orderItemRepository: Repository<OrderItemEntity>;
  private _transactionRepository: Repository<OrderTransactionEntity>;

  constructor(
    @Inject(REQUEST) private readonly _req: any,
    @Inject(LANGUAGE) private readonly _lang: string,
    @InjectMapper() private readonly _mapper: Mapper,
    private readonly _dataSource: DataSource,
    private readonly _gpayService: GPayService,
    private readonly _translationService: TranslationService,
    private readonly _paymentService: PaymentService,
    private readonly _yigoli: YigoliService,
    private readonly _logger: LoggerService,
    private readonly _emitter: EventEmitter2,
    private readonly _membershipService: MembershipService,
    private readonly _voucher: VoucherService,
    private readonly _config: ApiConfigService,
    private readonly _userService: UserService,
    private readonly _stationModeService: StationModeService,
    private readonly _scheduler: SchedulerRegistry,
    private readonly _package: PackageService,
  ) {
    this._deviceRepository = this._dataSource.getRepository(DeviceEntity);
    this._orderRepository = this._dataSource.getRepository(OrderEntity);
    this._orderItemRepository = this._dataSource.getRepository(OrderItemEntity);
    this._transactionRepository = this._dataSource.getRepository(
      OrderTransactionEntity,
    );
  }

  public async placeOrder(request: CreateOrderRequest): Promise<OrderDto> {
    const user = await this._userService.getCurrentUser();
    if (!user) throw new ForbiddenException();

    const isDeviceAvailable = await this.checkDeviceNotInProcessingOrder(
      request.deviceId,
    );
    if (!isDeviceAvailable) {
      throw new BadRequestException(W24Error.DeviceNotAvailable);
    }

    return this._handleOrderUpdate(request, user);
  }

  public async updateOrder(request: UpdateOrderRequest): Promise<OrderDto> {
    const user = await this._userService.getCurrentUser();
    if (!user) throw new ForbiddenException();

    const isDeviceAvailable = await this.checkDeviceNotInProcessingOrder(
      request.deviceId,
    );
    if (!isDeviceAvailable) {
      throw new BadRequestException(W24Error.DeviceNotAvailable);
    }

    const { order, item } = await this.getUpdateOrder(request.id);
    if (!order || !item) {
      throw new BadRequestException(W24Error.NotFound('Order'));
    }

    return this._handleOrderUpdate(request, user, item, order);
  }

  public async paymentOrder(
    request: PaymentOrderRequest,
  ): Promise<PaymentOrderResponse> {
    const user = await this._userService.getCurrentUser();
    if (!user) throw new ForbiddenException();

    const { order: currOrder, item } = await this.getUpdateOrder(
      request.orderId,
    );
    if (!currOrder || !item) {
      throw new BadRequestException(W24Error.NotFound('Order'));
    }

    const deviceId = item.data?.deviceId;
    if (!deviceId) {
      throw new BadRequestException(W24Error.NotFound('Device'));
    }

    const isDeviceAvailable =
      await this.checkDeviceNotInProcessingOrder(deviceId);
    if (!isDeviceAvailable) {
      throw new BadRequestException(W24Error.DeviceNotAvailable);
    }

    const order = await this._handleOrderUpdate(
      {
        deviceId: deviceId,
        modeId: item.data?.modeId,
        note: currOrder.note,
        paymentMethod: request.paymentMethod,
        paymentProvider: request.paymentProvider,
        voucherId: currOrder?.discountIds?.[0],
      },
      user,
      item,
      currOrder,
    );
    if (!order) {
      throw new BadRequestException(W24Error.NotFound('Order'));
    }

    if (order.grandTotal !== currOrder.grandTotal) {
      throw new BadRequestException(W24Error.OrderChanged);
    }

    const discountIds = order.discountIds || [];
    if (discountIds.length) {
      const voucherData: VoucherMetadataDto = {
        stationId: item.data?.stationId,
        stationName: item.data?.stationName,
        orderIncrementId: currOrder.incrementId,
        orderCreatedAt: currOrder.createdAt,
      };

      const usedVouchers = await Promise.all(
        discountIds.map((id) =>
          this._voucher.useVoucher(id, order.id, voucherData),
        ),
      );

      if (!usedVouchers.every((r) => r)) {
        throw new BadRequestException(W24Error.VoucherInvalid);
      }
    }

    try {
      const result = await this._dataSource.transaction<
        PaymentOrderResponse & { shouldStartDevice: boolean }
      >(async (manager) => {
        const isCash = request.paymentMethod === PaymentMethod.CASH;
        const isFree = order.grandTotal <= 0;

        if (isCash || isFree) {
          await manager
            .getRepository(OrderEntity)
            .update({ id: order.id }, { status: OrderStatusEnum.PENDING });
        }

        if (isFree) {
          return {
            shouldStartDevice: true,
            result: true,
            orderId: order.id,
          };
        }

        const paymentResponse = await this.processPayment(manager, order, {
          ...request,
          deviceId,
        });

        return {
          orderId: order.id,
          endpoint: paymentResponse?.endpoint,
          result: paymentResponse?.result,
          expiredAt: paymentResponse?.expiredAt,
          shouldStartDevice: paymentResponse?.result && isCash,
        };
      });

      const { shouldStartDevice, ...remaining } = result;

      if (shouldStartDevice) {
        await this._emitter.emitAsync(EVENT.ORDER.START_DEVICE, result.orderId);
      }

      return remaining;
    } catch (error) {
      // ! Rollback voucher
      if (discountIds?.length) {
        await Promise.all(
          discountIds.map((id) => this._voucher.rollbackVoucher(id)),
        );
      }

      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async operationOrderDevice(
    dto: OperationOrderDeviceRequest,
  ): Promise<boolean> {
    if (!dto.operation || dto.operation === OperationType.START) {
      throw new BadRequestException(W24Error.InvalidOperation);
    }

    const deviceOrderData = await this.getOrderDataForDevice(
      dto.orderId,
      dto.deviceId,
    );

    if (!deviceOrderData) {
      throw new BadRequestException(W24Error.NotFound('Order'));
    }
    const { order, item } = deviceOrderData;

    if (!order || !item) {
      throw new BadRequestException(W24Error.NotFound('Order'));
    }

    try {
      const req = this.createOperationMachineRequest({
        order,
        item,
        operation: dto.operation,
      });

      const isSuccess = await this._yigoli.operationMachine(req);
      if (isSuccess) {
        return this._completeOrderProcess(
          order,
          item,
          OrderStatusEnum.SELF_STOP,
        );
      }

      return isSuccess;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async getOrder(orderId: string): Promise<OrderDto> {
    const userId = this._req.user.id;
    if (!userId) throw new ForbiddenException();

    const [order, items, transactions] = await Promise.all([
      this._orderRepository.findOneBy({
        id: orderId,
        customerId: userId,
      }),
      this._orderItemRepository.findBy({
        orderId: orderId,
      }),
      this._dataSource.getRepository(OrderTransactionEntity).findBy({
        orderId: orderId,
        status: In([TransactionStatus.SUCCEEDED, TransactionStatus.REFUNDED]),
      }),
    ]);
    if (!order) return null;

    let dto = this._mapper.map(order, OrderEntity, OrderDto);

    const orderItems = this._mapper.mapArray(
      items,
      OrderItemEntity,
      OrderItemDto,
    );
    const orderTransactions = this._mapper.mapArray(
      transactions,
      OrderTransactionEntity,
      OrderTransactionDto,
    );

    dto.orderItems = orderItems;
    dto.orderTransactions = orderTransactions;

    // ! Map FNB information
    if (order.type === OrderTypeEnum.DEFAULT) {
      dto = await this.mapFnbInformation(dto);
    }

    return dto;
  }

  public async checkOrderStatus(
    orderId: string,
    hardCheck: boolean = false,
  ): Promise<boolean> {
    const [order, item] = await Promise.all([
      this._orderRepository.findOneBy({
        id: orderId,
        status: Not(OrderStatusEnum.DRAFT),
        type: OrderTypeEnum.DEFAULT,
      }),
      this._orderItemRepository.findOneBy({
        orderId: orderId,
        productType: ProductTypeEnum.WASHING,
      }),
    ]);
    if (!order || !item) return false;

    // if (order.status === OrderStatusEnum.PENDING) {
    //   await this._emitter.emitAsync(EVENT.ORDER.START_DEVICE, order.id);
    //   return false;
    // }

    // ! Skip YGL real device
    if (
      !hardCheck &&
      this._config.isProduction &&
      item.data?.deviceNo !== YGL_TEST_DEVICE
    ) {
      return false;
    }

    const isNotProcessing = order.status !== OrderStatusEnum.PROCESSING;
    if (isNotProcessing) return true;

    const isFinished = await this._isItemFinished(item);
    if (!isFinished) return false;

    return this._completeOrderProcess(order, item);
  }

  public async getOrderDataForDevice(
    orderId: string,
    deviceId: string,
  ): Promise<{
    order: OrderEntity;
    item: OrderItemEntity;
  }> {
    const [order, item] = await Promise.all([
      this._orderRepository.findOneBy({
        id: orderId,
        status: OrderStatusEnum.PROCESSING,
        type: OrderTypeEnum.DEFAULT,
      }),
      this._orderItemRepository
        .createQueryBuilder('items')
        .where({ orderId: orderId })
        .andWhere(
          `items.data IS NOT NULL AND ("items"."data"::jsonb->>'deviceId') =:deviceId`,
          { deviceId: deviceId },
        )
        .getOne(),
    ]);

    if (!order || !item) return null;

    return {
      order,
      item,
    };
  }

  public async getOrdersHistory(
    query: PaginationRequestDto,
  ): Promise<PaginationResponseDto<OrderDto>> {
    const userId = this._req.user.id;
    if (!userId) throw new ForbiddenException();

    const builder = this._orderRepository
      .createQueryBuilder('orders')
      .where({
        customerId: userId,
        status: Not(OrderStatusEnum.DRAFT),
        type: Not(In([OrderTypeEnum.TOKENIZE, OrderTypeEnum.FNB])),
      })
      .orderBy('orders.createdAt', query.order);

    const [items, meta] = await builder.paginate(query);

    const dtos = this._mapper.mapArray(items, OrderEntity, OrderDto);
    return dtos.toPagination(meta);
  }

  public async handleCreditPayment(
    manager: EntityManager,
    order: OrderEntity,
    paymentProvider: PaymentProvider,
    isTokenize: boolean,
  ): Promise<string> {
    const isMethodEnabled = this._paymentService.checkPaymentMethod(
      PaymentMethod.CREDIT,
    );
    if (!isMethodEnabled) {
      throw new BadRequestException(W24Error.PaymentMethodUnsupported);
    }

    if (paymentProvider !== PaymentProvider.GPay) {
      throw new BadRequestException(W24Error.InvalidPaymentProvider);
    }

    const transaction: Partial<OrderTransactionEntity> = {
      id: uuid(),
      orderId: order.id,
      paymentMethod: PaymentMethod.CREDIT,
      paymentProvider,
      amount: order.grandTotal,
      status: TransactionStatus.PENDING,
    };

    const operation = isTokenize
      ? ApiOperationGPayEnum.PAY_WITH_CREATE_TOKEN
      : ApiOperationGPayEnum.PAY;

    const gPayReq = await this.createGpayRequest({ order, operation });

    const response = await this._gpayService.createPaymentTransaction({
      requestData: gPayReq,
      orderTransactionId: transaction.id,
    });
    if (!response) {
      throw new BadRequestException(W24Error.CreatePaymentFailed);
    }

    transaction.transactionId = response.transactionID;
    await manager.getRepository(OrderTransactionEntity).save(transaction);

    return response.endpoint;
  }

  public async handleTokenPayment(
    manager: EntityManager,
    order: OrderEntity,
    paymentProvider: PaymentProvider,
    tokenId: string,
  ): Promise<string> {
    const isMethodEnabled = this._paymentService.checkPaymentMethod(
      PaymentMethod.CREDIT,
    );
    if (!isMethodEnabled) {
      throw new BadRequestException(W24Error.PaymentMethodUnsupported);
    }

    if (paymentProvider !== PaymentProvider.GPay) {
      throw new BadRequestException(W24Error.InvalidPaymentProvider);
    }

    const userId = this._req.user.id;

    const transaction: Partial<OrderTransactionEntity> = {
      id: uuid(),
      orderId: order.id,
      paymentMethod: PaymentMethod.TOKEN,
      paymentProvider,
      amount: order.grandTotal,
      status: TransactionStatus.PENDING,
    };

    const userToken = await manager.getRepository(UserTokenEntity).findOneBy({
      id: tokenId,
      createdBy: userId,
    });
    if (!userToken) {
      throw new BadRequestException(W24Error.NotFound('Token'));
    }

    const gpayPaymentMethod = this.getGPayPaymentMethod(userToken.accountBrand);

    const gPayReq = await this.createGpayRequest({
      order,
      token: userToken.token,
      paymentMethod: gpayPaymentMethod,
    });

    const response = await this._gpayService.createTokenPaymentTransaction({
      requestData: gPayReq,
      orderTransactionId: transaction.id,
    });
    if (!response) {
      throw new BadRequestException(W24Error);
    }

    transaction.transactionId = response.transactionID;
    await manager.getRepository(OrderTransactionEntity).save(transaction);

    return response.endpoint;
  }

  public async handleCashPayment(
    manager: EntityManager,
    order: OrderEntity,
  ): Promise<boolean> {
    const isMethodEnabled = this._paymentService.checkPaymentMethod(
      PaymentMethod.CASH,
    );
    if (!isMethodEnabled) {
      throw new BadRequestException(W24Error.PaymentMethodUnsupported);
    }

    const transaction: Partial<OrderTransactionEntity> = {
      id: uuid(),
      transactionId: uuid(),
      orderId: order.id,
      paymentMethod: PaymentMethod.CASH,
      amount: order.grandTotal,
      status: TransactionStatus.SUCCEEDED,
    };

    await manager.getRepository(OrderTransactionEntity).save(transaction);
    return true;
  }

  /**
   * Handles QR payment for an order.
   *
   * This method checks if the QR payment method is enabled, removes any pending transactions
   * for the order, creates a new pending transaction, and returns the expiration date of the transaction.
   */
  public async handleQRPayment(
    manager: EntityManager,
    order: OrderEntity,
    deviceId: string,
  ): Promise<Date> {
    const isMethodEnabled = this._paymentService.checkPaymentMethod(
      PaymentMethod.QR,
    );
    if (!isMethodEnabled) {
      throw new BadRequestException(W24Error.PaymentMethodUnsupported);
    }

    // Remove pending transaction
    await manager.getRepository(OrderTransactionEntity).delete({
      orderId: order.id,
      paymentMethod: PaymentMethod.QR,
      status: TransactionStatus.PENDING,
    });

    const transaction: Partial<OrderTransactionEntity> = {
      id: uuid(),
      transactionId: uuid(),
      orderId: order.id,
      paymentMethod: PaymentMethod.QR,
      amount: order.grandTotal,
      status: TransactionStatus.PENDING,
      data: { deviceId },
    };

    const entity = await manager
      .getRepository(OrderTransactionEntity)
      .save(transaction);

    if (entity) {
      this._scheduleExpiredTransactionHandler(entity.id);

      return dayjs(entity.createdAt)
        .add(this._config.gpayQR.expiredTrans, 'second')
        .toDate();
    }

    return null;
  }

  private async handleDynamicQRPayment(
    manager: EntityManager,
    order: OrderEntity,
    paymentProvider: PaymentProvider,
  ): Promise<GPayResponseData & { expiredAt: Date }> {
    const isMethodEnabled = this._paymentService.checkPaymentMethod(
      PaymentMethod.QRPAY,
    );
    if (!isMethodEnabled) {
      throw new BadRequestException(W24Error.PaymentMethodUnsupported);
    }

    if (paymentProvider !== PaymentProvider.GPay) {
      throw new BadRequestException(W24Error.InvalidPaymentProvider);
    }

    const transaction: Partial<OrderTransactionEntity> = {
      id: uuid(),
      orderId: order.id,
      paymentMethod: PaymentMethod.QRPAY,
      paymentProvider,
      amount: order.grandTotal,
      status: TransactionStatus.PENDING,
    };

    const gPayReq = await this.createGpayRequest({
      order,
      paymentMethod: GPayPaymentMethod.QRPAY,
      sourceType: GPayPaymentMethod.QRPAY,
    });

    const response = await this._gpayService.createQRPaymentTransaction({
      requestData: gPayReq,
      orderTransactionId: transaction.id,
    });
    if (!response) {
      throw new BadRequestException(W24Error.CreatePaymentFailed);
    }

    transaction.transactionId = response.transactionID;
    await manager.getRepository(OrderTransactionEntity).save(transaction);

    const expiredAt = dayjs(getUtcNow())
      .add(this._config.gpay.expiredTime, 'second')
      .toDate();

    return {
      ...response,
      expiredAt,
    };
  }

  private async createGpayRequest({
    order,
    operation,
    token,
    paymentMethod,
    isCreateTokenize,
    sourceType,
  }: {
    order: OrderEntity;
    operation?: ApiOperationGPayEnum;
    token?: string;
    paymentMethod?: GPayPaymentMethod;
    isCreateTokenize?: boolean;
    sourceType?: string;
  }) {
    const isTokenize = !!token;
    const apiOperation = isTokenize ? ApiOperationGPayEnum.PAY : operation;

    const description = this._translationService.translate(
      isCreateTokenize ? 'common.paymentTokenize' : 'common.paymentForOrder',
      {
        args: { incrementId: order.incrementId },
      },
    );

    const callbackURL = (status: OrderStatusEnum) => {
      const prefix = isCreateTokenize ? 'tokenize' : 'payment';

      return `${this._config.app.id}://${prefix}/result?status=${status}&orderId=${order.id}&incrementId=${order.incrementId}&type=${order.type}`;
    };

    const gPayReq: IGPayRequestData = {
      apiOperation: apiOperation || ApiOperationGPayEnum.PAY,
      orderID: order.id,
      orderNumber: order.incrementId,
      orderAmount: Math.round(order.grandTotal),
      orderCurrency: 'VND',
      orderDateTime: dayjs(order.createdAt).format('YYYYMMDDHHmmss'),
      orderDescription: description,
      language: this._lang,
      sourceOfFund: isTokenize ? 'TOKEN' : null,
      token: token,
      paymentMethod: paymentMethod,
      sourceType: sourceType,
      successURL: callbackURL(OrderStatusEnum.COMPLETED),
      failureURL: callbackURL(OrderStatusEnum.FAILED),
      cancelURL: callbackURL(OrderStatusEnum.CANCELED),
    };

    return gPayReq;
  }

  private async getOrderMetadata(
    deviceId: string,
    modeId: string,
    orderItem: OrderItemEntity = null,
  ): Promise<{
    item: OrderItemEntity;
    itemQuantity: number;
    metadata: OrderMetaData;
  }> {
    const device = await this._deviceRepository
      .createQueryBuilder('devices')
      .leftJoinAndSelect('devices.product', 'product')
      .where({ id: deviceId })
      .getOne();
    if (!device) {
      throw new BadRequestException(W24Error.NotFound('Device'));
    }

    if (device.status !== DeviceStatusEnum.AVAILABLE) {
      throw new BadRequestException(W24Error.DeviceNotAvailable);
    }

    const product = device.product;
    if (!product) {
      throw new BadRequestException(W24Error.NotFound('Product'));
    }

    const modes = await this._stationModeService.getProductModes({
      stationId: device.stationId,
      productId: device.productId,
    });

    const mode = modes.find((m) => m.id === modeId);
    if (!mode) {
      throw new BadRequestException(W24Error.NotFound('Mode'));
    }

    const station = await this._dataSource
      .getRepository(StationEntity)
      .findOne({
        where: { id: device.stationId },
        relations: ['location'],
      });

    const location = station?.location;
    const price = mode.price;
    const washMode = OrderUtils.getWashMode(mode?.code);
    if (!washMode) {
      throw new BadRequestException(W24Error.ModeInvalid);
    }

    const clientType =
      this._req?.device === 'ios' ? ClientType.IOS : ClientType.ANDROID;

    // Order Metadata
    const metadata: OrderMetaData = {
      stationId: station?.id,
      stationName: station?.name,
      stationAddress: getAddressString(location),
      clientType: clientType,
    };

    // TODO: Get vehicle info (numberPlate, ...) in device by ygl api
    const vehicle: VehicleEntity = null;

    if (vehicle) {
      metadata.vehicleId = vehicle.id;
      metadata.vehicleName = `${vehicle.brand ?? ''} ${vehicle.model ?? ''}`;
      metadata.vehicleNumberPlate = vehicle.numberPlate;
    }

    const item: OrderItemEntity = {
      id: orderItem?.id || uuid(),
      orderId: orderItem?.orderId || '',
      qty: 1,
      originPrice: price,
      price: price,
      total: price,
      discountAmount: 0,
      discountIds: [],
      taxAmount: 0,
      productId: product.id,
      productName: product.name,
      productType: product.type,
      data: {
        mode: washMode,
        modeId: mode.id,
        modeName: mode.name,
        deviceId: device.id,
        deviceNo: device.deviceNo,
        deviceName: device.name,
        stationId: metadata.stationId,
        stationName: metadata.stationName,
        stationAddress: metadata.stationAddress,
        lat: location?.latitude,
        lng: location?.longitude,
      },
      createdAt: getUtcNow(),
      updatedAt: getUtcNow(),
    };

    return { item, itemQuantity: item.qty, metadata };
  }

  private getGPayPaymentMethod(accountBrand: string): GPayPaymentMethod {
    if (Object.values(GPayCardBrand).includes(accountBrand as GPayCardBrand)) {
      return GPayPaymentMethod.INTERNATIONAL;
    }

    if (
      Object.values(GPayEWalletBrand).includes(accountBrand as GPayEWalletBrand)
    ) {
      return GPayPaymentMethod.WALLET;
    }

    return GPayPaymentMethod.DOMESTIC;
  }

  private async checkDeviceNotInProcessingOrder(
    deviceId: string,
  ): Promise<boolean> {
    const order = await this._orderRepository
      .createQueryBuilder('orders')
      .leftJoinAndSelect(OrderItemEntity, 'items', 'items.orderId = orders.id')
      .where(
        `items.data IS NOT NULL AND ("items"."data"::jsonb->>'deviceId') =:deviceId`,
        { deviceId },
      )
      .andWhere('orders.type = :type', { type: OrderTypeEnum.DEFAULT })
      .andWhere('orders.status = :status', {
        status: In([OrderStatusEnum.PENDING, OrderStatusEnum.PROCESSING]),
      })
      .getOne();

    return !order;
  }

  private async _calculateOrderValue({
    order,
    item,
    voucherId,
    isVoucherUpdated,
  }: {
    order: OrderEntity;
    item: OrderItemEntity;
    voucherId: string;
    isVoucherUpdated: boolean;
  }): Promise<OrderDto> {
    // MEMBERSHIP
    const { subTotal } = OrderUtils.calculateItemValue([item]);
    const userMembership = await this._membershipService.getCurrentMembership(
      order.data?.vehicleId,
    );

    if (userMembership) {
      order.subTotal = subTotal;
      order.grandTotal = 0;
      order.membership = this._mapper.map(
        userMembership,
        UserMembershipDto,
        OrderMembershipDto,
      );
      order.membershipAmount = subTotal;

      return;
    }

    // VOUCHER
    let grandTotal = subTotal;
    let voucherAmount = 0;
    let voucher: VoucherDto;

    if (voucherId && grandTotal > 0) {
      const voucherData = await this._calculateVoucher(
        item,
        voucherId,
        isVoucherUpdated,
      );

      voucher = voucherData?.voucher;
      voucherAmount = voucherData?.voucherAmount || 0;
      grandTotal = OrderUtils.calculateItemValue([item]).subTotal;
    }

    // Apply discount
    const discountIds = [];
    const discounts: OrderVoucherDto[] = [];
    let discountAmount = 0;

    if (voucher) {
      const orderVoucher = this._mapper.map(
        voucher,
        VoucherDto,
        OrderVoucherDto,
      );

      discountIds.push(voucher.id);
      discounts.push(orderVoucher);
      discountAmount += voucherAmount;
    }

    // Update order value
    order.subTotal = Math.round(subTotal);
    order.discountIds = discountIds;
    order.discounts = discounts;
    order.discountAmount = Math.round(discountAmount);
    order.grandTotal = OrderUtils.calculateGrandTotal(order);

    if (order.grandTotal <= 0 && voucher) {
      const isPaidVoucher = this.isPackageVoucher(voucher);
      order.paymentMethod = isPaidVoucher
        ? PaymentMethod.VOUCHER_PAID
        : PaymentMethod.VOUCHER_FREE;
      order.paymentProvider = null;
    }

    return this._dataSource.transaction(async (manager) => {
      const entity = await manager.getRepository(OrderEntity).save(order);

      item.orderId = entity.id;
      const orderItem = await manager.getRepository(OrderItemEntity).save(item);

      const dto = this._mapper.map(entity, OrderEntity, OrderDto);
      dto.orderItems = this._mapper.mapArray(
        [orderItem],
        OrderItemEntity,
        OrderItemDto,
      );

      return dto;
    });
  }

  private async getUpdateOrder(orderId: string): Promise<{
    order: OrderEntity;
    item: OrderItemEntity;
  }> {
    const userId = this._req.user?.id;
    if (!userId) throw new ForbiddenException();

    const [order, item, pendingTransaction] = await Promise.all([
      this._orderRepository.findOneBy({
        id: orderId,
        customerId: userId,
        type: OrderTypeEnum.DEFAULT,
        status: In([OrderStatusEnum.DRAFT, OrderStatusEnum.FAILED]),
      }),
      this._orderItemRepository.findOneBy({
        orderId: orderId,
        productType: ProductTypeEnum.WASHING,
      }),
      this._dataSource.getRepository(OrderTransactionEntity).findOneBy({
        orderId: orderId,
        status: TransactionStatus.PENDING,
      }),
    ]);

    if (pendingTransaction) {
      throw new BadRequestException(W24Error.PendingTransaction);
    }

    return { order, item };
  }

  private async _handleOrderUpdate(
    req: OrderUpdateInfoRequest,
    user: UserDto,
    item: OrderItemEntity = null,
    order: OrderEntity = null,
  ): Promise<OrderDto> {
    const { item: orderItem, metadata } = await this.getOrderMetadata(
      req.deviceId,
      req.modeId,
      item,
    );

    const paymentMethod = req.paymentMethod || PaymentMethod.CREDIT;
    const isCash = paymentMethod === PaymentMethod.CASH;
    const provider = isCash ? null : req.paymentProvider;

    const { subTotal, quantity } = OrderUtils.calculateItemValue([orderItem]);

    const orderEntity: OrderEntity = {
      id: order?.id || uuid(),
      incrementId: order?.incrementId,
      customerId: user.id,
      customerPhone: user.phone,
      customerEmail: user.email,
      customerName: user.fullName,
      paymentMethod: paymentMethod,
      paymentProvider: provider,
      itemQuantity: quantity,
      status: OrderStatusEnum.DRAFT,
      taxAmount: 0,
      subTotal: subTotal,
      grandTotal: subTotal,
      data: metadata,
      note: req.note,
      membership: null,
      membershipAmount: 0,
      discountIds: [],
      discounts: [],
      discountAmount: 0,
      type: OrderTypeEnum.DEFAULT,
      createdAt: order?.createdAt || getUtcNow(),
    };

    let voucherId = req.voucherId;

    if (!voucherId && !order) {
      voucherId = await this._findValidWashingVoucher(orderEntity, orderItem);
    }

    return this._calculateOrderValue({
      order: orderEntity,
      item: orderItem,
      voucherId,
      isVoucherUpdated: this.isVoucherUpdated(voucherId, item),
    });
  }

  private isVoucherUpdated(
    reqVoucherId: string = '',
    item?: OrderItemEntity,
  ): boolean {
    if (!item) return false;

    return reqVoucherId !== (item.discountIds?.[0] ?? '');
  }

  private async _calculateVoucher(
    item: OrderItemEntity,
    voucherId: string,
    isVoucherUpdated: boolean,
  ): Promise<{
    voucher: VoucherDto;
    voucherAmount: number;
  }> {
    try {
      if (!voucherId) return null;

      const userId = this._req.user?.id;
      if (!userId) throw new ForbiddenException();

      const voucher = await this._voucher.getVoucher(voucherId);
      if (!voucher) {
        throw new BadRequestException(W24Error.VoucherInvalid);
      }

      const isValidVoucher = OrderUtils.validateVoucher(userId, voucher, item);
      if (!isValidVoucher?.result) {
        throw new BadRequestException(isValidVoucher.error);
      }

      const { subTotal } = OrderUtils.calculateItemValue([item]);

      let voucherAmount = 0;
      switch (voucher.voucherModel) {
        case VoucherModelEnum.FIXED_AMOUNT:
          voucherAmount = voucher.hiddenCashValue;
          break;
        case VoucherModelEnum.PERCENTAGE:
          voucherAmount = (voucher.percentage * subTotal) / 100;

          if (isPositiveNumber(voucher.maxDeductionValue)) {
            voucherAmount = Math.min(voucherAmount, voucher.maxDeductionValue);
          }
          break;
        default:
          break;
      }

      item.discountIds = [voucher.id];
      item.discountAmount = Math.min(voucherAmount, subTotal);
      item.price = subTotal - item.discountAmount;
      item.total = item.price * item.qty;

      return {
        voucher,
        voucherAmount,
      };
    } catch (error) {
      this._logger.error(error);

      if (isVoucherUpdated) {
        throw new BadRequestException(error);
      }

      return {
        voucher: null,
        voucherAmount: 0,
      };
    }
  }

  private async _isItemFinished(item: OrderItemEntity): Promise<boolean> {
    if (item.data?.endTime) return true;

    const estEndTime = item.data?.estEndTime;
    if (!estEndTime) return false;

    const now = getUtcNow();
    return dayjs(estEndTime).isBefore(now);
  }

  private async _completeOrderProcess(
    order: OrderEntity,
    item: OrderItemEntity,
    status: OrderStatusEnum = OrderStatusEnum.COMPLETED,
  ): Promise<boolean> {
    const deviceId = item.data?.deviceId;
    const stationId = item.data?.stationId;

    const isCompleted = await this._dataSource.transaction(async (manager) => {
      item.data = {
        ...item.data,
        endTime: getUtcNow(),
      };
      await manager.getRepository(OrderItemEntity).save(item);

      order.status = status;
      order.data = {
        ...order.data,
        endTime: getUtcNow(),
      };
      await manager.getRepository(OrderEntity).save(order);

      await manager.getRepository(DeviceEntity).update(
        {
          id: deviceId,
        },
        {
          status: DeviceStatusEnum.AVAILABLE,
        },
      );

      return true;
    });

    if (isCompleted) {
      this._emitter.emit(EVENT.STATION.UPDATE_DEVICE, stationId);
      this._emitter.emit(EVENT.ORDER.COMPLETED, order.id);

      // ! Sync Nflow
      this._emitter.emit(EVENT.SYNC.ORDER, {
        action: SyncActionEnum.Sync,
        id: order.id,
      });

      // ! Refund
      if (status === OrderStatusEnum.SELF_STOP) {
        this._emitter.emit(EVENT.ORDER.REFUND, order.id);
      }
    }

    return isCompleted;
  }

  public async createTokenize(): Promise<PaymentOrderResponse> {
    const user = await this._userService.getCurrentUser();
    if (!user) throw new ForbiddenException();

    const isMethodEnabled = this._paymentService.checkPaymentMethod(
      PaymentMethod.CREDIT,
    );
    if (!isMethodEnabled) {
      throw new BadRequestException(W24Error.PaymentMethodUnsupported);
    }

    const note = this._translationService.translate('common.createTokenize');

    const gpayMinAmount = this._config.gpay.minAmount;

    const order: Partial<OrderEntity> = {
      id: uuid(),
      customerId: user.id,
      customerPhone: user.phone,
      customerEmail: user.email,
      customerName: user.fullName,
      paymentMethod: PaymentMethod.CREDIT,
      paymentProvider: PaymentProvider.GPay,
      status: OrderStatusEnum.DRAFT,
      itemQuantity: 0,
      taxAmount: 0,
      discountAmount: 0,
      subTotal: gpayMinAmount,
      grandTotal: gpayMinAmount,
      type: OrderTypeEnum.TOKENIZE,
      note: note,
    };

    const transaction: Partial<OrderTransactionEntity> = {
      id: uuid(),
      orderId: order.id,
      paymentMethod: PaymentMethod.CREDIT,
      paymentProvider: PaymentProvider.GPay,
      amount: gpayMinAmount,
      status: TransactionStatus.PENDING,
    };

    try {
      return this._dataSource.transaction(async (manager) => {
        const entity = await manager.getRepository(OrderEntity).save(order);

        const gPayReq = await this.createGpayRequest({
          order: entity,
          operation: ApiOperationGPayEnum.PAY_WITH_CREATE_TOKEN,
          isCreateTokenize: true,
        });

        const response = await this._gpayService.createPaymentTransaction({
          requestData: gPayReq,
          orderTransactionId: transaction.id,
        });
        if (!response) {
          throw new BadRequestException(W24Error);
        }

        transaction.transactionId = response.transactionID;
        await manager.getRepository(OrderTransactionEntity).save(transaction);

        return {
          endpoint: response.endpoint,
          result: true,
          orderId: entity.id,
        };
      });
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public createOperationMachineRequest({
    order,
    item,
    operation,
    mode,
    device,
  }: {
    order: OrderEntity;
    item: OrderItemEntity;
    device?: DeviceEntity;
    operation: OperationType;
    mode?: WashMode;
  }): OperationMachineRequest {
    const req: OperationMachineRequest = {
      operationType: operation,
      washMode: mode || item.data?.mode,
      factoryNo: device?.stationId || item.data?.stationId,
      deviceNo: device?.deviceNo || item.data?.deviceNo,
      mobile: order.customerPhone,
      userId: order.customerId,
      orderNo: `${order.incrementId}`,
      orderTitle: order.id,
      licencePlate: order.data?.vehicleNumberPlate,
      createTime: order.createdAt.toISOString(),
      lat: `${item.data?.lat}`,
      lng: `${item.data?.lng}`,
      // ! FIXME: pass discount amount when ygl stable
      orderActualAmount: order.grandTotal,
      orderAmount: order.grandTotal + order.discountAmount,
      deductAmount: order.discountAmount,
      clientType: order.data?.clientType,
    };

    return req;
  }

  public async checkOrderPayment(id: string): Promise<boolean> {
    try {
      const order = await this._orderRepository.findOneBy({
        id,
        status: Not(OrderStatusEnum.DRAFT),
      });
      if (!order) return false;

      if (order.grandTotal <= 0) return true;

      const transaction = await this._dataSource
        .getRepository(OrderTransactionEntity)
        .findOneBy({ orderId: id, status: TransactionStatus.SUCCEEDED });
      if (!transaction) return false;

      return transaction.amount >= order.grandTotal;
    } catch (error) {
      this._logger.error(error);
      return false;
    }
  }

  private async _scheduleExpiredTransactionHandler(
    transactionId: string,
  ): Promise<void> {
    try {
      const schedulerName = CRON.QR_PENDING(transactionId);
      const expiredTime = this._config.gpayQR.expiredTrans; // seconds

      const timeout = setTimeout(
        async () => {
          await this._handleExpiredTransaction(transactionId);
          this._scheduler.deleteTimeout(schedulerName);
        },
        (expiredTime + 10) * 1000,
      );

      this._scheduler.addTimeout(schedulerName, timeout);
    } catch (error) {
      this._logger.error(error);
    }
  }

  private async _handleExpiredTransaction(
    transactionId: string,
  ): Promise<void> {
    const transaction = await this._dataSource
      .getRepository(OrderTransactionEntity)
      .findOneBy({
        id: transactionId,
        status: TransactionStatus.PENDING,
      });
    if (!transaction) return;

    const expiredTime = this._config.gpayQR.expiredTrans;
    const diff = dayjs(getUtcNow()).diff(
      dayjs(transaction.createdAt),
      'second',
    );
    if (diff < expiredTime) return;

    await this._invalidateOrderTransaction({
      orderId: transaction.orderId,
      transactionId: transaction.id,
    });
  }

  public async rollbackVoucher(orderId: string): Promise<boolean> {
    try {
      const order = await this._orderRepository.findOneBy({
        id: orderId,
        status: In(FailedOrderStatuses),
        type: OrderTypeEnum.DEFAULT,
        discountIds: Not(IsNull()),
      });
      if (!order) return false;

      const discountIds = order.discountIds || [];
      await Promise.all(
        discountIds.map((e) => this._voucher.rollbackVoucher(e)),
      );

      return true;
    } catch (error) {
      this._logger.error(error);
      return false;
    }
  }

  public async paymentPackage(
    request: PaymentPackageRequest,
  ): Promise<PaymentOrderResponse> {
    const user = await this._userService.getCurrentUser();
    if (!user) throw new ForbiddenException();

    const blacklist = this._config.packageBlacklist;
    if (blacklist?.length && blacklist.includes(normalizeEmail(user.email))) {
      throw new ForbiddenException();
    }

    const order = await this.createPackageOrder(request, user);
    if (!order) {
      throw new BadRequestException(W24Error.UnexpectedError);
    }

    const paymentMethod = request.paymentMethod;

    const isCash = paymentMethod === PaymentMethod.CASH;
    const isFree = order.grandTotal <= 0;
    const isCompleted = isCash || isFree;

    try {
      const result = await this._dataSource.transaction<PaymentOrderResponse>(
        async (manager) => {
          if (isCompleted) {
            await manager
              .getRepository(OrderEntity)
              .update({ id: order.id }, { status: OrderStatusEnum.PENDING });
          }

          if (isFree) {
            return {
              result: true,
              orderId: order.id,
            };
          }

          const paymentResponse = await this.processPayment(
            manager,
            order,
            request,
          );

          return {
            endpoint: paymentResponse?.endpoint,
            qrCode: paymentResponse?.qrCode,
            expiredAt: paymentResponse?.expiredAt,
            result: paymentResponse?.result,
            orderId: order.id,
          };
        },
      );

      if (isCompleted && result.result) {
        this._emitter.emit(EVENT.PACKAGE.PROCESS, order.id);
        this._emitter.emit(EVENT.SYNC.ORDER, {
          action: SyncActionEnum.Sync,
          id: order.id,
        });
      }

      return result;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  private async createPackageOrder(
    req: PaymentPackageRequest,
    user: UserDto,
  ): Promise<OrderDto> {
    const pkg = await this._package.getPackage(req.packageId);
    if (!pkg) {
      throw new BadRequestException(W24Error.NotFound('Package'));
    }

    const isAllowedAccess = PackageUtils.canAccessPackage(pkg, user.email);
    if (!isAllowedAccess) {
      throw new BadRequestException(W24Error.PackageAccessDenied);
    }

    const item: Partial<OrderItemEntity> = {
      id: uuid(),
      productId: pkg.guid,
      productName: pkg.name,
      productType: ProductTypeEnum.PACKAGE,
      originPrice: pkg.price,
      price: pkg.price,
      total: pkg.price,
      qty: 1,
      discountAmount: 0,
      discountIds: [],
      taxAmount: 0,
      data: {
        packageInvoiceInfo: pkg.invoiceInformations,
      },
    };

    const order: Partial<OrderEntity> = {
      customerId: user.id,
      customerPhone: user.phone,
      customerEmail: user.email,
      customerName: user.fullName,
      paymentMethod: req.paymentMethod,
      paymentProvider: req.paymentProvider,
      status: OrderStatusEnum.DRAFT,
      itemQuantity: 1,
      taxAmount: 0,
      discountAmount: 0,
      subTotal: pkg.price,
      grandTotal: pkg.price,
      type: OrderTypeEnum.PACKAGE,
      note: req.note,
      data: {
        packageId: pkg.guid,
        packageSku: pkg.sku,
        packageName: pkg.name,
      },
    };

    return this._dataSource.transaction(async (manager) => {
      const entity = await manager.getRepository(OrderEntity).save(order);

      item.orderId = entity.id;
      await manager.getRepository(OrderItemEntity).save(item);

      const dto = this._mapper.map(entity, OrderEntity, OrderDto);
      dto.orderItems = [this._mapper.map(item, OrderItemEntity, OrderItemDto)];

      return dto;
    });
  }

  public async processPayment(
    manager: EntityManager,
    order: OrderEntity,
    request: PaymentProcessRequest,
  ): Promise<PaymentProcessResponse> {
    const { paymentMethod, paymentProvider, isTokenize, tokenId } = request;

    let endpoint: string;
    let qrCode: string;
    let isSuccess = false;
    let expiredAt: Date = null;

    switch (paymentMethod) {
      case PaymentMethod.CREDIT:
        endpoint = await this.handleCreditPayment(
          manager,
          order,
          paymentProvider,
          isTokenize,
        );
        isSuccess = !!endpoint;
        break;
      case PaymentMethod.TOKEN:
        endpoint = await this.handleTokenPayment(
          manager,
          order,
          paymentProvider,
          tokenId,
        );
        isSuccess = !!endpoint;
        break;
      case PaymentMethod.CASH:
        isSuccess = await this.handleCashPayment(manager, order);
        break;
      case PaymentMethod.QR: {
        if (!request.deviceId) {
          throw new BadRequestException(W24Error.UnexpectedError);
        }
        expiredAt = await this.handleQRPayment(
          manager,
          order,
          request.deviceId,
        );
        isSuccess = !!expiredAt;
        break;
      }
      case PaymentMethod.QRPAY: {
        const res = await this.handleDynamicQRPayment(
          manager,
          order,
          paymentProvider,
        );
        qrCode = res?.qrCode;
        endpoint = res?.endpoint;
        expiredAt = res?.expiredAt;
        isSuccess = !!qrCode;
        break;
      }
      default:
        throw new BadRequestException(W24Error.InvalidPaymentMethod);
    }

    return {
      endpoint,
      qrCode,
      expiredAt,
      result: isSuccess,
    };
  }

  private async _findValidWashingVoucher(
    order: OrderEntity,
    item: OrderItemEntity,
  ): Promise<string> {
    try {
      const vouchers = await this._voucher.getUserVouchers(order.subTotal);
      if (vouchers.length === 0) return null;

      const voucher = vouchers.find(
        (e) => OrderUtils.validateVoucher(order.customerId, e, item).result,
      );

      return voucher?.id;
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }

  public async getOrderProcessing(): Promise<OrderDto> {
    const userId = this._req?.user?.id;
    if (!userId) throw new ForbiddenException();

    const order = await this._orderRepository.findOne({
      where: {
        customerId: userId,
        status: OrderStatusEnum.PROCESSING,
      },
      order: { createdAt: 'DESC' },
      select: ['id'],
    });
    if (!order) throw new BadRequestException(W24Error.NotFound('Order'));

    return this.getOrder(order.id);
  }

  private async _getStationShopId(order: OrderEntity): Promise<string> {
    const stationId = order.data?.stationId;
    const isNotDefaultOrder = order.type !== OrderTypeEnum.DEFAULT;

    if (!stationId || isNotDefaultOrder) return null;

    const station = await this._dataSource
      .getRepository(StationEntity)
      .findOneBy({ id: order.data?.stationId });

    return station?.data?.shopId;
  }

  private async mapFnbInformation(order: OrderDto): Promise<OrderDto> {
    try {
      const fnbShopId = await this._getStationShopId(order);
      const fnbOrder = await this._orderRepository.findOne({
        where: {
          parentId: order.id,
          status: Not(OrderStatusEnum.DRAFT),
          type: OrderTypeEnum.FNB,
        },
        select: ['id'],
        order: { createdAt: 'DESC' },
      });

      order.data = {
        ...order.data,
        shopId: fnbShopId,
      };
      order.fnbOrderId = fnbOrder?.id;

      return order;
    } catch (error) {
      this._logger.error(error);
      return order;
    }
  }

  private isPackageVoucher(voucher: VoucherDto): boolean {
    return [VoucherIssueTypeEnum.B2B, VoucherIssueTypeEnum.PACKAGE].includes(
      voucher.issueType,
    );
  }

  public async cancelPayment(orderId: string): Promise<boolean> {
    const user = await this._userService.getCurrentUser();
    if (!user) throw new ForbiddenException();

    const order = await this._orderRepository.findOneBy({
      id: orderId,
      customerId: user.id,
      status: OrderStatusEnum.DRAFT,
    });
    if (!order) throw new BadRequestException(W24Error.NotFound('Order'));

    const transaction = await this._transactionRepository.findOneBy({
      orderId: orderId,
      status: TransactionStatus.PENDING,
    });
    if (!transaction) {
      throw new BadRequestException(W24Error.NotFound('Transaction'));
    }

    switch (transaction.paymentMethod) {
      case PaymentMethod.QR: {
        const isTimeoutExists = this._scheduler.doesExist(
          'timeout',
          CRON.QR_PENDING(transaction.id),
        );
        if (isTimeoutExists) {
          this._scheduler.deleteTimeout(CRON.QR_PENDING(transaction.id));
        }

        return this._invalidateOrderTransaction({
          orderId: order.id,
          transactionId: transaction.id,
          transactionStatus: TransactionStatus.CANCELED,
        });
      }
      default:
        throw new BadRequestException(W24Error.InvalidCancellationMethod);
    }
  }

  private async _invalidateOrderTransaction({
    orderId,
    transactionId,
    transactionStatus = TransactionStatus.FAILED,
  }: {
    orderId: string;
    transactionId: string;
    transactionStatus?: TransactionStatus.CANCELED | TransactionStatus.FAILED;
  }): Promise<boolean> {
    const isCompleted = await this._dataSource.transaction(async (manager) => {
      await manager.getRepository(OrderTransactionEntity).update(
        { id: transactionId, status: TransactionStatus.PENDING },
        {
          status: transactionStatus,
        },
      );

      await manager.getRepository(OrderEntity).update(
        {
          id: orderId,
          status: OrderStatusEnum.DRAFT,
        },
        {
          status: OrderStatusEnum.FAILED,
        },
      );

      return true;
    });

    if (isCompleted) {
      this._emitter.emit(EVENT.SYNC.ORDER, {
        action: SyncActionEnum.Sync,
        id: orderId,
      });

      await this.rollbackVoucher(orderId);
    }

    return isCompleted;
  }
}
