/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSafeActionClient, SafeActionResult } from "next-safe-action";
import { z } from "zod";

const UNKNOWN_ERROR = "unknown";

export class ActionError extends Error {}

export class APIError extends Error {
	constructor(public response: { data: { message: string; code: string } }) {
		super(response.data.message);
	}
}

export const isAPIError = (error: any): error is APIError => {
	if (!error?.response) return false;
	if (error.response.status >= 500) return false;

	const data = error.response.data;
	const response = data?.response;

	const hasErrorProps = (obj: any) =>
		obj && typeof obj === "object" && "message" in obj && "code" in obj;

	return hasErrorProps(data) || hasErrorProps(response);
};

export const actionClient = createSafeActionClient({
	handleServerError: (error) => {
		if (error instanceof ActionError) {
			return error.message;
		}

		if (isAPIError(error)) {
			return error.response.data.message;
		}

		return UNKNOWN_ERROR;
	},
});

/**
 * Determines if a server action is successful or not
 * A server action is successful if it has a data property and no serverError property
 *
 * @param action Return value of a server action
 * @returns A boolean indicating if the action is successful
 */
export const isActionSuccessful = <T extends z.ZodType>(
	action?: SafeActionResult<string, T, readonly [], any, any>
): action is {
	data: T;
	serverError: undefined;
	validationError: undefined;
} => {
	if (!action) {
		return false;
	}

	if (action.serverError) {
		return false;
	}

	if (action.validationErrors) {
		return false;
	}

	return true;
};

/**
 * Convert an action result to a promise that resolves to false
 *
 * @param action Return value of a server action
 * @returns A promise that resolves to false
 */
export const resolveActionResult = async <T extends z.ZodType>(
	action: Promise<
		SafeActionResult<string, T, readonly [], any, any> | undefined
	>
): Promise<T> => {
	return new Promise((resolve, reject) => {
		action
			.then((result) => {
				if (isActionSuccessful(result)) {
					resolve(result.data);
				} else {
					reject(result?.serverError ?? UNKNOWN_ERROR);
				}
			})
			.catch((error) => {
				reject(error);
			});
	});
};

export const resolveErrorMessage = (error: any, defaultMessage?: string) => {
	let msg = UNKNOWN_ERROR;

	if (typeof error === "string") {
		msg = error;
	} else if (isAPIError(error)) {
		msg = error.response.data.message;
	} else if (error?.message && typeof error.message === "string") {
		msg = error.message;
	} else if (error?.serverError && typeof error.serverError === "string") {
		msg = error.serverError;
	}

	return !!msg && msg !== UNKNOWN_ERROR ? msg : defaultMessage || UNKNOWN_ERROR;
};
