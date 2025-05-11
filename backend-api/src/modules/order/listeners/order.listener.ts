import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Queue } from 'bull';
import dayjs from 'dayjs';
import { DataSource, In, IsNull, Not } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { getImageBuffer, getUtcNow, retry } from '../../../common/utils';
import { CRON, EVENT, QUEUE } from '../../../constants';
import { SyncActionEnum } from '../../../constants/action';
import { IMG_PATH } from '../../../constants/config';
import { W24Error } from '../../../constants/error-code';
import { MQTT_TOPIC } from '../../../constants/mqtt';
import { DetectorService } from '../../../shared/services/detector.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { UploadService } from '../../../shared/services/upload.service';
import { CarDetectorEntity } from '../../car-detector/entities/car-detector.entity';
import { DeviceEntity } from '../../device/entities/device.entity';
import { DeviceStatusEnum } from '../../device/enums/device-status.enum';
import { MqttService } from '../../mqtt';
import { NflowService } from '../../nflow/services/nflow.service';
import { NotificationDto } from '../../notification/dtos/notification.dto';
import {
  NotificationProcess,
  NotificationType,
} from '../../notification/enums/notification.enum';
import { PackageVoucherEntity } from '../../package/entities/package-voucher.entity';
import { ProductTypeEnum } from '../../product/enums/products.enum';
import { StationModeService } from '../../station/services/station-mode.service';
import { InvoiceProcessEnum } from '../../tax/enums/invoice-process.enum';
import { OperationType } from '../../yigoli/enums/operation-type.enum';
import { WashMode } from '../../yigoli/enums/wash-mode.enum';
import { YigoliService } from '../../yigoli/services/yigoli.service';
import { OrderMetaData } from '../dtos/order-metadata.dto';
import { OrderNotificationDto } from '../dtos/order-notification.dto';
import { OrderEntity } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';
import { OrderStatusEnum } from '../enums/order-status.enum';
import { OrderTypeEnum } from '../enums/order-type.enum';
import { OrderService } from '../services/order.service';
import { OrderUtils } from '../utils/order.utils';

