import { AutoMap } from '@automapper/classes';

import { StringField } from '../../../../decorators';

export class UpdateUserNoteDto {
  @StringField()
  @AutoMap()
  id: string;

  @StringField()
  @AutoMap()
  note: string;
}
