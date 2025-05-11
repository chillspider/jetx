import { SyncActionEnum } from '../../../../constants/action';

export class SyncRequestDto {
  action: SyncActionEnum;
  id: string;
}
