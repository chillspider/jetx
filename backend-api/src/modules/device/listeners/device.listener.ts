import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { EVENT } from '../../../constants';
import { DeviceService } from '../services/device.service';

@Injectable()
export class DeviceListener {
  constructor(private readonly _deviceService: DeviceService) {}

  @OnEvent(EVENT.DEVICE.GENERATE_QR)
  handleGenerateQrEvent(id: string) {
    return this._deviceService.generateQRById(id);
  }
}
