import { StringField } from '../../../decorators';

export class CarModelDto {
  @StringField()
  carType: string;

  @StringField()
  color: string;

  @StringField()
  brand: string;

  @StringField()
  plateNumber: string;
}
