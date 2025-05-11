/* eslint-disable react-native/no-inline-styles */
import { Text } from '@rneui/themed';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@/components';

import { TagColor } from './utils';

type Props = {
	tag: string;
	color: TagColor;
};

const StationTagView: React.FC<Props> = ({ tag, color }) => {
	const { t } = useTranslation();
	const tagByName = useMemo(() => {
		return t(`tags.${tag}`, tag);
	}, [t, tag]);

	return (
		<Box
			key={tag}
			backgroundColor={color.backgroundColor}
			borderRadius={20}
			alignItems="center"
			alignSelf="flex-start"
			minWidth={60}
			px={8}
			py={4}
			mt={8}
			mr={4}
		>
			<Text
				style={{
					fontSize: 12,
					color: color.textColor,
				}}
			>
				{tagByName}
			</Text>
		</Box>
	);
};

export default StationTagView;
