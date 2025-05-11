import { AutoMap } from '@automapper/classes';

import {
  EnumField,
  StringField,
  StringFieldOptional,
} from '../../../decorators';
import { SettingKey } from '../enums/setting-key.enum';
import { SettingType } from '../enums/setting-type.enum';

export class SettingDto {
  @EnumField(() => SettingKey)
  @AutoMap()
  key: SettingKey;

  @StringField()
  @AutoMap()
  value: string;

  @EnumField(() => SettingType)
  @AutoMap()
  type: SettingType;

  @StringFieldOptional()
  @AutoMap()
  group?: string;
}
