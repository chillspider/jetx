import { AutoMap } from '@automapper/classes';

import { StringField } from '../../../../decorators';

export class CreateAttentionDto {
  @StringField()
  @AutoMap()
  name: string;

  @StringField()
  @AutoMap()
  featureImageUrl: string;
}

export class UpdateAttentionDto extends CreateAttentionDto {
  @StringField()
  @AutoMap()
  id!: string;
}
