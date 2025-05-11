import { ClassField, StringField } from '../../../../decorators';
import { CarModelDto } from '../car-model.dto';

export class CreateCarDetectorDto {
  @StringField()
  orderId: string;

  @StringField()
  deviceId: string;

  @StringField()
  customerId: string;

  @ClassField(() => CarModelDto)
  car: CarModelDto;
}

export class AnalyzeCarFromUrlDto {
  @StringField()
  imageUrl: string;
}
