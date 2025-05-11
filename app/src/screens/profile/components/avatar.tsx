/* eslint-disable react-native/no-inline-styles */
import { Avatar as RNEAvatar, useTheme } from '@rneui/themed';
import { isEmpty } from 'ramda';
import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import DefaultAvatar from '@/assets/svgs/ic-avatar-default.svg';

const AVATAR_SIZE = 80;
const AVATAR_HALF = AVATAR_SIZE / 2;

type Props = {
	name: string;
	style?: StyleProp<ViewStyle>;
};

const Avatar: React.FC<Props> = ({ name, style }) => {
	const {
		theme: { colors },
	} = useTheme();

	if (isEmpty(name)) {
		return (
			<View style={[{ marginTop: -AVATAR_HALF, alignSelf: 'center' }, style]}>
				<DefaultAvatar />
			</View>
		);
	}

	return (
		<View
			style={[
				{
					width: AVATAR_SIZE,
					height: AVATAR_SIZE,
					backgroundColor: 'white',
					borderRadius: AVATAR_HALF,
					alignSelf: 'center',
					marginTop: -AVATAR_HALF,
					padding: 4,
				},
				style,
			]}
		>
			<RNEAvatar
				rounded
				containerStyle={{
					width: '100%',
					height: '100%',
					backgroundColor: colors.primary,
					borderRadius: AVATAR_HALF - 2,
				}}
				title={name.substring(0, 1).toUpperCase()}
				titleStyle={{
					fontSize: 30,
					fontWeight: 'bold',
					color: 'white',
				}}
			/>
		</View>
	);
};

export default Avatar;
