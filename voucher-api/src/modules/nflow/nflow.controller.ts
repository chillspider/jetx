import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../common/controllers/base.controller';
import { ResponseDto } from '../../common/dto/response.dto';
import { Auth, UUIDParam } from '../../decorators';
import { ApiResponseDto } from '../../decorators/api-response';
import { B2bVoucherDto } from '../b2b-voucher/dtos/b2b-voucher.dto';
import { CreateB2bVoucherDto } from '../b2b-voucher/dtos/requests/create-b2b-voucher.dto';
import { UpdateB2bVoucherDto } from '../b2b-voucher/dtos/requests/update-b2b-voucher.dto';
import { B2bVoucherService } from '../b2b-voucher/services/b2b-voucher.service';
import { Role } from '../role-permission/enums/roles.enum';
import {
  BulkCreateVoucherRequest,
  CreateVoucherDto,
} from '../voucher/dtos/requests/create-voucher.dto';
import { UpdateVoucherDto } from '../voucher/dtos/requests/update-voucher.dto';
import { VoucherDto } from '../voucher/dtos/voucher.dto';
import { VoucherIssueTypeEnum } from '../voucher/enums/vouchers.enum';
import { VoucherService } from '../voucher/services/voucher.service';

@Controller({
  path: 'nflow',
  version: '1',
})
@ApiTags('Nflow')
@Auth({ roles: [Role.SA, Role.ADMIN] })
export class NflowController extends BaseController {
  constructor(
    private readonly _voucherService: VoucherService,
    private readonly _b2bVoucherService: B2bVoucherService,
  ) {
    super();
  }

  @Post('vouchers')
  @ApiOperation({ summary: 'Create a new voucher' })
  @HttpCode(HttpStatus.OK)
  @ApiResponseDto({ type: VoucherDto })
  async createVoucher(
    @Body() request: CreateVoucherDto,
  ): Promise<ResponseDto<VoucherDto>> {
    request.issueType = VoucherIssueTypeEnum.NFLOW;

    const result = await this._voucherService.create(request);
    return this.getResponse(true, result);
  }

  @Post('vouchers/bulk')
  @ApiOperation({ summary: 'Create bulk voucher' })
  @HttpCode(HttpStatus.OK)
  @ApiResponseDto({ type: Array<VoucherDto> })
  async createBulkVoucher(
    @Body() request: BulkCreateVoucherRequest,
  ): Promise<ResponseDto<VoucherDto[]>> {
    const vouchers = request?.vouchers?.map((voucher) => {
      voucher.issueType = VoucherIssueTypeEnum.NFLOW;
      return voucher;
    });

    const result = await this._voucherService.createBulk(vouchers);
    return this.getResponse(true, result);
  }

  @Put('vouchers')
  @ApiOperation({ summary: 'Update a voucher' })
  @HttpCode(HttpStatus.OK)
  @ApiResponseDto({ type: Boolean })
  async updateVoucher(
    @Body() request: UpdateVoucherDto,
  ): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._voucherService.update(request);
    return this.getResponse(true, isUpdated);
  }

  @Delete('vouchers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete voucher' })
  @ApiResponseDto({ type: Boolean })
  async deleteVoucher(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    const isDeleted = await this._voucherService.delete(id);
    return this.getResponse(true, isDeleted);
  }

  @Post('b2b-vouchers')
  @ApiOperation({ summary: 'Create a new b2b voucher' })
  @HttpCode(HttpStatus.OK)
  @ApiResponseDto({ type: B2bVoucherDto })
  async createB2bVoucher(
    @Body() request: CreateB2bVoucherDto,
  ): Promise<ResponseDto<B2bVoucherDto>> {
    const result = await this._b2bVoucherService.create(request);
    return this.getResponse(true, result);
  }

  @Put('b2b-vouchers/:id')
  @ApiOperation({ summary: 'Update a b2b voucher' })
  @HttpCode(HttpStatus.OK)
  @ApiResponseDto({ type: B2bVoucherDto })
  async updateB2bVoucher(
    @UUIDParam('id') id: string,
    @Body() request: UpdateB2bVoucherDto,
  ): Promise<ResponseDto<boolean>> {
    const isUpdated = await this._b2bVoucherService.update(id, request);
    return this.getResponse(true, isUpdated);
  }

  @Put('b2b-vouchers/recall/:id')
  @ApiOperation({ summary: 'Recall a b2b voucher code' })
  @HttpCode(HttpStatus.OK)
  @ApiResponseDto({ type: Boolean })
  async recallB2bVoucher(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    const isRecalled = await this._b2bVoucherService.recallCode(id);
    return this.getResponse(true, isRecalled);
  }

  @Put('b2b-vouchers/issue-invoice/:id')
  @ApiOperation({ summary: 'Issue invoice for a b2b voucher' })
  @HttpCode(HttpStatus.OK)
  @ApiResponseDto({ type: Boolean })
  async issueInvoice(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    const isIssued = await this._b2bVoucherService.issueInvoice(id);
    return this.getResponse(true, isIssued);
  }
}
