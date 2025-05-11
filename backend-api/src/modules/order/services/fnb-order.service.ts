import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, In, Not, Repository } from 'typeorm';

import { EVENT } from '../../../constants';
import { W24Error } from '../../../constants/error-code';
import { LoggerService } from '../../../shared/services/logger.service';
import { BBOrderDto, BBOrderItemDto } from '../../bitebolt/dtos/bb-order.dto';
import {
  BBCreateOrderRequest,
  BBOrderItemRequest,
  BBPaymentOrderRequest,
} from '../../bitebolt/dtos/requests/bb-order.request.dto';
import {
  BBOrderItemTypeEnum,
  MappingBBToOrderStatus,
} from '../../bitebolt/enums/bb.enum';
import { BiteboltService } from '../../bitebolt/services/bitebolt.service';
import { PaymentMethod } from '../../payment/enums/payment-method.enum';
import { ProductTypeEnum } from '../../product/enums/products.enum';
import { UserDto } from '../../user/dtos/user.dto';
import { UserService } from '../../user/services/user.service';
import { OrderDto } from '../dtos/order.dto';
import {
  FnbCreateOrderRequest,
  FnbOrderItemRequest,
  FnbUpdateOrderRequest,
} from '../dtos/requests/fnb-order.request.dto';
import { PaymentOrderRequest } from '../dtos/requests/payment-order.request';
import { PaymentOrderResponse } from '../dtos/responses/payment-order.response.dto';
import { OrderEntity } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';
import { OrderStatusEnum } from '../enums/order-status.enum';
import { OrderTypeEnum } from '../enums/order-type.enum';
import { OrderUtils } from '../utils/order.utils';
import { OrderService } from './order.service';

