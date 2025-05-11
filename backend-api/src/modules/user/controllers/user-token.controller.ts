import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { PaymentOrderResponse } from '../../order/dtos/responses/payment-order.response.dto';
import { OrderService } from '../../order/services/order.service';
import { UserTokenDto } from '../dtos/user-token.dto';
import { UserTokenService } from '../services/user-token.service';

@Controller({
  path: 'card-tokens',
  version: '1',
})
@ApiTags('Card tokens')
export class UserTokenController extends BaseController {
  constructor(
    private readonly _userTokenService: UserTokenService,
    private readonly _orderService: OrderService,
  ) {
    super();
  }

  @Get()
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get my tokens list' })
  @ApiPageResponse({ type: UserTokenDto })
  async getUserTokens(
    @Query(new ValidationPipe({ transform: true }))
    query: PaginationRequestDto,
  ): Promise<ResponseDto<PaginationResponseDto<UserTokenDto>>> {
    const result = await this._userTokenService.getUserTokens(query);
    return this.getResponse(true, result);
  }

  @Post()
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create card token' })
  @ApiResponseDto({ type: PaymentOrderResponse })
  async createCardToken(): Promise<ResponseDto<PaymentOrderResponse>> {
    const result = await this._orderService.createTokenize();
    return this.getResponse(true, result);
  }

  @Delete(':id')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete card token' })
  @ApiResponseDto({ type: Boolean })
  async deleteToken(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    const isDeleted = await this._userTokenService.delete(id);
    return this.getResponse(true, isDeleted);
  }

  @Put('default/:id')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set default card token' })
  @ApiResponseDto({ type: Boolean })
  async setDefaultToken(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._userTokenService.setDefaultToken(id);
    return this.getResponse(true, isUpdated);
  }
}
