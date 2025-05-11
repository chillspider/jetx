export class PaginationRequestDto {
	pageIndex?: number = 1;

	pageSize?: number = 10;

	order?: string;

	q?: string;

	takeAll?: boolean;

	constructor(data: Partial<PaginationRequestDto> = {}) {
		Object.assign(this, {
			...data,
			pageIndex: data.pageIndex ?? this.pageIndex,
			pageSize: data.pageSize ?? this.pageSize,
		});
	}
}
