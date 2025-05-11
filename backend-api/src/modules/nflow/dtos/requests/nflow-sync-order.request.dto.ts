import { StringFieldOptional } from '../../../../decorators';

export class NflowSyncOrderRequest {
  @StringFieldOptional({ isArray: true, each: true })
  orderIds: string[];
}
