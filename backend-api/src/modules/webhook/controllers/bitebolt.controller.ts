import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Version,
} from '@nestjs/common';
import { ApiBasicAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { ResponseDto } from '../../../common/dto/response.dto';
import { AuthBasic } from '../../../decorators';
import { BiteboltWebhookEventDto } from '../../bitebolt/dtos/bitebolt-webhook-event.dto';
import { BiteboltWebhookService } from '../services/bitebolt-webhook.service';

@Controller('webhook/bitebolt')
@ApiTags('Webhook Bitebolt')
@ApiBasicAuth()
export class BiteboltWebhookController extends BaseController {
  constructor(private readonly _bitebolt: BiteboltWebhookService) {
    super();
  }

  @ApiOperation({ summary: 'Handle webhook event' })
  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Post()
  @AuthBasic('bitebolt')
  public async handleBiteboltWebhookEvent(
    @Body() dto: BiteboltWebhookEventDto,
  ): Promise<ResponseDto<boolean>> {
    const isSuccess = await this._bitebolt.handleBiteboltWebhookEvent(dto);
    return this.getResponse(isSuccess !== null, isSuccess);
  }
}
