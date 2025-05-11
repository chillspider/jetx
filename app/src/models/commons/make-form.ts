/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */

export const makeFormData = (params: Record<string, any>) => {
	const formData = new FormData();
	for (const prop in params) {
		if (params[prop] == null) {
			// this will skip both null and undefined
			continue;
		}
		if (Array.isArray(params[prop])) {
			params[prop].forEach((value: any) => {
				formData.append(prop, value);
			});
		} else {
			formData.append(prop, params[prop]);
		}
	}
	return formData;
};
