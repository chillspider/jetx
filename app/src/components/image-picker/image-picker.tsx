import { makeStyles, Text } from '@rneui/themed';
import mime from 'mime';
import React, { useCallback, useMemo } from 'react';
import { FieldValues, useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import Picker, { Image as PkImage } from 'react-native-image-crop-picker';

import IcPickerImg from '@/assets/svgs/ic_upload.svg';

import { Box } from '../box';
import Image from '../image/image';
import { InputControllerType } from '../input/controlled-input';
import { useModal } from '../modal';
import { Option, Options } from '../select/select';

export type PickerImage = {
	uri: string;
	name: string;
	type: string;
};

export const convertPickedImage = (img: PkImage): PickerImage => {
	const type = mime.getType(img?.path) || img.mime;

	const tempImage: PickerImage = {
		...img,
		uri: Platform.OS === 'ios' ? `file://${img.path}` : img.path,
		name: img?.path.substring(img.path.lastIndexOf('/') + 1),
		type,
	};

	return tempImage;
};

type ImagePickerProps = {
	style?: StyleProp<ViewStyle>;
	uri?: string;
	width?: number;
	height?: number;
	onChanged: (img: PickerImage) => void;
};

const ImagePicker: React.FC<ImagePickerProps> = ({
	width = 400,
	height = 400,
	style,
	uri,
	onChanged,
}) => {
	const pickImage = useCallback(() => {
		Picker.openPicker({
			width,
			height,
			mediaType: 'photo',
			cropping: true,
		})
			.then(img => {
				onChanged(convertPickedImage(img));
			})
			.catch(error => {
				console.error(error);
			});
	}, [height, onChanged, width]);

	const { t } = useTranslation();

	const takePhoto = useCallback(() => {
		Picker.openCamera({
			width,
			height,
			mediaType: 'photo',
			cropping: true,
		})
			.then(img => {
				onChanged(convertPickedImage(img));
			})
			.catch(error => {
				console.error(error);
			});
	}, [height, onChanged, width]);

	const options: Option[] = useMemo(
		() => [
			{
				label: t('picker.picker'),
				value: 'picker',
			},
			{
				label: t('picker.takePhoto'),
				value: 'camera',
			},
		],
		[t],
	);

	const modal = useModal();

	const onOptionSelected = useCallback(
		(option: Option) => {
			modal.dismiss();
			if (option.value === 'picker') {
				pickImage();
			} else {
				takePhoto();
			}
		},

		[modal, pickImage, takePhoto],
	);

	const styles = useStyles();

	return (
		<>
			<Pressable onPress={modal.present} style={[styles.container, style]}>
				{uri ? (
					<Image source={{ uri }} style={styles.image} />
				) : (
					<View style={styles.placeholder}>
						<IcPickerImg />
						<Box height={4} />
						<Text body2 style={styles.phTitle}>
							{t('picker.pickImgTitle')}
						</Text>
						<Text body2 style={styles.phDecs}>
							{t('picker.pickImgDecs')}
						</Text>
					</View>
				)}
			</Pressable>

			<Options ref={modal.ref} options={options} onSelect={onOptionSelected} />
		</>
	);
};

interface ControlledImagePickerProps<T extends FieldValues>
	extends ImagePickerProps,
		InputControllerType<T> {}

export function ControlledImagePicker<T extends FieldValues>(props: ControlledImagePickerProps<T>) {
	const { name, control, rules, onChanged: onNChanged, ...imageProps } = props;

	const { field } = useController({ control, name, rules: rules as any });

	const onChanged = useCallback(
		(img: PickerImage) => {
			field.onChange(img.uri);
			onNChanged?.(img);
		},

		[field, onNChanged],
	);

	return <ImagePicker uri={field.value} onChanged={onChanged} {...imageProps} />;
}

const useStyles = makeStyles(({ colors }) => ({
	container: {},
	placeholder: {
		flex: 1,
		backgroundColor: colors.primary50,
		borderRadius: 8,
		borderColor: colors.primary,
		borderWidth: 1,
		borderStyle: 'dashed',
		justifyContent: 'center',
		alignItems: 'center',
	},
	image: {
		borderRadius: 8,
		flex: 1,
	},
	phTitle: {
		color: colors.primary,
		fontSize: 14,
	},
	phDecs: {
		color: colors.neutral500,
		fontSize: 12,
		marginTop: 4,
	},
	imageListView: {
		flexDirection: 'row',
		alignItems: 'center',
	},
}));

export default ImagePicker;
