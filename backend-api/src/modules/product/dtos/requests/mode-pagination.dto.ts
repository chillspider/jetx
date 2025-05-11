import { PaginationRequestDto } from '../../../../common/dto/pagination-request.dto';
import { UUIDFieldOptional } from '../../../../decorators';

export class ModePaginationRequestDto extends PaginationRequestDto {
  @UUIDFieldOptional()
  productId?: string;
}
