import { useCallback, useEffect, useRef } from "react";
import { useLatest } from "./use-latest";
import { isNumber } from "@/libs/helpers";

export function useInterval(
	fn: () => void,
	delay?: number,
	options: {
		immediate?: boolean;
	} = {}
) {
	const { immediate } = options;

	const fnRef = useLatest(fn);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (!isNumber(delay) || delay < 0) {
			return;
		}

		if (immediate) {
			fnRef.current();
		}

		timerRef.current = setInterval(() => {
			fnRef.current();
		}, delay);

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [delay]);

	const clear = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
		}
	}, []);

	return clear;
}
