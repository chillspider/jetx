import { useState, useMemo } from "react";

export interface Actions<T> {
	setLeft: () => void;
	setRight: () => void;
	set: (value: T) => void;
	toggle: () => void;
}

export function useToggle<T = boolean>(): [boolean, Actions<T>];

export function useToggle<T>(defaultValue: T): [T, Actions<T>];

export function useToggle<T, U>(
	defaultValue: T,
	reverseValue: U
): [T | U, Actions<T | U>];

export function useToggle<D, R>(
	defaultValue: D = false as unknown as D,
	reverseValue?: R
) {
	const [state, setState] = useState<D | R>(defaultValue);

	const actions = useMemo(() => {
		const reverseValueOrigin = (
			reverseValue === undefined ? !defaultValue : reverseValue
		) as D | R;

		const toggle = () =>
			setState((s) => (s === defaultValue ? reverseValueOrigin : defaultValue));
		const set = (value: D | R) => setState(value);
		const setLeft = () => setState(defaultValue);
		const setRight = () => setState(reverseValueOrigin);

		return {
			toggle,
			set,
			setLeft,
			setRight,
		};
	}, [defaultValue, reverseValue]);

	return [state, actions];
}
