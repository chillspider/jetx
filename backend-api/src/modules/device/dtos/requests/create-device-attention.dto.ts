import { AutoMap } from '@automapper/classes';

import { StringField, StringFieldOptional } from '../../../../decorators';

export class CreateDeviceAttentionDto {
  @StringField()
  @AutoMap()
  attentionId: string;
}

export class UpdateDeviceAttentionDto extends CreateDeviceAttentionDto {
  @StringFieldOptional()
  @AutoMap()
  id?: string;
}
