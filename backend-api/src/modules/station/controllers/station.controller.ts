import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { ResponseDto } from '../../../common/dto/response.dto';
import { Auth, UUIDParam } from '../../../decorators';
import {
  ApiPageResponse,
  ApiResponseDto,
} from '../../../decorators/api-response';
import { StationDetailRequestDto } from '../dtos/requests/station-detail-request.dto';
import { StationListRequestDto } from '../dtos/requests/station-list-request.dto';
import { StationDto } from '../dtos/station.dto';
import { StationService } from '../services/station.service';

@Controller({
  path: 'stations',
  version: '1',
})
@ApiTags('Stations')
export class StationController extends BaseController {
  constructor(private _stationService: StationService) {
    super();
  }

  @Get()
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get stations list' })
  @ApiPageResponse({ type: StationDto })
  async getStations(
    @Query(new ValidationPipe({ transform: true }))
    query: StationListRequestDto,
  ): Promise<ResponseDto<PaginationResponseDto<StationDto>>> {
    const result = await this._stationService.getStations(query);
    return this.getResponse(true, result);
  }

  @Get(':id')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get station by id' })
  @ApiResponseDto({ type: StationDto })
  async getStation(
    @UUIDParam('id') id: string,
    @Query(new ValidationPipe({ transform: true }))
    query?: StationDetailRequestDto,
  ): Promise<ResponseDto<StationDto>> {
    const result = await this._stationService.getStation(id, query);
    return this.getResponse(true, result);
  }
}
