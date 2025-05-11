import { NumberFieldOptional } from '../../../../decorators';

export class StationDetailRequestDto {
  @NumberFieldOptional()
  latitude?: number;

  @NumberFieldOptional()
  longitude?: number;
}
