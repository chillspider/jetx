/* eslint-disable react-native/no-inline-styles */
import { Button, Text, useTheme } from '@rneui/themed';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { openSettings } from 'react-native-permissions';

import { ContentWrapper, ScreenWrapper } from '@/components';

type Props = {
	callback?: () => void;
};

const CameraNotSupportView: React.FC<Props> = ({ callback }) => {
	const { t } = useTranslation();

	const {
		theme: { colors },
	} = useTheme();

	return (
		<ScreenWrapper>
			<ContentWrapper justifyContent="center">
				<Text style={{ textAlign: 'center' }}>{t('cameraPermissionError')}</Text>
				<Pressable
					style={{ marginVertical: 12 }}
					hitSlop={8}
					onPress={() => openSettings('application')}
				>
					<Text
						style={{
							color: colors.blue,
							textDecorationLine: 'underline',
							textAlign: 'center',
						}}
					>
						{t('setting')}
					</Text>
				</Pressable>
				{__DEV__ && <Button title="Cheat" onPress={callback} />}
			</ContentWrapper>
		</ScreenWrapper>
	);
};

export default CameraNotSupportView;
