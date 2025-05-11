import {
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../../../decorators';

export class BBGetPublicProducts {
  @StringFieldOptional()
  categoryId?: string;

  @StringFieldOptional()
  filter?: string;

  @StringField()
  shopId: string;

  @NumberFieldOptional()
  fromPrice?: number;

  @NumberFieldOptional()
  toPrice?: number;
}
