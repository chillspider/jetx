import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HttpStatusCode } from 'axios';
import { DataSource, In } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { getUtcNow } from '../../../common/utils';
import { EVENT } from '../../../constants';
import { SyncActionEnum } from '../../../constants/action';
import { LoggerService } from '../../../shared/services/logger.service';
import { DeviceLogDto } from '../../device/dtos/device-log.dto';
import { DeviceEntity } from '../../device/entities/device.entity';
import { DeviceLogEntity } from '../../device/entities/device-log.entity';
import { DeviceLogEnum } from '../../device/enums/device-log.enum';
import { DeviceStatusEnum } from '../../device/enums/device-status.enum';
import { OrderEntity } from '../../order/entities/order.entity';
import { OrderItemEntity } from '../../order/entities/order-item.entity';
import { OrderStatusEnum } from '../../order/enums/order-status.enum';
import { IDataBean } from '../../yigoli/interfaces/data-bean.interface';
import { IYglResponse } from '../../yigoli/interfaces/ygl-response.interface';
import { YigoliService } from '../../yigoli/services/yigoli.service';
import { IYglWebhookData, WashStatus } from '../dtos/yigoli-webhook.dto';

@Injectable()
export class YigoliWebhookService {
  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    private readonly _dataSource: DataSource,
    private readonly _yigoli: YigoliService,
    private readonly _logger: LoggerService,
    private readonly _emitter: EventEmitter2,
  ) {}

  public async handleYigoliWebhookRes(body: IDataBean): Promise<IYglResponse> {
    const res = await this.handleYigoliWebhook(body);
    const resultInfo = this._yigoli.transmissionData(res);

    return {
      ...res,
      resultInfo: resultInfo,
    };
  }

  public async handleYigoliWebhook(body: IDataBean): Promise<IYglResponse> {
    if (!body) {
      return {
        traceId: uuid(),
        success: false,
        resultCode: HttpStatusCode.BadRequest.toString(),
        errorMsg: 'MISSING_BODY',
      };
    }

    const deviceLog: DeviceLogDto = {
      type: DeviceLogEnum.RawWebhook,
      deviceNo: uuid(),
      data: {},
      body,
    };
    const rawTraceId = await this.createDeviceLog(deviceLog);

    try {
      const data = this._transformData(body);
      if (!data) {
        return {
          traceId: rawTraceId,
          success: false,
          resultCode: HttpStatusCode.BadRequest.toString(),
          errorMsg: 'INVALID_BODY',
        };
      }

      const deviceLog: DeviceLogDto = {
        type: DeviceLogEnum.Webhook,
        deviceNo: data.deviceNo,
        orderId: data.orderNo,
        data,
        body,
      };

      const traceId = await this.createDeviceLog(deviceLog);

      switch (data.washStatus) {
        case WashStatus.START:
          // ! Duplicated event
          // await this._handleWashStartEvent(data);
          break;
        case WashStatus.COMPLETE:
          await this._handleWashCompleteEvent(data);
          break;
        case WashStatus.STOP:
        case WashStatus.ALARM:
        case WashStatus.REFUND:
          await this._handleWashFailedEvent(data);
          break;
        default:
          break;
      }

      return {
        traceId: traceId || rawTraceId,
        success: true,
        resultCode: HttpStatusCode.Ok.toString(),
      };
    } catch (error) {
      this._logger.error(error);
      return {
        traceId: rawTraceId,
        success: false,
        resultCode: HttpStatusCode.BadRequest.toString(),
        errorMsg: error?.message,
      };
    }
  }

  private async _handleWashStartEvent(data: IYglWebhookData): Promise<void> {
    const { order, item } = await this.getOrderDataForDevice(
      data.orderNo,
      data.deviceNo,
    );
    if (!order || !item) return;

    const isCompleted = await this._dataSource.transaction(async (manager) => {
      item.data = {
        ...item.data,
        startTime: getUtcNow(),
        washStatus: data.washStatus,
      };

      order.status = OrderStatusEnum.PROCESSING;
      await manager.getRepository(OrderEntity).update(
        {
          id: order.id,
          status: OrderStatusEnum.PENDING,
        },
        {
          status: OrderStatusEnum.PROCESSING,
        },
      );
      await manager.getRepository(OrderItemEntity).save(item);
      await manager.getRepository(DeviceEntity).update(
        {
          id: item?.data?.deviceId,
          deviceNo: data.deviceNo,
        },
        {
          status: DeviceStatusEnum.PROCESSING,
        },
      );

      return true;
    });

    if (isCompleted) {
      this._emitter.emit(EVENT.STATION.UPDATE_DEVICE, item?.data?.stationId);
    }
  }

  private async _handleWashCompleteEvent(data: IYglWebhookData): Promise<void> {
    const { order, item } = await this.getOrderDataForDevice(
      data.orderNo,
      data.deviceNo,
    );
    if (!order || !item) return;

    const isCompleted = await this._dataSource.transaction(async (manager) => {
      order.status = OrderStatusEnum.COMPLETED;
      order.data = {
        ...order.data,
        endTime: getUtcNow(),
      };
      order.yglOrderId = data.yglOrderNo;

      item.data = {
        ...item.data,
        washStatus: data.washStatus,
        endTime: getUtcNow(),
      };

      await manager.getRepository(OrderEntity).save(order);
      await manager.getRepository(OrderItemEntity).save(item);
      await manager.getRepository(DeviceEntity).update(
        {
          deviceNo: data.deviceNo,
        },
        {
          status: DeviceStatusEnum.AVAILABLE,
        },
      );

      return true;
    });

    if (isCompleted) {
      this._emitter.emit(EVENT.STATION.UPDATE_DEVICE, item?.data?.stationId);
      this._emitter.emit(EVENT.ORDER.COMPLETED, order.id);

      // ! Sync Nflow
      this._emitter.emit(EVENT.SYNC.ORDER, {
        action: SyncActionEnum.Sync,
        id: order.id,
      });
    }
  }

  private async _handleWashFailedEvent(data: IYglWebhookData): Promise<void> {
    const { order, item } = await this.getOrderDataForDevice(
      data.orderNo,
      data.deviceNo,
    );
    if (!order || !item) return;

    let status = OrderStatusEnum.FAILED;

    switch (data.washStatus) {
      case WashStatus.ALARM:
        status = OrderStatusEnum.ABNORMAL_STOP;
        break;
      case WashStatus.STOP:
        status = OrderStatusEnum.SELF_STOP;
        break;
      case WashStatus.REFUND:
        status = OrderStatusEnum.REFUNDED;
        break;
      default:
        break;
    }

    const isCompleted = await this._dataSource.transaction(async (manager) => {
      order.status = status;
      order.data = {
        ...order.data,
        endTime: getUtcNow(),
      };
      order.yglOrderId = data.yglOrderNo;

      item.data = {
        ...item.data,
        washStatus: data.washStatus,
        endTime: getUtcNow(),
        alarmList: data.alarmList,
      };

      await manager.getRepository(OrderEntity).save(order);
      await manager.getRepository(OrderItemEntity).save(item);
      await manager.getRepository(DeviceEntity).update(
        {
          deviceNo: data.deviceNo,
        },
        {
          status: DeviceStatusEnum.AVAILABLE,
        },
      );

      return true;
    });

    if (isCompleted) {
      this._emitter.emit(EVENT.STATION.UPDATE_DEVICE, item?.data?.stationId);
      this._emitter.emit(EVENT.ORDER.COMPLETED, order.id);

      // ! Sync Nflow
      this._emitter.emit(EVENT.SYNC.ORDER, {
        action: SyncActionEnum.Sync,
        id: order.id,
      });

      // ! Refund
      this._emitter.emit(EVENT.ORDER.REFUND, order.id);
    }
  }

  private async getOrderDataForDevice(
    orderNo: string,
    deviceNo: string,
  ): Promise<{
    order: OrderEntity;
    item: OrderItemEntity;
  }> {
    const orderIncrementId = Number(orderNo);
    if (!orderIncrementId) return { order: null, item: null };

    const order = await this._dataSource.getRepository(OrderEntity).findOneBy({
      incrementId: orderIncrementId,
      status: In([OrderStatusEnum.PENDING, OrderStatusEnum.PROCESSING]),
    });
    if (!order) return { order: null, item: null };

    const item = await this._dataSource
      .getRepository(OrderItemEntity)
      .createQueryBuilder('items')
      .where({ orderId: order.id })
      .andWhere(
        `items.data IS NOT NULL AND ("items"."data"::jsonb->>'deviceNo') =:deviceNo`,
        { deviceNo: deviceNo },
      )
      .getOne();

    return {
      order,
      item,
    };
  }

  private _transformData(body: IDataBean): IYglWebhookData {
    const data = this._yigoli.parseResult<IYglWebhookData>(body);
    if (!data) return null;

    if (data.orderNo) {
      data.orderNo = this._yigoli.removePrefixOrderNo(data.orderNo);
    }

    return data;
  }

  private async createDeviceLog(dto: DeviceLogDto): Promise<string> {
    const entity = this._mapper.map(dto, DeviceLogDto, DeviceLogEntity);

    try {
      const result = await this._dataSource
        .getRepository(DeviceLogEntity)
        .save(entity);

      return result?.id;
    } catch (error) {
      this._logger.error(error);
      return null;
    }
  }
}
