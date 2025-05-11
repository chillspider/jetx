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
import { Transactional } from 'typeorm-transactional';

import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { IMG_PATH } from '../../../constants/config';
import { W24Error } from '../../../constants/error-code';
import { IImageResizeOption } from '../../../shared/services/s3.service';
import { UploadService } from '../../../shared/services/upload.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
} from '../dtos/requests/create-vehicle.dto';
import { VehicleDto } from '../dtos/vehicle.dto';
import { VehicleEntity } from '../entities/vehicle.entity';

@Injectable()
export class VehicleService {
  private readonly _vehicleRepository: Repository<VehicleEntity>;

  constructor(
    private _dataSource: DataSource,
    @InjectMapper() private readonly _mapper: Mapper,
    @Inject(REQUEST) private readonly _req: any,
    private readonly _upload: UploadService,
  ) {
    this._vehicleRepository = this._dataSource.getRepository(VehicleEntity);
  }

  public async getVehicles(
    query: PaginationRequestDto,
  ): Promise<PaginationResponseDto<VehicleDto>> {
    const userId = this._req.user.id;
    if (!userId) throw new ForbiddenException();

    const builder = this._vehicleRepository
      .createQueryBuilder('vehicles')
      .where({ userId })
      .orderBy('vehicles.createdAt', query.order);

    const [items, meta] = await builder.paginate(query);

    const dtos = this._mapper.mapArray(items, VehicleEntity, VehicleDto);
    return dtos.toPagination(meta);
  }

  public async getVehicle(id: string): Promise<VehicleDto> {
    const userId = this._req.user.id;
    if (!userId) throw new ForbiddenException();

    const entity = await this._vehicleRepository.findOne({
      where: { id, userId },
    });
    if (!entity) throw new BadRequestException(W24Error.NotFound('Vehicle'));

    return this._mapper.map(entity, VehicleEntity, VehicleDto);
  }

  @Transactional()
  public async create(
    dto: CreateVehicleDto,
    featureImage?: Express.Multer.File,
  ): Promise<VehicleDto> {
    const entity: VehicleEntity = this._mapper.map(
      dto,
      CreateVehicleDto,
      VehicleEntity,
    );

    const userId = this._req.user.id;
    if (!userId) throw new ForbiddenException();

    const isNumberPlateValid = await this._validateNumberPlate(
      userId,
      entity.numberPlate,
    );

    if (!isNumberPlateValid) {
      throw new BadRequestException(W24Error.AlreadyExists('Number_plate'));
    }

    entity.userId = userId;

    if (featureImage) {
      entity.featureImageUrl = await this._uploadImage(featureImage);
    }

    return this._dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(VehicleEntity);

      const hasVehicle = await repo.findOneBy({ userId });
      if (!hasVehicle) entity.isDefault = true;

      if (entity.isDefault && hasVehicle) {
        await repo.update({ userId, isDefault: true }, { isDefault: false });
      }

      const vehicle = await repo.save(entity);
      return this._mapper.map(vehicle, VehicleEntity, VehicleDto);
    });
  }

  @Transactional()
  public async update(
    dto: UpdateVehicleDto,
    featureImage?: Express.Multer.File,
  ): Promise<boolean> {
    const userId = this._req.user.id;
    if (!userId) throw new ForbiddenException();

    const currVehicle = await this._vehicleRepository.findOneBy({
      id: dto.id,
      userId,
    });

    if (!currVehicle)
      throw new BadRequestException(W24Error.NotFound('Vehicle'));
    if (currVehicle.userId !== userId) {
      throw new ForbiddenException();
    }

    const updateEntity = this._mapper.map(dto, UpdateVehicleDto, VehicleEntity);

    const isNumberPlateValid = await this._validateNumberPlate(
      userId,
      updateEntity.numberPlate,
      currVehicle.id,
    );

    if (!isNumberPlateValid) {
      throw new BadRequestException(W24Error.AlreadyExists('Number_plate'));
    }

    await this._updateImage(updateEntity, currVehicle, featureImage);

    return this._dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(VehicleEntity);

      const hasVehicle = await repo.findOneBy({
        userId,
        id: Not(updateEntity.id),
      });
      if (!hasVehicle) updateEntity.isDefault = true;

      if (updateEntity.isDefault && hasVehicle) {
        await repo.update({ userId, isDefault: true }, { isDefault: false });
      }

      const vehicle = await repo.save(updateEntity);
      return !!vehicle;
    });
  }

  public async delete(id: string): Promise<boolean> {
    const userId = this._req.user.id;
    if (!userId) throw new ForbiddenException();

    const vehicle = await this._vehicleRepository.findOneBy({
      id: id,
      userId,
    });
    if (!vehicle) throw new BadRequestException(W24Error.NotFound('Vehicle'));
    if (vehicle.userId !== userId) {
      throw new ForbiddenException();
    }

    if (vehicle.featureImageUrl) {
      await this._upload.deleteImages(vehicle.featureImageUrl);
    }

    const result = await this._vehicleRepository.delete(id);
    return Boolean(result?.affected);
  }

  private async _updateImage(
    updateEntity: VehicleEntity,
    entity: VehicleEntity,
    featureImage?: Express.Multer.File,
  ): Promise<void> {
    if (updateEntity.featureImageUrl?.length) {
      updateEntity.featureImageUrl = entity.featureImageUrl;
    } else {
      updateEntity.featureImageUrl = '';
    }

    if (featureImage) {
      updateEntity.featureImageUrl = await this._uploadImage(featureImage);
    }

    // Delete old image
    const isDifferentImage =
      entity.featureImageUrl &&
      entity.featureImageUrl !== updateEntity.featureImageUrl;

    if (isDifferentImage) {
      await this._upload.deleteImages(entity.featureImageUrl ?? '');
    }
  }

  private async _validateNumberPlate(
    userId: string,
    numberPlate: string,
    id?: string,
  ): Promise<boolean> {
    const builder = this._vehicleRepository
      .createQueryBuilder('vehicles')
      .where({
        userId,
        numberPlate,
      });

    if (id) {
      builder.andWhere({ id: Not(id) });
    }

    const count = await builder.getCount();
    return count === 0;
  }

  private async _uploadImage(
    file: Express.Multer.File,
    resizeOption?: IImageResizeOption,
  ): Promise<string> {
    const prefix = IMG_PATH.USER_VEHICLE;
    const result = await this._upload.uploadImage(file, prefix, resizeOption);
    return result;
  }
}
