import { AutoMap } from '@automapper/classes';

import { SyncActionEnum } from '../../../constants/action';
import {
  BooleanField,
  ClassField,
  DateFieldOptional,
  EnumField,
  StringField,
} from '../../../decorators';
import { SyncTypeEnum } from '../enums/sync-action.enum';

export class SyncLogDto {
  @StringField()
  @AutoMap()
  objectId: string;

  @EnumField(() => SyncTypeEnum)
  @AutoMap()
  type: SyncTypeEnum;

  @EnumField(() => SyncActionEnum)
  @AutoMap()
  action: SyncActionEnum;

  @ClassField(() => Object)
  @AutoMap()
  value: Record<any, any>;

  @BooleanField()
  @AutoMap()
  synced: boolean;

  @DateFieldOptional()
  @AutoMap()
  syncedAt?: Date;
}
