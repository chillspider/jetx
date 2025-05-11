import { AutoMap } from '@automapper/classes';

import { TranslationDto } from '../../../common/dto/translation.dto';
import {
  StringField,
  StringFieldOptional,
  UUIDField,
} from '../../../decorators';

export class AttentionDto {
  @UUIDField()
  @AutoMap()
  id!: string;

  @StringField()
  @AutoMap()
  name!: string;

  @StringFieldOptional()
  @AutoMap()
  featureImageUrl?: string;

  @AutoMap(() => TranslationDto)
  translations?: TranslationDto;
}
