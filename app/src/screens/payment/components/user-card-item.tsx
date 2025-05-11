import { makeStyles, Text, useTheme } from '@rneui/themed';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import CardImg from '@/assets/svgs/ic_card_token.svg';
import IcSelected from '@/assets/svgs/ratio-selected.svg';
import { Box } from '@/components';
import { UserTokenDto } from '@/models/payment/user-token.dto';

type Props = {
	data: UserTokenDto;
	editable: boolean;
	isDefault: boolean;
	onRemove?: () => void;
	onDefaultChanged?: () => void;
};

const UserCardItem: React.FC<Props> = ({
	data,
	editable,
	isDefault,
	onRemove,
	onDefaultChanged,
}) => {
	const styles = useStyles({ isDefault, editable });
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			{editable ? (
				<Pressable style={styles.remove} onPress={onRemove}>
					<RemoveIcon />
				</Pressable>
			) : (
				<Box width={12} />
			)}
			<CardImg />
			<Box flex={1} pl={12} py={12}>
				<Text body2>{data.accountBrand || ''}</Text>
				<Text style={styles.cardNumber}>{data.accountNumber || ''}</Text>
			</Box>

			{editable && (
				<Pressable style={styles.editableDefault} onPress={onDefaultChanged}>
					{isDefault ? <RatioSelected /> : <Ratio />}
				</Pressable>
			)}

			{!editable && isDefault && (
				<View style={styles.defaultContent}>
					<Text style={styles.titleDefault}>{t('payment_setting.default')}</Text>
				</View>
			)}
		</View>
	);
};

const RemoveIcon = () => {
	return (
		<Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
			<Path
				d="M12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM16 13H8C7.447 13 7 12.553 7 12C7 11.447 7.447 11 8 11H16C16.553 11 17 11.447 17 12C17 12.553 16.553 13 16 13Z"
				fill="#E53935"
			/>
		</Svg>
	);
};

const Ratio = () => {
	const {
		theme: { colors },
	} = useTheme();

	return (
		<Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
			<Circle cx="8" cy="8" r="7.5" fill="white" stroke={colors.neutral300} />
		</Svg>
	);
};

const RatioSelected = () => {
	return <IcSelected />;
};

const useStyles = makeStyles(
	({ colors }, { isDefault, editable }: { isDefault: boolean; editable: boolean }) => ({
		container: {
			borderWidth: 1,
			borderColor: isDefault ? colors.primary50 : colors.neutral200,
			borderRadius: 8,
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			height: 64,
		},
		remove: {
			paddingHorizontal: 12,
		},
		cardNumber: {
			fontSize: 12,
			marginTop: 4,
		},
		titleDefault: {
			fontSize: 12,
			color: colors.primary500,
			fontWeight: '300',
		},
		defaultContent: {
			backgroundColor: colors.primary50,
			paddingHorizontal: 8,
			height: '100%',
			justifyContent: 'center',
			alignItems: 'center',
		},
		editableDefault: {
			padding: 12,
		},
	}),
);

export default UserCardItem;
