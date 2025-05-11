import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { ResponseDto } from '../../../common/dto/response.dto';
import { ApiFile, Auth } from '../../../decorators';
import { ApiResponseDto } from '../../../decorators/api-response';
import { DetectorService } from '../../../shared/services/detector.service';
import { Role } from '../../role-permission/enums/roles.enum';
import { CarModelDto } from '../dtos/car-model.dto';
import { OrderDetectorDto } from '../dtos/order-detector.dto';
import { CreateCarDetectorDto } from '../dtos/requests/create-car-detector.dto';
import { CarDetectorService } from '../services/car-detector.service';

@Controller({
  path: 'detectors',
  version: '1',
})
@ApiTags('Car Detector')
@Auth({ roles: [Role.ASSISTANT, Role.SA] })
export class CarDetectorController extends BaseController {
  constructor(
    private readonly _carDetectorService: CarDetectorService,
    private readonly _detectorService: DetectorService,
  ) {
    super();
  }

  @Get('orders/:deviceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get order processing to car detector' })
  @ApiResponseDto({ type: OrderDetectorDto })
  async getOrders(
    @Param('deviceId') deviceId: string,
  ): Promise<ResponseDto<OrderDetectorDto>> {
    const result = await this._carDetectorService.getOrderProcessing({
      deviceId,
    });
    return this.getResponse(true, result);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiFile({ name: 'image' })
  @ApiOperation({ summary: 'Create car detector' })
  @ApiResponseDto({ type: Boolean })
  async createCarDetector(
    @Body() dto: CreateCarDetectorDto,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<ResponseDto<boolean>> {
    const isSuccess = await this._carDetectorService.createCarDetector(
      dto,
      image,
    );
    return this.getResponse(true, isSuccess);
  }

  @Post('analyze-car')
  @HttpCode(HttpStatus.OK)
  @ApiFile({ name: 'image' })
  @ApiOperation({ summary: 'Analyze car' })
  @ApiResponseDto({ type: CarModelDto })
  async analyzeCar(
    @UploadedFile() image: Express.Multer.File,
  ): Promise<ResponseDto<CarModelDto>> {
    const result = await this._detectorService.analyzeCar(image);
    return this.getResponse(true, result);
  }
}
