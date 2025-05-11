import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { Auth } from '../../../decorators';
import { ApiResponseDto } from '../../../decorators/api-response';
import { OrderDto } from '../dtos/order.dto';
import {
  FnbCreateOrderRequest,
  FnbUpdateOrderRequest,
} from '../dtos/requests/fnb-order.request.dto';
import { PaymentOrderRequest } from '../dtos/requests/payment-order.request';
import { PaymentOrderResponse } from '../dtos/responses/payment-order.response.dto';
import { FnbOrderService } from '../services/fnb-order.service';

@Controller({
  path: 'fnb-order',
  version: '1',
})
@ApiTags('Fnb Order')
@Auth()
export class FnbOrderController extends BaseController {
  constructor(private readonly _fnbOrderService: FnbOrderService) {
    super();
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create FNB order' })
  @ApiResponseDto({ type: OrderDto })
  public async create(@Body() dto: FnbCreateOrderRequest) {
    const response = await this._fnbOrderService.create(dto);
    return this.getResponse(response !== null, response);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update FNB order' })
  @ApiResponseDto({ type: OrderDto })
  public async update(@Body() dto: FnbUpdateOrderRequest) {
    const response = await this._fnbOrderService.update(dto);
    return this.getResponse(response !== null, response);
  }

  @Post('payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment FNB order' })
  @ApiResponseDto({ type: PaymentOrderResponse })
  public async payment(@Body() dto: PaymentOrderRequest) {
    const response = await this._fnbOrderService.payment(dto);
    return this.getResponse(!!response?.result, response);
  }
}
