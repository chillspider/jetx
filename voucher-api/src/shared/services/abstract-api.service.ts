import { Inject, Injectable } from '@nestjs/common';

import { BaseHttpService } from './http.service';

@Injectable()
export abstract class AbstractAPIService {
  @Inject(BaseHttpService)
  protected http: BaseHttpService;

  protected abstract getBaseUrl(): string;

  protected makeUrl(path: string): string {
    return `${this.getBaseUrl()}${path}`;
  }
}
