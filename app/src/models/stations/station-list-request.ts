import { PaginationRequestDto } from '../commons/pagination-request.dto';

export class StationListRequestDto extends PaginationRequestDto {
	latitude?: number;

	longitude?: number;
}
