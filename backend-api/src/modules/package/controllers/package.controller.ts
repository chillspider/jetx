import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { ResponseDto } from '../../../common/dto/response.dto';
import { Auth } from '../../../decorators';
import { ApiResponseDto } from '../../../decorators/api-response';
import { PackageDto } from '../dtos/package.dto';
import { PackageService } from '../services/package.service';

@Controller({
  path: 'packages',
  version: '1',
})
@ApiTags('Package')
@Auth()
export class PackageController extends BaseController {
  constructor(private readonly _packageService: PackageService) {
    super();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get packages' })
  @ApiResponseDto({ type: Array<PackageDto> })
  public async getPackages(): Promise<ResponseDto<PackageDto[]>> {
    const response = await this._packageService.getPublishPackages();
    return this.getResponse(true, response);
  }
}
