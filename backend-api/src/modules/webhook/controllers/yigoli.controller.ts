import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/controllers/base.controller';
import { DataBeanDto } from '../../yigoli/dtos/ygl-data-bean.dto';
import { IYglResponse } from '../../yigoli/interfaces/ygl-response.interface';
import { YigoliWebhookService } from '../services/yigoli-webhook.service';

@Controller('notify/lkmxc/order')
@ApiTags('Yigoli Webhook')
export class YigoliWebhookController extends BaseController {
  constructor(private readonly _webhookService: YigoliWebhookService) {
    super();
  }

  @ApiOperation({ summary: 'Handle yigoli webhook event' })
  @HttpCode(HttpStatus.OK)
  @Post()
  public async handleYigoliWebhookEvent(
    @Body() data: DataBeanDto,
  ): Promise<IYglResponse> {
    return await this._webhookService.handleYigoliWebhookRes(data);
  }
}
