import { makeStyles, useTheme } from '@rneui/themed';
import { isNil, isNotNil } from 'ramda';
import React, { useCallback, useMemo } from 'react';
import { FieldValues, useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { DimensionValue, Pressable, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import Picker from 'react-native-image-crop-picker';
import FeatherIcon from 'react-native-vector-icons/Feather';

import IcPickerImg from '@/assets/svgs/ic_upload.svg';

import Image from '../image/image';
import { InputControllerType } from '../input/controlled-input';
import { useModal } from '../modal';
import { Option, Options } from '../select/select';
import { convertPickedImage, PickerImage } from './image-picker';

type ImageSize = {
	width?: number;
	height?: number;
};

type ImageViewSize = {
	width?: DimensionValue | undefined;
	height?: DimensionValue | undefined;
};

type MultiImagePickerProps = {
	size?: ImageSize | undefined;
	itemSize?: ImageViewSize | undefined;
	style?: StyleProp<ViewStyle>;
	imageStyle?: StyleProp<ViewStyle>;
	placeholderStyle?: StyleProp<ViewStyle>;
	uris?: string[];
	images?: PickerImage[] | undefined;
	maxLength?: number | undefined;
	onChanged: (images: PickerImage[]) => void;
};

const MultiImagePicker: React.FC<MultiImagePickerProps> = ({
	size = { height: 400, width: 400 },
	style,
	itemSize,
	uris = [],
	images = [],
	imageStyle,
	placeholderStyle,
	maxLength,
	onChanged,
}) => {
	const { t } = useTranslation();

	const styles = useStyles();

	const availablePicked = useMemo(() => {
		if (isNil(maxLength) || (isNotNil(maxLength) && uris.length < maxLength)) {
			return true;
		}
		return false;
	}, [maxLength, uris]);

	const maxFileAvailable = useMemo(() => {
		if (isNotNil(maxLength)) {
			return maxLength - uris.length;
		}
		return undefined;
	}, [maxLength, uris.length]);

	const onAddedImage = useCallback(
		(img: PickerImage) => {
			onChanged([...images, img]);
		},
		[images, onChanged],
	);

	const onAddedImageArray = useCallback(
		(imgs: PickerImage[]) => {
			onChanged([...images, ...imgs]);
		},
		[images, onChanged],
	);

	const onRemoveImage = useCallback(
		(uri: string) => {
			const newImages = images.filter(i => i.uri !== uri);
			onChanged(newImages);
		},
		[images, onChanged],
	);

	const pickImage = useCallback(() => {
		Picker.openPicker({
			width: size.width,
			height: size.height,
			mediaType: 'photo',
			cropping: false,
			multiple: true,
			maxFiles: maxFileAvailable,
		})
			.then(imgs => {
				const convertImgs = imgs.map(e => convertPickedImage(e));
				onAddedImageArray(convertImgs);
			})
			.catch(error => {
				console.error(error);
			});
	}, [maxFileAvailable, onAddedImageArray, size.height, size.width]);

	const takePhoto = useCallback(() => {
		Picker.openCamera({
			width: size.width,
			height: size.height,
			mediaType: 'photo',
			cropping: true,
		})
			.then(img => {
				onAddedImage(convertPickedImage(img));
			})
			.catch(error => {
				console.error(error);
			});
	}, [onAddedImage, size.height, size.width]);

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

	return (
		<>
			<ScrollView horizontal style={[styles.container, style]}>
				{uris?.map((uri, index) => {
					return (
						<ImageItemView
							key={index}
							uri={uri}
							size={itemSize}
							style={imageStyle}
							onRemove={() => {
								onRemoveImage(uri);
							}}
						/>
					);
				})}
				{availablePicked && (
					<PlaceHolderPicker onPress={modal.present} size={itemSize} style={placeholderStyle} />
				)}
			</ScrollView>
			<Options ref={modal.ref} options={options} onSelect={onOptionSelected} />
		</>
	);
};

interface ControlledMultiImagePickerProps<T extends FieldValues>
	extends MultiImagePickerProps,
		InputControllerType<T> {}

export function ControlledMultiImagePicker<T extends FieldValues>(
	props: ControlledMultiImagePickerProps<T>,
) {
	const { name, control, rules, onChanged: onNChanged, ...otherProps } = props;

	const { field } = useController({ control, name, rules: rules as any });

	const onChanged = useCallback(
		(imgs: PickerImage[]) => {
			field.onChange(imgs.map(e => e.uri));
			onNChanged?.(imgs);
		},
		[field, onNChanged],
	);

	return <MultiImagePicker uris={field.value} onChanged={onChanged} {...otherProps} />;
}

type ImageItemProps = {
	uri: string;
	style?: StyleProp<ViewStyle>;
	size?: ImageViewSize | undefined;
	onRemove?: () => void;
};

const ImageItemView: React.FC<ImageItemProps> = ({ uri, size, style, onRemove }) => {
	const styles = useStyles();
	const {
		theme: { colors },
	} = useTheme();

	return (
		<View style={[styles.imageView, { width: size?.width, height: size?.height }, style]}>
			<Image
				source={{ uri }}
				style={[styles.image, { width: size?.width, height: size?.height }]}
			/>
			<View style={styles.close}>
				<Pressable style={styles.closeButton} onPress={onRemove}>
					<FeatherIcon name="x" size={16} color={colors.neutral800} />
				</Pressable>
			</View>
		</View>
	);
};

type PlaceHolderProps = {
	onPress?: () => void;
	style?: StyleProp<ViewStyle>;
	size?: ImageViewSize | undefined;
};

const PlaceHolderPicker: React.FC<PlaceHolderProps> = ({ size, style, onPress }) => {
	const styles = useStyles();

	return (
		<Pressable
			onPress={onPress}
			style={[styles.placeholder, { width: size?.width, height: size?.height }, style]}
		>
			<IcPickerImg />
		</Pressable>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {},
	imageView: {
		marginRight: 8,
	},
	image: {
		borderRadius: 12,
	},
	placeholder: {
		backgroundColor: colors.neutral100,
		borderRadius: 12,
		borderColor: colors.neutral300,
		borderWidth: 1,
		borderStyle: 'dashed',
		justifyContent: 'center',
		alignItems: 'center',
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
	close: {
		position: 'absolute',
		right: 4,
		top: 4,
		padding: 4,
	},
	closeButton: {
		padding: 2,
		backgroundColor: colors.background,
		borderRadius: 4,
	},
}));

export default MultiImagePicker;
