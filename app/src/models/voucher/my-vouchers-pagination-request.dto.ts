import { PaginationRequestDto } from '../commons/pagination-request.dto';

export class MyVouchersPaginationRequestDto extends PaginationRequestDto {
	readonly orderValue?: number;

	readonly isShowExpiredVouchers?: boolean;
}
