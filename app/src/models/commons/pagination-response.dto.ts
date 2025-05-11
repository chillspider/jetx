export class PaginationResponseDto<T> {
	data?: T[];

	total?: number;

	pageSize?: number;

	pageIndex?: number;

	pageCount?: number;

	hasPreviousPage?: boolean;

	hasNextPage?: boolean;
}
