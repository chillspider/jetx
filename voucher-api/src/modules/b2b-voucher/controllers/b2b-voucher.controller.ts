import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { BaseController } from '../../../common/controllers/base.controller';
import { ResponseDto } from '../../../common/dto/response.dto';
import { Auth } from '../../../decorators';
import { ApiResponseDto } from '../../../decorators/api-response';
import { VoucherDto } from '../../voucher/dtos/voucher.dto';
import { B2bVoucherService } from '../services/b2b-voucher.service';

@Controller({
  path: 'b2b-vouchers',
  version: '1',
})
@ApiTags('B2B Voucher')
export class B2bVoucherController extends BaseController {
  constructor(private _b2bVoucherService: B2bVoucherService) {
    super();
  }

  @Post('redeem/:code')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeem a b2b voucher' })
  @ApiResponseDto({ type: VoucherDto })
  @Throttle({ default: { limit: 1, ttl: 5000 } })
  async redeemVoucher(
    @Param('code') code: string,
  ): Promise<ResponseDto<VoucherDto>> {
    const result = await this._b2bVoucherService.redeemCode(code);
    return this.getResponse(true, result);
  }
}
