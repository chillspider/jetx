/* eslint-disable react-native/no-inline-styles */
import { Text, useTheme } from '@rneui/themed';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

type Props = {
	isDanger?: boolean;
	title: string;
	onPress?: () => void;
};

const AccountSettingItem: React.FC<Props> = ({ title, isDanger = false, onPress }) => {
	const {
		theme: { colors },
	} = useTheme();

	return (
		<TouchableOpacity
			style={{
				flexDirection: 'row',
				paddingVertical: 10,
				justifyContent: 'center',
				alignItems: 'center',
			}}
			onPress={onPress}
		>
			<Text
				numberOfLines={1}
				ellipsizeMode="tail"
				style={{
					flex: 1,
					paddingRight: 12,
					fontSize: 14,
					fontWeight: '300',
					color: isDanger ? colors.red : colors.neutral800,
				}}
			>
				{title}
			</Text>
			{!isDanger && <Icon name="chevron-right" size={24} />}
		</TouchableOpacity>
	);
};

export default AccountSettingItem;
