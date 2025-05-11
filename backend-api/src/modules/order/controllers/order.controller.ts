import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { ResponseDto } from '../../../common/dto/response.dto';
import { Auth, UUIDParam } from '../../../decorators';
import {
  ApiPageResponse,
  ApiResponseDto,
} from '../../../decorators/api-response';
import { Role } from '../../role-permission/enums/roles.enum';
import { OrderDto } from '../dtos/order.dto';
import { OperationOrderDeviceRequest } from '../dtos/requests/operation-order-device.request';
import { PaymentOrderRequest } from '../dtos/requests/payment-order.request';
import { PaymentPackageRequest } from '../dtos/requests/payment-package.request';
import {
  CreateOrderRequest,
  UpdateOrderRequest,
} from '../dtos/requests/place-order.request';
import { PaymentOrderResponse } from '../dtos/responses/payment-order.response.dto';
import { OrderService } from '../services/order.service';

@Controller({
  path: 'orders',
  version: '1',
})
@ApiTags('Orders')
export class OrderController extends BaseController {
  constructor(private readonly _orderService: OrderService) {
    super();
  }

  @Post()
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Place order' })
  @ApiResponseDto({ type: OrderDto })
  public async placeOrder(
    @Body() dto: CreateOrderRequest,
  ): Promise<ResponseDto<OrderDto>> {
    const response = await this._orderService.placeOrder(dto);
    return this.getResponse(response !== null, response);
  }

  @Put()
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update order' })
  @ApiResponseDto({ type: OrderDto })
  public async updateOrder(
    @Body() dto: UpdateOrderRequest,
  ): Promise<ResponseDto<OrderDto>> {
    const response = await this._orderService.updateOrder(dto);
    return this.getResponse(response !== null, response);
  }

  @Post('payment')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment order' })
  @ApiResponseDto({ type: PaymentOrderResponse })
  public async paymentOrder(
    @Body() dto: PaymentOrderRequest,
  ): Promise<ResponseDto<PaymentOrderResponse>> {
    const response = await this._orderService.paymentOrder(dto);
    return this.getResponse(response?.result, response);
  }

  @Post('payment/package')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment package' })
  @ApiResponseDto({ type: PaymentOrderResponse })
  public async paymentPackage(
    @Body() dto: PaymentPackageRequest,
  ): Promise<ResponseDto<PaymentOrderResponse>> {
    const response = await this._orderService.paymentPackage(dto);
    return this.getResponse(response?.result, response);
  }

  @Put('payment/cancel/:orderId')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel payment order' })
  @ApiResponseDto({ type: Boolean })
  public async cancelOrder(
    @UUIDParam('orderId') orderId: string,
  ): Promise<ResponseDto<boolean>> {
    const isSuccess = await this._orderService.cancelPayment(orderId);
    return this.getResponse(isSuccess, isSuccess);
  }

  @Get('history')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get orders history' })
  @ApiPageResponse({ type: OrderDto })
  public async getOrdersHistory(
    @Query(new ValidationPipe({ transform: true }))
    query: PaginationRequestDto,
  ): Promise<ResponseDto<PaginationResponseDto<OrderDto>>> {
    const response = await this._orderService.getOrdersHistory(query);
    return this.getResponse(true, response);
  }

  @Get('processing')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get order in processing' })
  @ApiResponseDto({ type: OrderDto })
  public async getOrderProcessing(): Promise<ResponseDto<OrderDto>> {
    const response = await this._orderService.getOrderProcessing();
    return this.getResponse(true, response);
  }

  @Get(':id')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get order detail' })
  @ApiResponseDto({ type: OrderDto })
  public async getOrder(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<OrderDto>> {
    const response = await this._orderService.getOrder(id);
    return this.getResponse(true, response);
  }

  @Post('operation')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Operation order device' })
  @ApiResponseDto({ type: Boolean })
  public async operationOrderDevice(
    @Body() dto: OperationOrderDeviceRequest,
  ): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._orderService.operationOrderDevice(dto);
    return this.getResponse(true, isUpdated);
  }

  @Get('check/:id')
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check order status' })
  @ApiResponseDto({ type: Boolean })
  public async checkOrderStatus(
    @Param('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    const isDone = await this._orderService.checkOrderStatus(id, true);
    return this.getResponse(true, isDone);
  }

  @Get('check-payment/:id')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check order payment status' })
  @ApiResponseDto({ type: Boolean })
  public async checkOrderPayment(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    const isDone = await this._orderService.checkOrderPayment(id);
    return this.getResponse(true, isDone);
  }
}
