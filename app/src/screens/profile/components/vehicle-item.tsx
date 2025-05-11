/* eslint-disable react-native/no-inline-styles */
import { Text, useTheme } from '@rneui/themed';
import React from 'react';
import { ColorValue } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { Box, Image } from '@/components';
import { VehicleDto } from '@/models/vehicle/vehicle.dto';
import { getPublicMediaUrl } from '@/utils/resources';

type Props = {
	data: VehicleDto;
};

const VehicleItem: React.FC<Props> = ({ data }) => {
	const {
		theme: { colors },
	} = useTheme();

	return (
		<Box backgroundColor={colors.white} p={4} flexDirection="row" borderRadius={12}>
			<Image
				source={{
					uri: getPublicMediaUrl(data.featureImageUrl || ''),
				}}
				style={{ width: 48, height: 48, borderRadius: 8 }}
			/>
			<Box flex={1} ml={8}>
				<Text body2>
					{data.brand || ''} {data.model || ''}
				</Text>
				<Text body2 style={{ color: colors.neutral500, marginTop: 4 }}>
					{data.numberPlate}
				</Text>
			</Box>
			<Box p={4}>
				<IcStar color={data.isDefault ? colors.yellow : colors.neutral200} />
			</Box>
		</Box>
	);
};

export default VehicleItem;

const IcStar = ({ color = '#E0E0E1' }: { color?: ColorValue }) => {
	return (
		<Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M7.86531 13.146C7.69531 13.466 7.36264 13.6666 6.99998 13.6666C6.63731 13.6666 6.30464 13.466 6.13464 13.146L4.49264 10.0493C4.47398 10.0133 4.44664 9.98263 4.41398 9.95863C4.38131 9.93463 4.34331 9.91863 4.30331 9.91196L0.851312 9.30729C0.493979 9.24463 0.201311 8.98996 0.088644 8.64529C-0.0233555 8.30063 0.0639782 7.92196 0.316645 7.66129L2.75398 5.14263C2.78198 5.11329 2.80331 5.07796 2.81598 5.03996C2.82864 5.00129 2.83198 4.96063 2.82664 4.91996L2.33531 1.44996C2.28465 1.09129 2.43598 0.733293 2.72931 0.519959C3.02264 0.306626 3.40931 0.273293 3.73531 0.432626L6.88331 1.97263C6.91931 1.99063 6.95931 1.99996 6.99998 1.99996C7.04064 1.99996 7.08064 1.99063 7.11731 1.97329L10.2653 0.433292C10.5913 0.273958 10.978 0.307959 11.2713 0.520626C11.5646 0.733959 11.716 1.09129 11.6653 1.45063L11.174 4.92063C11.168 4.96063 11.172 5.00196 11.1846 5.04063C11.1973 5.07929 11.218 5.11463 11.2466 5.14329L13.684 7.66196C13.936 7.92263 14.024 8.30129 13.912 8.64596C13.8 8.99063 13.5066 9.24529 13.1493 9.30796L9.69731 9.91263C9.65731 9.91996 9.61931 9.93596 9.58664 9.95929C9.55398 9.98329 9.52664 10.014 9.50798 10.05L7.86531 13.146Z"
				fill={color}
			/>
		</Svg>
	);
};
