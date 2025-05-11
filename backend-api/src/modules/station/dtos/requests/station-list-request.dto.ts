import { PaginationRequestDto } from '../../../../common/dto/pagination-request.dto';
import { NumberFieldOptional } from '../../../../decorators';

export class StationListRequestDto extends PaginationRequestDto {
  @NumberFieldOptional()
  latitude?: number;

  @NumberFieldOptional()
  longitude?: number;
}
