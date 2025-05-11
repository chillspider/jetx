import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

const useLayout = () => {
	const init = Dimensions.get('screen');
	const [dimensions, setDimensions] = useState({
		...init,
		portrait: init.height > init.width,
	});

	useEffect((): ReturnType<any> => {
		const subscription = Dimensions.addEventListener('change', event => {
			const { height } = event.window;
			const { width } = event.window;
			setDimensions({
				...event.window,
				portrait: height > width,
			});
		});
		return () => subscription?.remove();
	}, []);

	return dimensions;
};

export default useLayout;
