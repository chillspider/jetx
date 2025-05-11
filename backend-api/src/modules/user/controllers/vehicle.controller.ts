import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  UploadedFile,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { ResponseDto } from '../../../common/dto/response.dto';
import { ApiFile, Auth, UUIDParam } from '../../../decorators';
import {
  ApiPageResponse,
  ApiResponseDto,
} from '../../../decorators/api-response';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
} from '../dtos/requests/create-vehicle.dto';
import { VehicleDto } from '../dtos/vehicle.dto';
import { VehicleService } from '../services/vehicle.service';

@Controller({
  path: 'vehicles',
  version: '1',
})
@ApiTags('Vehicles')
export class VehicleController extends BaseController {
  constructor(private _vehicleService: VehicleService) {
    super();
  }

  @Get()
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get my vehicles list' })
  @ApiPageResponse({ type: VehicleDto })
  async getVehicles(
    @Query(new ValidationPipe({ transform: true }))
    query: PaginationRequestDto,
  ): Promise<ResponseDto<PaginationResponseDto<VehicleDto>>> {
    const result = await this._vehicleService.getVehicles(query);
    return this.getResponse(true, result);
  }

  @Post()
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiFile({ name: 'featureImage' })
  @ApiOperation({ summary: 'Create vehicle' })
  @ApiResponseDto({ type: VehicleDto })
  async createVehicle(
    @Body() request: CreateVehicleDto,
    @UploadedFile() featureImage?: Express.Multer.File,
  ): Promise<ResponseDto<VehicleDto>> {
    const result = await this._vehicleService.create(request, featureImage);
    return this.getResponse(true, result);
  }

  @Put()
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiFile({ name: 'featureImage' })
  @ApiOperation({ summary: 'Update vehicle' })
  @ApiResponseDto({ type: Boolean })
  async updateVehicle(
    @Body() request: UpdateVehicleDto,
    @UploadedFile() featureImage?: Express.Multer.File,
  ): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._vehicleService.update(request, featureImage);
    return this.getResponse(true, isUpdated);
  }

  @Get(':id')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get vehicle detail' })
  @ApiResponseDto({ type: VehicleDto })
  async getVehicle(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<VehicleDto>> {
    const result = await this._vehicleService.getVehicle(id);
    return this.getResponse(true, result);
  }

  @Delete(':id')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete vehicle' })
  @ApiResponseDto({ type: Boolean })
  async deleteVehicle(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    const isDeleted = await this._vehicleService.delete(id);
    return this.getResponse(true, isDeleted);
  }
}
