import {
  Body,
  Controller,
  Delete,
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
import { PaginationRequestDto } from '../../../common/dto/pagination-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination-response.dto';
import { ResponseDto } from '../../../common/dto/response.dto';
import { Auth, UUIDParam } from '../../../decorators';
import {
  ApiPageResponse,
  ApiResponseDto,
} from '../../../decorators/api-response';
import { SignatureGuard } from '../../../guards/signature.guard';
import { Role } from '../../role-permission/enums/roles.enum';
import { InvoiceDto } from '../dtos/invoice.dto';
import { InvoiceProviderDto } from '../dtos/invoice-provider.dto';
import { InvoiceProviderRequestDto } from '../dtos/requests/invoice-provider.request.dto';
import { CreateB2bInvoiceRequestDto } from '../dtos/requests/issue-b2b-invoice.request.dto';
import { InvoiceService } from '../services/invoice.service';
import { InvoiceProviderService } from '../services/invoice-provider.service';

@Controller({
  path: 'invoices',
  version: '1',
})
@ApiTags('Invoices')
export class InvoiceController extends BaseController {
  constructor(
    private _invoiceProviderService: InvoiceProviderService,
    private _invoiceService: InvoiceService,
  ) {
    super();
  }

  @Get('providers')
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get invoice providers' })
  @ApiPageResponse({ type: InvoiceProviderDto })
  async getInvoiceProviders(
    @Query(new ValidationPipe({ transform: true }))
    query: PaginationRequestDto,
  ): Promise<ResponseDto<PaginationResponseDto<InvoiceProviderDto>>> {
    const result = await this._invoiceProviderService.getList(query);
    return this.getResponse(true, result);
  }

  @Get('providers/:id')
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get invoice provider detail' })
  @ApiResponseDto({ type: InvoiceProviderDto })
  async getInvoiceProvider(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<InvoiceProviderDto>> {
    const result = await this._invoiceProviderService.getDetail(id);
    return this.getResponse(true, result);
  }

  @Post('providers')
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a invoice provider' })
  @ApiResponseDto({ type: InvoiceProviderDto })
  async createInvoiceProvider(
    @Body() dto: InvoiceProviderRequestDto,
  ): Promise<ResponseDto<InvoiceProviderDto>> {
    const result = await this._invoiceProviderService.create(dto);
    return this.getResponse(true, result);
  }

  @Put('providers')
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update invoice provider' })
  @ApiResponseDto({ type: Boolean })
  async updateInvoiceProvider(
    @Body() dto: InvoiceProviderRequestDto,
  ): Promise<ResponseDto<InvoiceProviderDto>> {
    const isUpdated = await this._invoiceProviderService.update(dto);
    return this.getResponse(true, isUpdated);
  }

  @Delete('providers/:id')
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete invoice provider' })
  @ApiResponseDto({ type: Boolean })
  async deleteInvoiceProvider(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    const isDeleted = await this._invoiceProviderService.delete(id);
    return this.getResponse(true, isDeleted);
  }

  @Post('providers/connection/:id')
  @Auth({ roles: [Role.SA] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test connection of invoice provider' })
  @ApiResponseDto({ type: Boolean })
  async testConnectionInvoiceProvider(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    const canConnect = await this._invoiceProviderService.testConnection(id);
    return this.getResponse(true, canConnect);
  }

  @Post('b2b/issue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue a b2b invoice' })
  @ApiResponseDto({ type: InvoiceDto })
  @UseGuards(SignatureGuard)
  async issueB2bInvoice(
    @Body() dto: CreateB2bInvoiceRequestDto,
  ): Promise<ResponseDto<InvoiceDto>> {
    const result = await this._invoiceService.issueB2bInvoice(dto);
    return this.getResponse(true, result);
  }
}
