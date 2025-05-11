import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { ResponseDto } from '../../../common/dto/response.dto';
import { Auth } from '../../../decorators';
import { ApiResponseDto } from '../../../decorators/api-response';
import { CityDto } from '../dtos/city.dto';
import { CountryDto } from '../dtos/country.dto';
import { DistrictDto } from '../dtos/district.dto';
import { WardDto } from '../dtos/ward.dto';
import { LocationService } from '../services/location.service';

@Controller({
  path: 'locations',
  version: '1',
})
@ApiTags('Locations')
export class LocationController extends BaseController {
  constructor(private readonly _locationService: LocationService) {
    super();
  }

  @Get('countries')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get countries' })
  @ApiResponseDto({ type: Array<CountryDto> })
  public async getCountries(): Promise<ResponseDto<CountryDto[]>> {
    const result = await this._locationService.getCountries();
    return this.getResponse(true, result);
  }

  @Get('cities')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get cities' })
  @ApiResponseDto({ type: Array<CityDto> })
  public async getCities(): Promise<ResponseDto<CityDto[]>> {
    const result = await this._locationService.getCities();
    return this.getResponse(true, result);
  }

  @Get('cities/:countryCode')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get cities by country' })
  @ApiResponseDto({ type: Array<CityDto> })
  public async getCitiesByCountry(
    @Param('countryCode') countryCode: string,
  ): Promise<ResponseDto<CityDto[]>> {
    const result = await this._locationService.getCities(countryCode);
    return this.getResponse(true, result);
  }

  @Get('districts/:cityCode')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get districts by city' })
  @ApiResponseDto({ type: Array<DistrictDto> })
  public async getDistricts(
    @Param('cityCode') cityCode: string,
  ): Promise<ResponseDto<DistrictDto[]>> {
    const result = await this._locationService.getDistricts(cityCode);
    return this.getResponse(true, result);
  }

  @Get('districts/:countryCode/:cityCode')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get districts by city' })
  @ApiResponseDto({ type: Array<DistrictDto> })
  public async getDistrictsByCountry(
    @Param('cityCode') cityCode: string,
    @Param('countryCode') countryCode: string,
  ): Promise<ResponseDto<DistrictDto[]>> {
    const result = await this._locationService.getDistricts(
      cityCode,
      countryCode,
    );
    return this.getResponse(true, result);
  }

  @Get('wards/:districtCode')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get wards by district' })
  @ApiResponseDto({ type: Array<WardDto> })
  public async getWards(
    @Param('districtCode') districtCode: string,
  ): Promise<ResponseDto<WardDto[]>> {
    const result = await this._locationService.getWards(districtCode);
    return this.getResponse(true, result);
  }

  @Get('wards/:countryCode/:districtCode')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get wards by district' })
  @ApiResponseDto({ type: Array<WardDto> })
  public async getWardsByCountry(
    @Param('districtCode') districtCode: string,
    @Param('countryCode') countryCode: string,
  ): Promise<ResponseDto<WardDto[]>> {
    const result = await this._locationService.getWards(
      districtCode,
      countryCode,
    );
    return this.getResponse(true, result);
  }
}
