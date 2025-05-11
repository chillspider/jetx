export class ResponseDto<T> {
	data: T;

	isSuccess: boolean;

	errors: string[];

	constructor(data: T, isSuccess = true, errors: string[] = []) {
		this.data = data;
		this.isSuccess = isSuccess;
		this.errors = errors;
	}
}
