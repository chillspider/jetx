import { useWindowDimensions } from 'react-native';

const useHomeDimensions = () => {
	const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

	const SEARCH_HANDLE_HEIGHT = SCREEN_HEIGHT / 4 < 200 ? 200 : SCREEN_HEIGHT / 4;
	const LOCATION_DETAILS_HEIGHT = (SCREEN_HEIGHT / 3) * 2;
	const MAX_ADDRESS_WIDTH = (SCREEN_WIDTH / 3) * 2;

	return {
		SCREEN_WIDTH,
		SCREEN_HEIGHT,
		SEARCH_HANDLE_HEIGHT,
		LOCATION_DETAILS_HEIGHT,
		MAX_ADDRESS_WIDTH,
	};
};

export default useHomeDimensions;
