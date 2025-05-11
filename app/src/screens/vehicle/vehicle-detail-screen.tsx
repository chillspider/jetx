import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button, makeStyles, Switch, Text, useTheme } from '@rneui/themed';
import { isNotEmpty, isNotNil } from 'ramda';
import React, { useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { Box, ContentWrapper, Header, ScreenWrapper } from '@/components';
import { ControlledImagePicker, PickerImage } from '@/components/image-picker/image-picker';
import ControlledInput from '@/components/input/controlled-input';
import { useVehicleContext } from '@/core/contexts/vehicle-context';
import { useUpdateVehicle } from '@/core/hooks/useVehicles';
import { AppNavigationProp, AppRouteProp } from '@/types/navigation';
import { getPublicMediaUrl } from '@/utils/resources';

import { FormType, schema } from './utils';

const VehicleDetailScreen: React.FC = () => {
	const {
		theme: { colors },
	} = useTheme();

	const navigation = useNavigation<AppNavigationProp<'Vehicle'>>();

	const {
		params: { vehicle },
	} = useRoute<AppRouteProp<'Vehicle'>>();

	const { bottom: bottomSafe } = useSafeAreaInsets();
	const { t } = useTranslation();

	const styles = useStyles();
	const { refetch } = useVehicleContext();

	//* form
	const [featureImage, setFeatureImage] = useState<PickerImage>();
	const { handleSubmit, control } = useForm<FormType>({
		resolver: zodResolver(schema),
		defaultValues: {
			default: vehicle.isDefault,
			color: vehicle.color || undefined,
			brand: vehicle.brand || undefined,
			model: vehicle.model || undefined,
			number: vehicle.numberPlate,
			count: `${vehicle.seatCount || 0}`,
			image:
				isNotNil(vehicle.featureImageUrl) && isNotEmpty(vehicle.featureImageUrl)
					? getPublicMediaUrl(vehicle.featureImageUrl || '')
					: undefined,
		},
	});

	const mutation = useUpdateVehicle({
		onSuccess: () => {
			Toast.show({
				type: 'success',
				text1: t('notificationTitle'),
				text2: t('vehicle.success'),
			});
			refetch();
			navigation.goBack();
		},
		onError: () => {
			Toast.show({
				type: 'error',
				text1: t('notificationTitle'),
				text2: t('networkError'),
			});
		},
	});

	const onSubmit: SubmitHandler<FormType> = data => {
		mutation.mutate({
			...vehicle,
			brand: data.brand,
			model: data.model,
			seatCount: Number(data.count),
			color: data.color,
			numberPlate: data.number,
			isDefault: data.default,
			featureImage,
		});
	};

	return (
		<ScreenWrapper>
			<Header title={t('vehicle.detailTitle')} />
			<ContentWrapper>
				<KeyboardAwareScrollView style={styles.content} showsVerticalScrollIndicator={false}>
					<Text>{t('vehicle.details')}</Text>
					<Box height={16} />
					<Box flexDirection="row" justifyContent="center">
						<ControlledInput
							control={control}
							name="brand"
							placeholder={t('vehicle.brandPlaceholder')}
							label={t('vehicle.brandLabel')}
							containerStyle={styles.inputRow}
						/>
						<Box width={12} />
						<ControlledInput
							control={control}
							name="model"
							placeholder={t('vehicle.modelPlaceholder')}
							label={t('vehicle.modelLabel')}
							containerStyle={styles.inputRow}
						/>
					</Box>
					<ControlledInput
						control={control}
						name="number"
						placeholder={t('vehicle.numberPlaceholder')}
						label={`${t('vehicle.numberLabel')}*`}
					/>
					<ControlledInput
						control={control}
						name="count"
						placeholder={t('vehicle.countPlaceholder')}
						label={`${t('vehicle.countLabel')}*`}
						keyboardType="numeric"
					/>
					<ControlledInput
						control={control}
						name="color"
						placeholder={t('vehicle.colorPlaceholder')}
						label={t('vehicle.colorLabel')}
					/>
					<Box height={12} />
					<Text>{t('vehicle.images')}</Text>
					<Box height={12} />
					<ControlledImagePicker
						control={control}
						name="image"
						width={800}
						height={800}
						onChanged={m => {
							setFeatureImage(m);
						}}
						style={styles.image}
					/>
					<Box height={24} />
					<Controller
						control={control}
						name="default"
						render={({ field: { value, onChange } }) => (
							<Box flexDirection="row" alignItems="center">
								<Text body2 style={styles.inputRow}>
									{t('vehicle.defaultLabel')}
								</Text>
								<Switch value={value} onValueChange={v => onChange(v)} />
							</Box>
						)}
					/>
					<Box height={48} />
				</KeyboardAwareScrollView>
				<Box pb={bottomSafe + 12} pt={12} backgroundColor={colors.white}>
					<Button
						title={t('saveChange')}
						onPress={handleSubmit(onSubmit)}
						disabled={mutation.isPending}
						loading={mutation.isPending}
					/>
				</Box>
			</ContentWrapper>
		</ScreenWrapper>
	);
};

const useStyles = makeStyles(() => ({
	container: {},
	content: {
		paddingTop: 16,
	},
	inputRow: {
		flex: 1,
	},
	image: {
		width: '100%',
		aspectRatio: 2,
	},
}));

export default VehicleDetailScreen;
