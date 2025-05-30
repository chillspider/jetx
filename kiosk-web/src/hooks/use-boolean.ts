import { useMemo } from "react";
import { useToggle } from "./use-toggle";

export interface Actions {
	setTrue: () => void;
	setFalse: () => void;
	set: (value: boolean) => void;
	toggle: () => void;
}

export function useBoolean(defaultValue = false): [boolean, Actions] {
	const [state, { toggle, set }] = useToggle(defaultValue);

	const actions: Actions = useMemo(() => {
		const setTrue = () => set(true);
		const setFalse = () => set(false);

		return {
			toggle,
			set: (v) => set(!!v),
			setTrue,
			setFalse,
		};
	}, [set, toggle]);

	return [state, actions];
}
