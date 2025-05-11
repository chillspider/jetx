export enum WashMode {
	QUICK = 333,
	STANDARD = 329,
	PREMIUM = 330,
}

export function getWashMode(code?: string): WashMode | undefined {
	if (code) {
		const numericValue = Number(code);

		if (
			!Number.isNaN(numericValue) &&
			(Object.values(WashMode) as number[]).includes(numericValue)
		) {
			return numericValue as WashMode;
		}
	}

	return undefined;
}
