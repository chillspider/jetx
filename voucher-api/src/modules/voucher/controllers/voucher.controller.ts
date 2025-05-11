import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { MyVouchersPaginationRequestDto } from '../../../common/dto/my-vouchers-pagination-request.dto';
import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { ResponseDto } from '../../../common/dto/response.dto';
import { Auth, UUIDParam } from '../../../decorators';
import { ApiResponseDto } from '../../../decorators/api-response';
import { SignatureGuard } from '../../../guards/signature.guard';
import { Role } from '../../role-permission/enums/roles.enum';
import {
  BulkCreateVoucherRequest,
  CreateVoucherDto,
} from '../dtos/requests/create-voucher.dto';
import { RollbackVoucherDto } from '../dtos/requests/rollback-voucher.dto';
import { UseVoucherDto } from '../dtos/requests/use-voucher.dto';
import { VoucherDto } from '../dtos/voucher.dto';
import { VoucherService } from '../services/voucher.service';

@Controller({
  path: 'vouchers',
  version: '1',
})
@ApiTags('vouchers')
export class VoucherController extends BaseController {
  constructor(private _voucherService: VoucherService) {
    super();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new voucher' })
  @HttpCode(HttpStatus.OK)
  @ApiResponseDto({ type: VoucherDto })
  @UseGuards(SignatureGuard)
  async createVoucher(
    @Body() request: CreateVoucherDto,
  ): Promise<ResponseDto<VoucherDto>> {
    const result = await this._voucherService.createByApp(request);
    return this.getResponse(true, result);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create bulk voucher' })
  @HttpCode(HttpStatus.OK)
  @ApiResponseDto({ type: Array<VoucherDto> })
  @UseGuards(SignatureGuard)
  async createBulkVoucher(
    @Body() request: BulkCreateVoucherRequest,
  ): Promise<ResponseDto<VoucherDto[]>> {
    const result = await this._voucherService.createBulkByApp(request.vouchers);
    return this.getResponse(true, result);
  }

  @Get()
  @Auth({ roles: [Role.SA] })
  @ApiOperation({ summary: 'Get vouchers' })
  @HttpCode(HttpStatus.OK)
  @ApiResponseDto({
    description: 'Get vouchers',
    type: VoucherDto,
  })
  async getVouchers(
    @Query(new ValidationPipe({ transform: true }))
    query: PaginationRequestDto,
  ): Promise<ResponseDto<PaginationResponseDto<VoucherDto>>> {
    const result: PaginationResponseDto<VoucherDto> =
      await this._voucherService.getVouchers(query);
    return this.getResponse(true, result);
  }

  @Get('me')
  @Auth()
  @ApiOperation({ summary: 'Get my vouchers' })
  @HttpCode(HttpStatus.OK)
  @ApiResponseDto({
    description: 'Get my vouchers',
    type: VoucherDto,
  })
  async getMyVouchers(
    @Query(new ValidationPipe({ transform: true }))
    query: MyVouchersPaginationRequestDto,
  ): Promise<ResponseDto<PaginationResponseDto<VoucherDto>>> {
    const result: PaginationResponseDto<VoucherDto> =
      await this._voucherService.getMyVouchers(query);
    return this.getResponse(true, result);
  }

  @Put('me/use/:voucherId')
  @Auth()
  @ApiOperation({ summary: 'Use my voucher' })
  @HttpCode(HttpStatus.OK)
  @ApiResponseDto({
    description: 'Use my voucher',
    type: Boolean,
  })
  async useVoucher(
    @UUIDParam('voucherId') voucherId: string,
    @Body() req: UseVoucherDto,
  ): Promise<ResponseDto<boolean>> {
    const isApplied: boolean = await this._voucherService.useMyVoucher(
      voucherId,
      req,
    );
    return this.getResponse(true, isApplied);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Get voucher detail' })
  @HttpCode(HttpStatus.OK)
  @ApiResponseDto({
    description: 'Get voucher detail',
    type: VoucherDto,
  })
  async getVoucher(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<VoucherDto>> {
    const result: VoucherDto = await this._voucherService.findOne({ id });
    return this.getResponse(true, result);
  }

  @Post('rollback')
  @ApiOperation({ summary: 'Rollback used voucher' })
  @HttpCode(HttpStatus.OK)
  @ApiResponseDto({ type: Boolean })
  @UseGuards(SignatureGuard)
  async rollbackVoucher(
    @Body() dto: RollbackVoucherDto,
  ): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._voucherService.rollbackVoucher(dto.id);
    return this.getResponse(true, isUpdated);
  }
}
