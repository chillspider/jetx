import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { ResponseDto } from '../../../common/dto/response.dto';
import { Auth, UUIDParam } from '../../../decorators';
import { ApiResponseDto } from '../../../decorators/api-response';
import { Role } from '../../role-permission/enums/roles.enum';
import { AddVoucherValidityRequestDto } from '../dtos/requests/add-voucher-validity.request.dto';
import { SyncService } from '../services/sync.service';

@Controller({
  path: 'syncs',
  version: '1',
})
@ApiTags('Syncs')
@Auth({ roles: [Role.SA] })
export class SyncController extends BaseController {
  constructor(private readonly _syncService: SyncService) {
    super();
  }

  @Post('voucher-validity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add validity for vouchers' })
  @ApiResponseDto({ type: Boolean })
  public async addValidityVoucher(
    @Body() body: AddVoucherValidityRequestDto,
  ): Promise<ResponseDto<boolean>> {
    await this._syncService.addValidityVoucher({
      checkValidity: body.checkValidity,
    });
    return this.getResponse(true, true);
  }

  @Post('vouchers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync voucher' })
  @ApiResponseDto({ type: Boolean })
  public async syncVoucher(): Promise<ResponseDto<boolean>> {
    await this._syncService.syncVoucher();
    return this.getResponse(true, true);
  }

  @Post('vouchers/migrate-metadata')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Migrate voucher metadata' })
  @ApiResponseDto({ type: Boolean })
  public async migrateVoucherMetadata(): Promise<ResponseDto<boolean>> {
    await this._syncService.migrateVoucherMetadata();
    return this.getResponse(true, true);
  }

  @Post('vouchers/migrate-exclusion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Migrate voucher exclusion' })
  @ApiResponseDto({ type: Boolean })
  public async migrateVoucherExclusion(): Promise<ResponseDto<boolean>> {
    await this._syncService.migrateVoucherExclusion();
    return this.getResponse(true, true);
  }

  @Post('vouchers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync voucher by id' })
  @ApiResponseDto({ type: Boolean })
  public async syncVoucherById(
    @UUIDParam('id') id: string,
  ): Promise<ResponseDto<boolean>> {
    await this._syncService.syncVoucherById(id);
    return this.getResponse(true, true);
  }
}