@Injectable()
export class FnbOrderService {
  private readonly _orderRepository: Repository<OrderEntity>;
  private readonly _orderItemRepository: Repository<OrderItemEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    private readonly _bitebolt: BiteboltService,
    private readonly _logger: LoggerService,
    private readonly _userService: UserService,
    private readonly _dataSource: DataSource,
    private readonly _orderService: OrderService,
    private readonly _emitter: EventEmitter2,
  ) {
    this._orderRepository = this._dataSource.getRepository(OrderEntity);
    this._orderItemRepository = this._dataSource.getRepository(OrderItemEntity);
  }

  public async create(dto: FnbCreateOrderRequest): Promise<OrderDto> {
    try {
      const user = await this._validateUser();

      const request = this._prepareRequestBBOrder(dto, user);
      const result = await this._bitebolt.createOrder(request);
      if (!result) {
        throw new BadRequestException(W24Error.UnexpectedError);
      }

      return this.syncBBOrder({
        bbOrderId: result.id,
        user,
        parentId: dto.parentId,
        isCreating: true,
        requestItems: dto.orderItems,
      });
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async update(dto: FnbUpdateOrderRequest): Promise<OrderDto> {
    try {
      const user = await this._validateUser();
      const currOrder = await this._orderRepository.findOneBy({
        id: dto.orderId,
        customerId: user.id,
        type: OrderTypeEnum.FNB,
      });
      if (!currOrder) throw new BadRequestException(W24Error.NotFound('Order'));

      const reqItems = await this._prepareUpdateOrderItems(dto);

      const request: BBCreateOrderRequest = {
        ...dto,
        orderItems: reqItems,
        orderItemType: BBOrderItemTypeEnum.PRODUCT,
        toGo: true,
      };

      const result = await this._bitebolt.updateOrderItems(request);
      if (!result) {
        throw new BadRequestException(W24Error.UnexpectedError);
      }

      return this.syncBBOrder({
        bbOrderId: dto.orderId,
        user,
        requestItems: dto.orderItems,
      });
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  public async payment(
    request: PaymentOrderRequest,
  ): Promise<PaymentOrderResponse> {
    const user = await this._validateUser();

    const order = await this.syncBBOrder({
      bbOrderId: request.orderId,
      user,
    });
    if (!order) {
      throw new BadRequestException(W24Error.NotFound('Order'));
    }

    if (order.status !== OrderStatusEnum.DRAFT) {
      throw new BadRequestException(W24Error.OrderStatusInvalid);
    }

    try {
      const resultCheckout = await this._bitebolt.placeOrder({
        orderId: order.id,
        paymentMethod: 'pay_later',
        shopId: order.data?.shopId,
        source: 'web',
        giftCardGroups: [],
      });
      if (!resultCheckout || !resultCheckout.result) {
        throw new BadRequestException(W24Error.UnexpectedError);
      }
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }

    try {
      const isCash = request.paymentMethod === PaymentMethod.CASH;
      const isFree = order.grandTotal <= 0;

      if (isCash || isFree) {
        const isPaid = await this.paymentBBOrder(order);
        if (!isPaid) {
          throw new BadRequestException(W24Error.UnexpectedError);
        }
      }

      return this._dataSource.transaction(async (manager) => {
        if (isCash || isFree) {
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

        const paymentResponse = await this._orderService.processPayment(
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
      });
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  private async _prepareUpdateOrderItems(
    dto: FnbUpdateOrderRequest,
  ): Promise<BBOrderItemRequest[]> {
    const itemIds = (dto.orderItems || []).map((item) => item.id);

    const deletedItems = await this._orderItemRepository.findBy({
      orderId: dto.orderId,
      id: Not(In(itemIds)),
    });

    const reqDeletedItems = deletedItems.map((i) => ({
      id: i.id,
      productId: i.productId,
      qty: 0,
      originPrice: i.originPrice,
      productName: i.productName,
      price: i.price,
    }));

    return this._prepareRequestBBItems([...dto.orderItems, ...reqDeletedItems]);
  }

  public async syncBBOrder({
    bbOrderId,
    user,
    parentId,
    isCreating = false,
    requestItems,
    sendNotification = false,
  }: {
    bbOrderId: string;
    user?: UserDto;
    parentId?: string;
    isCreating?: boolean;
    requestItems?: FnbOrderItemRequest[];
    sendNotification?: boolean;
  }): Promise<OrderDto> {
    const bbOrder = await this._bitebolt.getOrder(bbOrderId);
    if (!bbOrder) {
      throw new BadRequestException(W24Error.NotFound('Bitebolt_Order'));
    }

    const { order, items, isStatusChanged } = await this._mapBBOrderToOrder(
      bbOrder,
      user,
      parentId,
      isCreating,
      requestItems,
    );

    const itemIds = items.map((item) => item.id);
    const deletedIds = items
      .filter((item) => item.deletedAt)
      .map((item) => item.id);

    return this._dataSource.transaction(async (manager) => {
      const entity = await manager.getRepository(OrderEntity).save(order);
      const itemRepo = manager.getRepository(OrderItemEntity);

      await itemRepo
        .createQueryBuilder()
        .delete()
        .where([
          { orderId: order.id, id: In(deletedIds) },
          { orderId: order.id, id: Not(In(itemIds)) },
        ])
        .execute();

      if (items?.length) {
        await itemRepo.save(items);
      }

      if (sendNotification && isStatusChanged) {
        this._emitter.emit(EVENT.ORDER.NOTIFICATION, entity);
      }

      return this._mapper.map(entity, OrderEntity, OrderDto);
    });
  }

  private _prepareRequestBBOrder(
    dto: FnbCreateOrderRequest,
    user: UserDto,
  ): BBCreateOrderRequest {
    return {
      ...dto,
      orderItems: this._prepareRequestBBItems(dto.orderItems),
      orderItemType: BBOrderItemTypeEnum.PRODUCT,
      customerName: user.fullName || user.email,
      customerPhone: user.phone,
      toGo: true,
    };
  }

  private _prepareRequestBBItems(
    items: FnbOrderItemRequest[],
  ): BBOrderItemRequest[] {
    return items.map((item) => ({
      ...item,
      /// Make sure to remove optionTypes, linkedProductGroups, discountIds
      optionTypes: [] as any[],
      linkedProductGroups: [] as any[],
      discountIds: [] as any[],
      deletedAt: item.qty <= 0 ? new Date() : null,
    }));
  }

  private async _mapBBOrderToOrder(
    bbOrder: BBOrderDto,
    user?: UserDto,
    parentId?: string,
    isCreating: boolean = false,
    requestItems?: FnbOrderItemRequest[],
  ): Promise<{
    order: OrderEntity;
    items: OrderItemEntity[];
    isStatusChanged: boolean;
  }> {
    try {
      const bbEntity = this._mapper.map(bbOrder, BBOrderDto, OrderEntity);

      const currOrder = await this._orderRepository.findOneBy({
        id: bbOrder.id,
        type: OrderTypeEnum.FNB,
      });

      // ! If order is not found and not created, throw error
      if (!currOrder && !isCreating) {
        throw new BadRequestException(W24Error.NotFound('Order'));
      }

      const order: OrderEntity = {
        ...bbEntity,
        incrementId: currOrder?.incrementId,
        customerId: user?.id || currOrder?.customerId,
        customerPhone: user?.phone || currOrder?.customerPhone,
        customerEmail: user?.email || currOrder?.customerEmail,
        customerName: user?.fullName || currOrder?.customerName,
        paymentMethod: currOrder?.paymentMethod || PaymentMethod.CREDIT,
        paymentProvider: currOrder?.paymentProvider,
        data: {
          ...currOrder?.data,
          shopId: bbOrder.shopId,
        },
        type: OrderTypeEnum.FNB,
        membership: currOrder?.membership,
        membershipAmount: currOrder?.membershipAmount,
        discountIds: currOrder?.discountIds,
        discounts: currOrder?.discounts,
        discountAmount: currOrder?.discountAmount,
        nflowId: currOrder?.nflowId,
        parentId: parentId || currOrder?.parentId,
        status:
          MappingBBToOrderStatus[bbOrder.status] || OrderStatusEnum.UNKNOWN,
      };
      order.grandTotal = OrderUtils.calculateGrandTotal(order);

      const items = await this._transformOrderItems(
        order.id,
        bbOrder.orderItems,
        requestItems,
      );

      return {
        order,
        items,
        isStatusChanged: currOrder?.status !== order.status,
      };
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  private async _transformOrderItems(
    orderId: string,
    bbOrderItems: BBOrderItemDto[] = [],
    requestItems: FnbOrderItemRequest[] = [],
  ): Promise<OrderItemEntity[]> {
    const currItems = await this._orderItemRepository.findBy({
      orderId: orderId,
    });

    return bbOrderItems.map((item) => {
      const currItem = currItems?.find((i) => i.id === item.id);
      const reqItem = requestItems?.find((i) => i.productId === item.productId);
      const photo = reqItem?.photo || currItem?.data?.photo;
      const data = { ...currItem?.data, photo };

      return this._mapBBItemToOrderItem(item, { ...currItem, data }, orderId);
    });
  }

  private _mapBBItemToOrderItem(
    bbItem: BBOrderItemDto,
    currItem: OrderItemEntity,
    orderId: string,
  ): OrderItemEntity {
    try {
      const entity = this._mapper.map(bbItem, BBOrderItemDto, OrderItemEntity);

      const item: OrderItemEntity = {
        ...entity,
        productType: ProductTypeEnum.FNB,
        data: currItem?.data,
        nflowId: currItem?.nflowId,
        orderId,
      };

      return item;
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  private async _validateUser(): Promise<UserDto> {
    const user = await this._userService.getCurrentUser();
    if (!user) throw new ForbiddenException(W24Error.NotFound('User'));
    return user;
  }

  public async paymentBBOrder(order: OrderDto | OrderEntity): Promise<boolean> {
    try {
      const request: BBPaymentOrderRequest = {
        orderId: order.id,
        paymentMethod: 'traditional_terminal',
        shopId: order.data?.shopId,
      };
      const res = await this._bitebolt.paymentOrder(request);
      return res?.result;
    } catch (error) {
      this._logger.error(error);
      return false;
    }
  }
}
