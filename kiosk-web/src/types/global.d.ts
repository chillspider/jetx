type ApiError = {
	code: string;
	message: string;
};

type ApiResponse<T> = {
	data: T;
	isSuccess: boolean;
	errors: string[];
};
