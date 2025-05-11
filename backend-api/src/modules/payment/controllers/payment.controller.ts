import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { ResponseDto } from '../../../common/dto/response.dto';
import { Auth } from '../../../decorators';
import { ApiResponseDto } from '../../../decorators/api-response';
import { PaymentMethodModel } from '../dtos/payment-method-model';
import { GetPaymentMethodRequest } from '../dtos/requests/get-payment-method.request';
import { PaymentService } from '../services/payment.service';

@Controller({
  path: 'payments',
  version: '1',
})
@ApiTags('Payments')
export class PaymentController extends BaseController {
  constructor(private readonly _paymentService: PaymentService) {
    super();
  }

  @Get('methods')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment methods' })
  @ApiResponseDto({ type: Array<PaymentMethodModel> })
  public async getPaymentMethods(
    @Query() query: GetPaymentMethodRequest,
  ): Promise<ResponseDto<PaymentMethodModel[]>> {
    const response = await this._paymentService.getPaymentMethods(query);
    return this.getResponse(!!response, response);
  }
}
