import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Version,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import * as crypto from 'crypto';

import { BaseController } from '../../../common/controllers/base.controller';
import { W24Error } from '../../../constants/error-code';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import { GPayQRResCode } from '../../payment/dtos/gpay/gpay-qr-response';
import { IEventGPay, IEventPayResponse } from '../dtos/gpay.dto';
import { IDataEventGPayQR, IEventGPayQRResponse } from '../dtos/gpay-qr.dto';
import { PaymentWebhookService } from '../services/payment-webhook.service';

@Controller('webhook/gpay')
@ApiTags('GPay Webhook')
export class GPayWebhookController extends BaseController {
  constructor(
    private readonly _webhookService: PaymentWebhookService,
    private readonly _appConfig: ApiConfigService,
  ) {
    super();
  }

  @ApiOperation({ summary: 'Handle webhook event' })
  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Post()
  public async handleGPayWebhookEvent(
    @Body() dto: IEventGPay,
  ): Promise<IEventPayResponse> {
    console.log(dto);
    const { saltKey } = this._appConfig.gpay;
    const validateSign = await this.verifySignature(dto.data, saltKey);
    if (validateSign == dto.signature) {
      const decodeData = JSON.parse(atob(dto.data));
      console.log(decodeData);

      this._webhookService.handleGPayWebhookEvent(decodeData);

      return {
        ipnStatus: decodeData?.responseCode,
        ipnDescription: decodeData?.responseMessage,
      };
    }

    throw new BadRequestException(W24Error.InvalidSignature);
  }

  @ApiOperation({ summary: 'Handle QR webhook event' })
  @HttpCode(HttpStatus.OK)
  @Version('1')
  @Post('qr')
  public async handleGPayQRWebhookEvent(
    @Body() dto: IDataEventGPayQR,
    @Req() req: any,
  ): Promise<IEventGPayQRResponse> {
    const signature = req?.headers?.['signature'];
    const saltKey = this._appConfig.gpayQR.saltKey;

    if (!signature) {
      throw new BadRequestException(W24Error.InvalidSignature);
    }

    console.log(signature);
    console.log(dto);

    const validateSign = await this.verifySignature(
      JSON.stringify(dto),
      saltKey,
    );
    if (validateSign === signature) {
      this._webhookService.handleGPayQRWebhookEvent(dto, {
        requestId: req?.headers?.['x-request-id'],
        signature: signature,
      });

      return {
        resCode: GPayQRResCode.SUCCESS,
        resMessage: '',
      };
    }

    throw new BadRequestException(W24Error.InvalidSignature);
  }

  private async verifySignature(data: string, salt: string) {
    // Combine data and salt
    const combinedData = Buffer.concat([Buffer.from(data), Buffer.from(salt)]);

    // Create a SHA256 hash
    const hash = crypto.createHash('sha256');
    hash.update(combinedData);

    // Digest the hash into a hex string
    const signature = hash.digest('hex');

    return signature;
  }
}
