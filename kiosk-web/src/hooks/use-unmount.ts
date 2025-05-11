/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { useLatest } from "./use-latest";

export function useUnmount(fn: () => void) {
	if (typeof fn !== "function") {
		console.error(
			`useUnmount expected parameter is a function, got ${typeof fn}`
		);
	}

	const fnRef = useLatest(fn);

	useEffect(() => {
		return () => {
			fnRef.current();
		};
	}, [fnRef]);
}
