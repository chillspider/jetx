import { SyncActionEnum } from '../../../constants/action';
import { SyncTypeEnum } from '../enums/sync-action.enum';

export class SyncPayloadDto<T> {
  type: SyncTypeEnum;
  action: SyncActionEnum;
  data: T;
  nflowId?: string;
}
