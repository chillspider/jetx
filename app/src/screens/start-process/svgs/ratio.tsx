import { useTheme } from '@rneui/themed';
import { Circle, Svg } from 'react-native-svg';

import IcSelected from '@/assets/svgs/ratio-selected.svg';

export const Ratio = () => {
	const {
		theme: { colors },
	} = useTheme();

	return (
		<Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
			<Circle cx="8" cy="8" r="7.5" fill="white" stroke={colors.neutral300} />
		</Svg>
	);
};

export const RatioSelected = () => {
	return <IcSelected />;
};
