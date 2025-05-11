/* eslint-disable react-native/no-inline-styles */

import { Text, useTheme } from '@rneui/themed';
import React from 'react';
import { TouchableOpacity, useWindowDimensions } from 'react-native';

import { Box } from '@/components';

const HORIZONTAL_PADDING = 16;
export const ITEM_PADDING = 12;
const COLUMNS = 3;

export const useSettingButtonDimensions = () => {
	const { width: SCREEN_WIDTH } = useWindowDimensions();

	const ITEM_WIDTH =
		(SCREEN_WIDTH - ITEM_PADDING * (COLUMNS - 1) - HORIZONTAL_PADDING * 2) / COLUMNS;

	return { SCREEN_WIDTH, ITEM_WIDTH };
};

type Props = {
	title: string;
	onPress: () => void;
	icon: React.ReactNode;
};

const SettingButton: React.FC<Props> = ({ icon, title, onPress }) => {
	const {
		theme: { colors },
	} = useTheme();

	const { ITEM_WIDTH } = useSettingButtonDimensions();

	return (
		<TouchableOpacity
			onPress={onPress}
			style={{
				width: ITEM_WIDTH,
				justifyContent: 'center',
				alignItems: 'center',
				marginBottom: 12,
				alignSelf: 'flex-start',
			}}
		>
			<Box
				borderRadius={8}
				backgroundColor={colors.primary50}
				width={40}
				height={40}
				justifyContent="center"
				alignItems="center"
				mb={4}
			>
				{icon}
			</Box>
			<Text
				numberOfLines={2}
				style={{ textAlign: 'center', color: colors.neutral800, fontSize: 12 }}
			>
				{title}
			</Text>
		</TouchableOpacity>
	);
};

export default SettingButton;
