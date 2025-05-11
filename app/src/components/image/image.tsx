import React from 'react';
import { DimensionValue } from 'react-native';
import FastImage, { FastImageProps } from 'react-native-fast-image';

type Props = FastImageProps & {
	width?: DimensionValue | undefined;
	height?: DimensionValue | undefined;
};

const Image: React.FC<Props> = ({ source, width, height, style, ...props }) => {
	return (
		<FastImage
			source={source}
			style={[width ? { width } : {}, height ? { height } : {}, style]}
			{...props}
			resizeMode={FastImage.resizeMode.contain}
		/>
	);
};

export default Image;
