// eslint-disable-next-line simple-import-sort/imports
import { CheckBox, makeStyles, Text } from '@rneui/themed';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import IcCardToken from '@/assets/svgs/ic_card_token.svg';
import IcCash from '@/assets/svgs/ic_cash.svg';
import IcCredit from '@/assets/svgs/ic_credit_card.svg';
import IcQR from '@/assets/svgs/ic_qr.svg';
import { Box } from '@/components';
import { PaymentMethodModel } from '@/models/payment/payment-method-model';
import { PaymentMethod } from '@/models/payment/payment-method.enum';

import { Ratio, RatioSelected } from '../svgs/ratio';

type Props = {
	items?: PaymentMethodModel[];
	selectedMethod?: PaymentMethodModel;
	onChanged: (item: PaymentMethodModel) => void;
	saveCard: boolean;
	onSaveCard: () => void;
};

const PaymentSelection: React.FC<Props> = ({
	items,
	selectedMethod,
	onChanged,
	saveCard,
	onSaveCard,
}) => {
	const styles = useStyles();

	const { t } = useTranslation();

	const isShowTokenSaved = useMemo(() => {
		if (selectedMethod?.method === PaymentMethod.CREDIT) {
			return true;
		}
		return false;
	}, [selectedMethod]);

	const isSelected = useCallback(
		(item: PaymentMethodModel) => {
			if (selectedMethod) {
				if (selectedMethod.method === PaymentMethod.TOKEN && selectedMethod.token && item.token) {
					return selectedMethod.token.id === item.token.id;
				}
				return selectedMethod.method === item.method;
			}

			return false;
		},
		[selectedMethod],
	);

	return (
		<View style={styles.container}>
			<Text>{t('paymentMethod')}</Text>
			<Box height={12} />
			{items?.map((item, index) => (
				<ItemMethod
					key={`${item.method}-${index}`}
					item={item}
					onChanged={onChanged}
					selected={isSelected(item)}
				/>
			))}
			{isShowTokenSaved && (
				<>
					<Box height={4} />
					<CheckBox
						checked={saveCard}
						onPress={onSaveCard}
						iconType="material-community"
						checkedIcon="checkbox-marked"
						uncheckedIcon="checkbox-blank-outline"
						title={t('process.saveCard')}
						textStyle={styles.rememberCard}
						containerStyle={styles.rememberContainer}
					/>
				</>
			)}
		</View>
	);
};

type ItemProps = {
	item: PaymentMethodModel;
	selected: boolean;
	onChanged: (item: PaymentMethodModel) => void;
};

const ItemMethod: React.FC<ItemProps> = ({ item, selected, onChanged }) => {
	const styles = useStyles({ selected });

	const { t } = useTranslation();

	const icon = useMemo(() => {
		switch (item.method) {
			case PaymentMethod.CASH:
				return <IcCash />;
			case PaymentMethod.CREDIT:
				return <IcCredit />;
			case PaymentMethod.TOKEN:
				return <IcCardToken />;
			case PaymentMethod.QR:
				return <IcQR />;
			default:
				return <IcCash />;
		}
	}, [item.method]);

	const methodName = useMemo(() => {
		switch (item.method) {
			case PaymentMethod.CASH:
				return t('cash');
			case PaymentMethod.QR:
				return t('process.qr');
			case PaymentMethod.CREDIT:
				return t('credit');
			case PaymentMethod.TOKEN:
				return item.token?.accountBrand || '';
			case PaymentMethod.QRPAY:
				return t('qrpay');
			default:
				return item.method || '';
		}
	}, [item, t]);

	const methodDesc = useMemo(() => {
		switch (item.method) {
			case PaymentMethod.TOKEN:
				return item.token?.accountNumber || '';
			default:
				return t('paymentDecs');
		}
	}, [item, t]);

	return (
		<Pressable
			style={styles.itemContainer}
			onPress={() => {
				onChanged(item);
			}}
		>
			{icon}
			<View style={styles.itemContent}>
				<View style={styles.name}>
					<Text body2>{methodName}</Text>
					{!!item.isDefault && (
						<View style={styles.defaultContent}>
							<Text style={styles.defaultText}>{t('payment_setting.default')}</Text>
						</View>
					)}
				</View>
				<Text style={styles.itemPrice}>{methodDesc}</Text>
			</View>
			{selected ? <RatioSelected /> : <Ratio />}
		</Pressable>
	);
};

const useStyles = makeStyles(({ colors }, { selected }: { selected?: boolean }) => ({
	container: {},
	itemContainer: {
		borderWidth: 1,
		borderColor: selected ? colors.primary300 : colors.neutral200,
		backgroundColor: selected ? colors.primary10 : colors.white,
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
		marginBottom: 8,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	itemContent: {
		flex: 1,
		marginLeft: 12,
	},
	itemPrice: {
		fontSize: 12,
		marginTop: 4,
	},
	rememberCard: {
		fontSize: 12,
		fontWeight: '400',
		color: colors.neutral800,
	},
	rememberContainer: {
		padding: 0,
		flex: 1,
	},
	name: {
		flexDirection: 'row',
	},
	defaultContent: {
		paddingHorizontal: 4,
		paddingVertical: 2,
		borderColor: colors.primary500,
		borderWidth: 0.5,
		borderRadius: 2,
		marginLeft: 12,
	},
	defaultText: {
		fontSize: 10,
		color: colors.primary500,
	},
}));

export default PaymentSelection;
