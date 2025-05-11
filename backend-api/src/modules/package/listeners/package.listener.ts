import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { EVENT } from '../../../constants';
import { PackageService } from '../services/package.service';

@Injectable()
export class PackageListener {
  constructor(private readonly _pkgService: PackageService) {}

  @OnEvent(EVENT.PACKAGE.PROCESS)
  async handleProcessPackage(orderId: string): Promise<void> {
    await this._pkgService.processPackageOrder(orderId);
  }
}
