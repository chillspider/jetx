import { AutoMap } from '@automapper/classes';

import { EnumField, StringField } from '../../../decorators';
import { ActionActivityEnum } from '../enums/action-activity.enum';

export class ActivityLogDto {
  @StringField()
  @AutoMap()
  objectId: string;

  @EnumField(() => ActionActivityEnum)
  @AutoMap()
  action: ActionActivityEnum | string;

  @AutoMap()
  value?: Record<any, any>;
}