@Injectable()
export class OrderListener {
  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    @InjectQueue(QUEUE.NOTIFICATION)
    private readonly _queue: Queue<NotificationDto>,
    @InjectQueue(QUEUE.INVOICE.IMPORT)
    private readonly _invoiceQueue: Queue<string>,
    private _dataSource: DataSource,
    private readonly _yigoli: YigoliService,
    private readonly _emitter: EventEmitter2,
    private readonly _orderService: OrderService,
    private readonly _mqtt: MqttService,
    private readonly _stationModeService: StationModeService,
    private readonly _logger: LoggerService,
    private readonly _nflowService: NflowService,
    private readonly _detector: DetectorService,
    private readonly _scheduler: SchedulerRegistry,
    private readonly _upload: UploadService,
  ) {}

  @OnEvent(EVENT.ORDER.START_DEVICE)
  async startDeviceOfOrder(orderId: string): Promise<void> {
    const [order, item] = await Promise.all([
      this._dataSource.getRepository(OrderEntity).findOneBy({
        id: orderId,
        status: OrderStatusEnum.PENDING,
      }),
      this._dataSource
        .getRepository(OrderItemEntity)
        .findOneBy({ orderId, productType: ProductTypeEnum.WASHING }),
    ]);

    if (!order || !item) {
      this.syncOrderNflow(orderId);
      return;
    }

    const deviceId = item.data?.deviceId;
    const device = await this._dataSource.getRepository(DeviceEntity).findOne({
      where: { id: deviceId },
      relations: ['station'],
    });

    if (!device) {
      this.syncOrderNflow(orderId);
      return;
    }

    const processItem = await this._processItem(order, item, device);
    if (processItem) {
      await this.handleProcessingOrder(
        order,
        processItem.item,
        processItem.device,
      );
    } else {
      await this.handleFailedOrder(order);
    }

    // ! Notify
    this.sendNotification(order);

    // ! Sync Nflow
    this.syncOrderNflow(order.id);

    if (!processItem) {
      this._emitter.emit(EVENT.ORDER.REFUND, order.id);
    }
  }

  private syncOrderNflow(orderId: string) {
    this._emitter.emit(EVENT.SYNC.ORDER, {
      action: SyncActionEnum.Sync,
      id: orderId,
    });
  }

  private async handleFailedOrder(order: OrderEntity) {
    order.status = OrderStatusEnum.FAILED;
    await this._dataSource.getRepository(OrderEntity).save(order);
  }

  private async handleProcessingOrder(
    order: OrderEntity,
    item: OrderItemEntity,
    device: DeviceEntity,
  ) {
    await this._dataSource.transaction(async (manager) => {
      await manager.getRepository(OrderItemEntity).save(item);
      await manager.getRepository(DeviceEntity).save(device);

      const metadata: OrderMetaData = {
        ...order.data,
        startTime: item.data?.startTime,
        estEndTime: item.data?.estEndTime,
      };
      order.data = metadata;
      order.status = OrderStatusEnum.PROCESSING;

      await manager.getRepository(OrderEntity).save(order);
    });

    this._emitter.emit(EVENT.STATION.UPDATE_DEVICE, device.stationId);
  }

  // TODO: Remove when ygl webhook stable
  @OnEvent(EVENT.ORDER.CHECK_STATUS)
  async onCheckOrderStatus() {
    const orders = await this._dataSource.getRepository(OrderEntity).find({
      where: {
        status: In([OrderStatusEnum.PROCESSING, OrderStatusEnum.PENDING]),
      },
      select: ['id'],
    });
    const tasks = orders.map((o) => this._orderService.checkOrderStatus(o.id));
    await Promise.all(tasks);
  }

  @OnEvent(EVENT.ORDER.COMPLETED)
  async completeOrder(orderId: string): Promise<boolean> {
    // ! Schedule to detect car
    this._scheduleDetectorHandler(orderId);

    const order = await this._dataSource.getRepository(OrderEntity).findOneBy({
      id: orderId,
      status: Not(
        In([
          OrderStatusEnum.DRAFT,
          OrderStatusEnum.PENDING,
          OrderStatusEnum.PROCESSING,
        ]),
      ),
    });
    if (!order) return false;

    if (order.discountIds?.length) {
      // ! Assign station for package orders
      order.discountIds?.forEach((id) => {
        this._emitter.emit(EVENT.ORDER.ALLOCATE_PACKAGE_STATION, id);
      });
    }

    if (OrderUtils.canImportInvoice(order)) {
      this._invoiceQueue.add(InvoiceProcessEnum.IMPORT, order.id, {
        jobId: order.id,
      });

      if (order.type === OrderTypeEnum.DEFAULT) {
        this._emitter.emit(EVENT.USER.WASHED, order.customerId);
      }
    }

    await this.sendNotification(order);
    return true;
  }

  private async _operationDevice(
    order: OrderEntity,
    item: OrderItemEntity,
    device: DeviceEntity,
    operation: OperationType,
    mode: WashMode,
  ): Promise<boolean> {
    try {
      const req = this._orderService.createOperationMachineRequest({
        order,
        item,
        device,
        operation,
        mode,
      });

      return await retry(() => this._yigoli.operationMachine(req), 3);
    } catch (error) {
      return false;
    }
  }

  private async _processItem(
    order: OrderEntity,
    item: OrderItemEntity,
    device: DeviceEntity,
  ): Promise<{
    item: OrderItemEntity;
    device: DeviceEntity;
  }> {
    const deviceId = item.data?.deviceId;
    const deviceNo = item.data?.deviceNo;
    const modeId = item.data?.modeId;

    if (!deviceNo || !modeId || !deviceId) {
      return;
    }

    const modes = await this._stationModeService.getProductModes({
      stationId: device.stationId,
      productId: device.productId,
    });

    const mode = modes.find((m) => m.id === modeId);
    if (!mode) return;

    const modeCode = OrderUtils.getWashMode(mode.code);
    if (!modeCode) return;

    const isStarted = await this._operationDevice(
      order,
      item,
      device,
      OperationType.START,
      modeCode,
    );
    if (!isStarted) return;

    // START SUCCESS
    device.status = DeviceStatusEnum.PROCESSING;

    const itemDuration = Number(mode.metadata?.duration || 0);
    const itemStartTime = getUtcNow();

    item.data = {
      ...item.data,
      mode: modeCode,
      modeName: mode.name,
      startTime: itemStartTime,
      estEndTime: dayjs(itemStartTime).add(itemDuration, 'm').toDate(),
    };

    return { item, device };
  }

  @OnEvent(EVENT.ORDER.NOTIFICATION)
  public async sendNotification(
    order: OrderEntity,
    lang?: string,
  ): Promise<void> {
    if (!order) return;

    const data = this._mapper.map(order, OrderEntity, OrderNotificationDto);
    this.publishOrderTopic(data);

    const isNotificationAllowed = OrderUtils.validateNotifyOrder(order);
    if (!isNotificationAllowed) return;

    const { title, content } = OrderUtils.notificationMsg(
      order.status,
      order.type,
    );

    const combinedData: OrderNotificationDto = {
      ...data,
      id: order.type === OrderTypeEnum.FNB ? order.parentId : order.id,
      fnbOrderId: order.type === OrderTypeEnum.FNB ? order.id : null,
    };

    const notification: NotificationDto = {
      id: uuid(),
      lang,
      userId: order.customerId,
      title,
      content,
      type: NotificationType.ORDER,
      data: combinedData,
      deepLink: OrderUtils.getDeepLink(order.type),
    };

    await this._queue.add(NotificationProcess.CUSTOMER, notification);
  }

  private async publishOrderTopic(order: OrderNotificationDto): Promise<void> {
    try {
      await this._mqtt.publish(`${MQTT_TOPIC.ORDER}_${order.id}`, {
        data: {
          type: NotificationType.ORDER,
          data: order,
        },
      });
    } catch (error) {
      this._logger.error(error);
    }
  }

  @OnEvent(EVENT.ORDER.REFUND)
  async handleNflowRefund(orderId: string): Promise<void> {
    try {
      const order = await this._dataSource
        .getRepository(OrderEntity)
        .findOneBy({ id: orderId });
      if (!order) {
        throw new BadRequestException(W24Error.NotFound('Order'));
      }

      this._orderService.rollbackVoucher(order.id);

      if (order?.grandTotal <= 0) {
        return;
      }

      await this._nflowService.refund(order);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  async handleOrderDetector(orderId: string): Promise<void> {
    const isExists = await this._dataSource
      .getRepository(CarDetectorEntity)
      .existsBy({ orderId });
    if (isExists) return;

    const [order, item] = await Promise.all([
      this._dataSource.getRepository(OrderEntity).findOneBy({
        id: orderId,
        type: OrderTypeEnum.DEFAULT,
        yglOrderId: Not(IsNull()),
      }),
      this._dataSource
        .getRepository(OrderItemEntity)
        .findOneBy({ orderId, productType: ProductTypeEnum.WASHING }),
    ]);
    if (!order) return;

    const yglOrder = await this._yigoli.getOrder(order.yglOrderId);
    if (!yglOrder) return;

    try {
      let image = await getImageBuffer(yglOrder.washCarAfterPic);
      let car = await this._detector.analyzeCarByBuffer(image);

      if (!car) {
        image = await getImageBuffer(yglOrder.washCarBeforePic);
        car = await this._detector.analyzeCarByBuffer(image);
      }
      if (!car) return;

      const imageUrl = await this._upload.uploadImageFromBuffer(
        image?.buffer,
        IMG_PATH.CAR,
      );

      const entity: Partial<CarDetectorEntity> = {
        customerId: order.customerId,
        orderId: order.id,
        imageUrl,
        plateNumber: car.plateNumber,
        brand: car.brand,
        carType: car.carType,
        color: car.color,
        data: {
          deviceId: item?.data?.deviceId,
          deviceName: item?.data?.deviceName,
          deviceNo: item?.data?.deviceNo,
          washCarBeforePic: yglOrder.washCarBeforePic,
          washCarAfterPic: yglOrder.washCarAfterPic,
        },
      };

      await this._dataSource.getRepository(CarDetectorEntity).save(entity);
    } catch (error) {
      this._logger.error(error);
      throw new BadRequestException(error);
    }
  }

  private async _scheduleDetectorHandler(orderId: string): Promise<void> {
    try {
      const schedulerName = CRON.DETECTOR_PENDING(orderId);

      const timeout = setTimeout(async () => {
        await this.handleOrderDetector(orderId);
        this._scheduler.deleteTimeout(schedulerName);
      }, 15 * 1000); // 15 seconds

      this._scheduler.addTimeout(schedulerName, timeout);
    } catch (error) {
      this._logger.error(error);
    }
  }

  @OnEvent(EVENT.ORDER.ALLOCATE_PACKAGE_STATION)
  public async allocateStationToPackage(voucherId: string): Promise<void> {
    const pkgVoucher = await this._dataSource
      .getRepository(PackageVoucherEntity)
      .findOne({
        where: { voucherId },
        select: ['orderId'],
      });

    if (!pkgVoucher) return;

    const order = await this._dataSource
      .getRepository(OrderEntity)
      .createQueryBuilder('o')
      .where({
        id: pkgVoucher.orderId,
        status: OrderStatusEnum.COMPLETED,
        type: OrderTypeEnum.PACKAGE,
      })
      .andWhere(`o.data->>'stationId' IS NULL`)
      .select(['o.id', 'o.data'])
      .getOne();
    if (!order) return;

    const [voucher]: Array<{
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
            AND v.data->>'orderPackageId' = $1
          ORDER BY v.data->>'orderPackageId', v.updated_at ASC
          LIMIT 1
        `,
      [order.id],
    );

    if (voucher) {
      const data = {
        ...order.data,
        stationId: voucher.station_id,
        stationName: voucher.station_name,
      };
      await this._dataSource
        .getRepository(OrderEntity)
        .update(order.id, { data });

      this._emitter.emit(EVENT.SYNC.ORDER, {
        action: SyncActionEnum.Sync,
        id: order.id,
      });
    }
  }
}
