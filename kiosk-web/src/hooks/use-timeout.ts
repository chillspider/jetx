import { useEffect, useRef, useCallback } from "react";
import { useLatest } from "./use-latest";
import { isNumber } from "@/libs/helpers";

export function useTimeout(fn: () => void, delay: number | undefined) {
	const fnRef = useLatest(fn);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!isNumber(delay) || delay < 0) {
			return;
		}

		timerRef.current = setTimeout(() => {
			fnRef.current();
		}, delay);

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [delay]);

	const clear = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
		}
	}, []);

	return clear;
}
