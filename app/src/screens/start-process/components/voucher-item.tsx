/* eslint-disable no-nested-ternary */
import { makeStyles, Text } from '@rneui/themed';
import { isNotNil } from 'ramda';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Box } from '@/components';
import { VoucherDto } from '@/models/order/voucher.dto';
import { timeDuration } from '@/utils/date-utils';

import { Ratio, RatioSelected } from '../svgs/ratio';

type Props = {
	data: VoucherDto;
	isSelected?: boolean | undefined;
	selectable?: boolean | undefined;
	disabled?: boolean | undefined;
};

const VoucherItemView: React.FC<Props> = ({
	data,
	isSelected = false,
	selectable = false,
	disabled = false,
}) => {
	const styles = useStyles({ isSelected, disabled });

	const { t } = useTranslation();

	const calculateTimeToEnd = useCallback((): string | null => {
		const { endAt } = data;
		if (!endAt) {
			return null;
		}

		const duration = timeDuration(endAt);

		if (!duration) {
			return null;
		}

		const days = Math.floor(duration.asDays());
		const hours = duration.hours();
		const minutes = duration.minutes();

		let result: string = t('voucher_item.remaining_title');

		if (days > 0) {
			result += t('voucher_item.days', { days });
			if (hours > 0) {
				result += `, ${t('voucher_item.hours', { hours })}`;
			}
		} else if (hours > 0) {
			result += t('voucher_item.hours', { hours });
			if (minutes > 0) {
				result += `, ${t('voucher_item.minutes', { minutes })}`;
			}
		} else if (minutes > 0) {
			result += `${t('voucher_item.minutes', { minutes })}`;
		}

		return result || null;
	}, [data, t]);

	return (
		<View style={styles.container}>
			<View style={styles.border}>
				<View style={styles.backgroundCircle}>
					<View style={styles.circle} />
					<View style={styles.circle} />
					<View style={styles.circle} />
					<View style={styles.circle} />
				</View>
				<Box flex={1} pl={4}>
					<Text body2 style={styles.title}>
						{data.name}
					</Text>
					<Text style={styles.ruleText} numberOfLines={2} ellipsizeMode="tail">
						{data.description || ''}
					</Text>
					{isNotNil(data.endAt) && (
						<Text style={styles.ruleText} numberOfLines={2} ellipsizeMode="tail">
							{calculateTimeToEnd() || ''}
						</Text>
					)}
				</Box>

				{selectable && (
					<>{disabled ? <RadioDisabled /> : isSelected ? <RatioSelected /> : <Ratio />}</>
				)}
			</View>
		</View>
	);
};

const RadioDisabled = () => {
	return (
		<Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
			<Circle cx="8" cy="8" r="7.5" fill="#E0E0E1" stroke="#E0E0E1" />
		</Svg>
	);
};

const useStyles = makeStyles(
	({ colors }, { isSelected, disabled }: { isSelected: boolean; disabled: boolean }) => ({
		container: {
			overflow: 'hidden',
		},
		border: {
			backgroundColor: disabled
				? colors.neutral100
				: isSelected
					? colors.primary10
					: colors.neutral50,
			borderWidth: 1,
			borderColor: isSelected ? colors.primary : colors.neutral200,
			borderTopLeftRadius: 4,
			borderBottomLeftRadius: 4,
			borderTopRightRadius: 8,
			borderBottomRightRadius: 8,
			padding: 12,
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
		},
		circle: {
			marginTop: 5,
			width: 10,
			height: 10,
			borderRadius: 5,
			borderWidth: 1,
			borderColor: isSelected ? colors.primary : colors.neutral200,
			backgroundColor: colors.white,
		},
		backgroundCircle: {
			position: 'absolute',
			top: 5,
			left: -5,
			bottom: 10,
		},
		underline: {
			fontSize: 10,
			color: colors.blue,
			textDecorationLine: 'underline',
		},
		ruleText: {
			paddingTop: 4,
			fontWeight: '300',
			fontSize: 12,
			color: disabled ? colors.neutral500 : colors.neutral800,
		},
		title: {
			fontSize: 14,
			color: disabled ? colors.neutral500 : colors.neutral800,
		},
		date: {
			fontWeight: '300',
			fontSize: 10,
			color: colors.neutral400,
		},
		button: {
			backgroundColor: colors.primary,
			borderRadius: 4,
			paddingVertical: 6,
			paddingHorizontal: 12,
		},
		buttonTitle: {
			fontSize: 10,
			color: colors.white,
		},
	}),
);

export default VoucherItemView;
