import { StringFieldOptional } from '../../../decorators';

export class StationMetadataDto {
  @StringFieldOptional()
  shopId?: string;
}
