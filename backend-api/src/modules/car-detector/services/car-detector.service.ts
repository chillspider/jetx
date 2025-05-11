import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { IMG_PATH } from '../../../constants/config';
import { W24Error } from '../../../constants/error-code';
import { LoggerService } from '../../../shared/services/logger.service';
import { UploadService } from '../../../shared/services/upload.service';
import { DeviceService } from '../../device/services/device.service';
import { OrderEntity } from '../../order/entities/order.entity';
import { OrderItemEntity } from '../../order/entities/order-item.entity';
import { OrderStatusEnum } from '../../order/enums/order-status.enum';
import { OrderTypeEnum } from '../../order/enums/order-type.enum';
import { ProductTypeEnum } from '../../product/enums/products.enum';
import { OrderDetectorDto } from '../dtos/order-detector.dto';
import { CreateCarDetectorDto } from '../dtos/requests/create-car-detector.dto';
import { CarDetectorEntity } from '../entities/car-detector.entity';

@Injectable()
export class CarDetectorService {
  private readonly _carDetectorRepository: Repository<CarDetectorEntity>;

  constructor(
    @InjectMapper() private readonly _mapper: Mapper,
    private readonly _dataSource: DataSource,
    private readonly _logger: LoggerService,
    private readonly _upload: UploadService,
    private readonly _deviceService: DeviceService,
  ) {
    this._carDetectorRepository =
      this._dataSource.getRepository(CarDetectorEntity);
  }

  async getOrderProcessing({
    deviceId,
    orderId,
    customerId,
  }: {
    deviceId: string;
    orderId?: string;
    customerId?: string;
  }): Promise<OrderDetectorDto> {
    try {
      const device = await this._deviceService.getDevice(deviceId);
      if (!device) {
        throw new BadRequestException(W24Error.NotFound('Device'));
      }

      const builder = this._dataSource
        .getRepository(OrderItemEntity)
        .createQueryBuilder('i')
        .leftJoin(OrderEntity, 'o', 'o.id = i.orderId')
        .where(
          `i.data IS NOT NULL AND ("i"."data"::jsonb->>'deviceId') =:deviceId`,
          { deviceId: device.id },
        )
        .andWhere(`i.productType = :productType`, {
          productType: ProductTypeEnum.WASHING,
        })
        .andWhere('o.status = :status', {
          status: OrderStatusEnum.PROCESSING,
        })
        .andWhere('o.type = :type', {
          type: OrderTypeEnum.DEFAULT,
        });

      if (orderId) {
        builder.andWhere('i.orderId = :orderId', { orderId });
      }

      if (customerId) {
        builder.andWhere('o.customerId = :customerId', { customerId });
      }

      const item = await builder.orderBy('o.createdAt', 'DESC').getOne();
      if (!item) {
        throw new BadRequestException(W24Error.NotFound('Order'));
      }

      const order = await this._dataSource
        .getRepository(OrderEntity)
        .findOneBy({ id: item.orderId });
      if (!order) {
        throw new BadRequestException(W24Error.NotFound('Order'));
      }

      const dto = this._mapper.map(order, OrderEntity, OrderDetectorDto);
      dto.deviceId = item?.data?.deviceId;
      dto.deviceName = item?.data?.deviceName;
      dto.deviceNo = item?.data?.deviceNo;

      return dto;
    } catch (error) {
      this._logger.error(error);
      throw error;
    }
  }

  async createCarDetector(
    dto: CreateCarDetectorDto,
    image: Express.Multer.File,
  ): Promise<boolean> {
    try {
      const isCarDetected = await this._carDetectorRepository.findOneBy({
        orderId: dto.orderId,
      });
      if (isCarDetected) {
        throw new BadRequestException(W24Error.AlreadyExists('Car_Detector'));
      }

      const order = await this.getOrderProcessing({
        deviceId: dto.deviceId,
        orderId: dto.orderId,
        customerId: dto.customerId,
      });
      if (!order) {
        throw new BadRequestException(W24Error.NotFound('Order'));
      }

      const imageUrl = await this._upload.uploadImage(image, IMG_PATH.CAR);

      const carDetector: Partial<CarDetectorEntity> = {
        customerId: dto.customerId,
        orderId: dto.orderId,
        imageUrl: imageUrl,
        plateNumber: dto?.car?.plateNumber,
        brand: dto?.car?.brand,
        carType: dto?.car?.carType,
        color: dto?.car?.color,
        data: {
          deviceId: order.deviceId,
          deviceName: order.deviceName,
          deviceNo: order.deviceNo,
        },
      };

      await this._carDetectorRepository.save(carDetector);

      return true;
    } catch (error) {
      this._logger.error(error);
      throw error;
    }
  }
}
