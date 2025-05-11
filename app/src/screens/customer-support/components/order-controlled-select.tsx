/* eslint-disable react-native/no-inline-styles */
import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { Text, useTheme } from '@rneui/themed';
import { isNotEmpty } from 'ramda';
import React, { forwardRef, useCallback, useMemo } from 'react';
import { FieldValues, useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
	Pressable,
	PressableProps,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, SvgProps } from 'react-native-svg';

import { Box, Modal, useModal } from '@/components';
import { InputControllerType } from '@/components/input/controlled-input';
import { OrderDto } from '@/models/order/order.dto';
import { formatDate } from '@/utils/date-utils';

const List = BottomSheetFlatList;

type OptionsProps = {
	options: OrderDto[];
	onSelect: (option: OrderDto) => void;
	value?: string | number;
	onEndReached?: () => void;
};

function keyExtractor(item: OrderDto) {
	return `select-item-${item.id}`;
}

const Options = forwardRef<BottomSheetModal, OptionsProps>(
	({ options, onSelect, value, onEndReached }, ref) => {
		const { bottom: bottomSafe } = useSafeAreaInsets();

		const height = options.length * 80 + 100 + bottomSafe;

		const { height: SCREEN_HEIGHT } = useWindowDimensions();

		const snapPoints = useMemo(
			() => [height >= SCREEN_HEIGHT - 100 ? SCREEN_HEIGHT - 100 : height],
			[SCREEN_HEIGHT, height],
		);

		const {
			theme: { colors },
		} = useTheme();

		const renderSelectItem = useCallback(
			({ item }: { item: OrderDto }) => (
				<OptionItem
					order={item}
					key={`select-item-${item.id}`}
					selected={value === item.id}
					onPress={() => onSelect(item)}
				/>
			),

			[onSelect, value],
		);

		return (
			<Modal
				ref={ref}
				index={0}
				snapPoints={snapPoints}
				backgroundStyle={{
					backgroundColor: colors.background,
				}}
			>
				<List
					data={options}
					keyExtractor={keyExtractor}
					renderItem={renderSelectItem}
					onEndReachedThreshold={0.5}
					onEndReached={onEndReached}
				/>
			</Modal>
		);
	},
);

const OptionItem = React.memo(
	({
		order,
		selected = false,
		...props
	}: PressableProps & {
		selected?: boolean;
		order: OrderDto;
	}) => {
		const {
			theme: { colors },
		} = useTheme();

		const { t } = useTranslation();

		return (
			<Pressable
				{...props}
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					borderBottomWidth: 1,
					borderColor: colors.neutral300,
					backgroundColor: colors.white,
					paddingHorizontal: 16,
					paddingVertical: 10,
				}}
			>
				<View style={{ flex: 1 }}>
					<Text body2 style={{ fontWeight: 'bold' }}>
						{order.data?.stationName || ''} - {t('support.order_id', { id: order.incrementId })}
					</Text>
					<Box pt={4} mt={4} flexDirection="row" alignItems="center">
						<LocationIc />
						<Text
							numberOfLines={2}
							style={{ color: colors.neutral400, fontSize: 12, paddingLeft: 4 }}
						>
							{order.data?.stationAddress || ''}
						</Text>
					</Box>
					<Box pt={4} mt={4} flexDirection="row" alignItems="center">
						<DateIc />
						<Text
							numberOfLines={1}
							style={{ color: colors.neutral400, fontSize: 12, paddingLeft: 4 }}
						>
							{formatDate(order.createdAt || Date.now())}
						</Text>
					</Box>
				</View>
				{selected && <Check />}
			</Pressable>
		);
	},
);

interface SelectProps {
	value?: string | number;
	label: string;
	disabled?: boolean;
	error?: string;
	orders?: OrderDto[];
	onSelect?: (value: string | number) => void;
	placeholder?: string;
	onEndReached?: () => void;
}

interface ControlledSelectProps<T extends FieldValues>
	extends SelectProps,
		InputControllerType<T> {}

const Select = (props: SelectProps) => {
	const {
		error,
		orders = [],
		placeholder = 'Select...',
		disabled = false,
		onSelect,
		value,
		label,
		onEndReached,
	} = props;

	const {
		theme: { colors },
	} = useTheme();

	const modal = useModal();

	const { t } = useTranslation();

	const onSelectOption = React.useCallback(
		(option: OrderDto) => {
			onSelect?.(option.id);
			modal.dismiss();
		},
		[modal, onSelect],
	);

	const textValue = React.useMemo(() => {
		if (value !== undefined) {
			const selectedOrder = orders?.filter(i => i.id === value);
			if (isNotEmpty(selectedOrder)) {
				return t('support.order_id', { id: selectedOrder[0].incrementId });
			}
			return placeholder;
		}
		return placeholder;
	}, [value, placeholder, orders, t]);

	return (
		<>
			<Box mb={4}>
				{label && <Text>{label}</Text>}
				<TouchableOpacity
					disabled={disabled}
					onPress={modal.present}
					style={{
						borderColor: colors.neutral200,
						borderWidth: 1,
						borderRadius: 8,
						paddingHorizontal: 12,
						paddingVertical: 12,
						flexDirection: 'row',
						marginTop: 6,
					}}
				>
					<Box flex={1}>
						<Text body2>{textValue}</Text>
					</Box>
					<CaretDown />
				</TouchableOpacity>
				{error && (
					<Text
						body2
						style={{
							color: colors.error,
						}}
					>
						{error}
					</Text>
				)}
			</Box>
			<Options
				ref={modal.ref}
				options={orders}
				onSelect={onSelectOption}
				value={value}
				onEndReached={onEndReached}
			/>
		</>
	);
};

export function ControlledOrderSelect<T extends FieldValues>(props: ControlledSelectProps<T>) {
	const { name, control, rules, onSelect: onNSelect, ...selectProps } = props;

	const { field, fieldState } = useController({ control, name, rules: rules as any });

	const onSelect = React.useCallback(
		(value: string | number) => {
			field.onChange(value);
			onNSelect?.(value);
		},
		[field, onNSelect],
	);

	return (
		<Select
			onSelect={onSelect}
			value={field.value}
			error={fieldState.error?.message}
			{...selectProps}
		/>
	);
}

const Check = ({ ...props }: SvgProps) => {
	const {
		theme: { colors },
	} = useTheme();

	return (
		<Svg width={25} height={24} fill="none" viewBox="0 0 25 24" {...props}>
			<Path
				d="m20.256 6.75-10.5 10.5L4.506 12"
				stroke={colors.primary}
				strokeWidth={2.438}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
};

const CaretDown = ({ ...props }: SvgProps) => {
	const {
		theme: { colors },
	} = useTheme();

	return (
		<Svg width={12} height={13} fill="none" {...props}>
			<Path
				stroke={colors.neutral800}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={1.5}
				d="M9.75 4.744 6 8.494l-3.75-3.75"
			/>
		</Svg>
	);
};

const LocationIc = () => {
	return (
		<Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
			<Path
				d="M6 0.5C3.52074 0.5 1.5 2.52074 1.5 5C1.5 6.74744 2.60427 8.19558 3.65137 9.21191C4.69846 10.2282 5.74609 10.8428 5.74609 10.8428C5.82303 10.8881 5.9107 10.912 6 10.912C6.0893 10.912 6.17697 10.8881 6.25391 10.8428C6.25391 10.8428 7.30154 10.2282 8.34863 9.21191C9.39573 8.19558 10.5 6.74744 10.5 5C10.5 2.52074 8.47926 0.5 6 0.5ZM6 1.5C7.93874 1.5 9.5 3.06126 9.5 5C9.5 6.31156 8.60427 7.56923 7.65137 8.49414C6.82546 9.29579 6.20537 9.65648 6 9.7832C5.79463 9.65648 5.17454 9.29579 4.34863 8.49414C3.39573 7.56923 2.5 6.31156 2.5 5C2.5 3.06126 4.06126 1.5 6 1.5ZM6 3C5.375 3 4.84261 3.25238 4.50098 3.63672C4.15934 4.02106 4 4.51389 4 5C4 5.48611 4.15934 5.97894 4.50098 6.36328C4.84261 6.74762 5.375 7 6 7C6.625 7 7.15739 6.74762 7.49902 6.36328C7.84066 5.97894 8 5.48611 8 5C8 4.51389 7.84066 4.02106 7.49902 3.63672C7.15739 3.25238 6.625 3 6 3ZM6 4C6.375 4 6.59261 4.12262 6.75098 4.30078C6.90934 4.47894 7 4.73611 7 5C7 5.26389 6.90934 5.52106 6.75098 5.69922C6.59261 5.87738 6.375 6 6 6C5.625 6 5.40739 5.87738 5.24902 5.69922C5.09066 5.52106 5 5.26389 5 5C5 4.73611 5.09066 4.47894 5.24902 4.30078C5.40739 4.12262 5.625 4 6 4Z"
				fill="#A0A0A1"
			/>
		</Svg>
	);
};

const DateIc = () => {
	return (
		<Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
			<Path
				d="M3.99219 0.993225C3.85975 0.995295 3.73354 1.04983 3.64127 1.14485C3.54899 1.23987 3.49819 1.36762 3.5 1.50006H2C1.8674 1.50007 1.74023 1.55276 1.64646 1.64652C1.5527 1.74029 1.50001 1.86746 1.5 2.00006V10.0001C1.50001 10.1327 1.5527 10.2598 1.64646 10.3536C1.74023 10.4474 1.8674 10.5 2 10.5001H10C10.1326 10.5 10.2598 10.4474 10.3535 10.3536C10.4473 10.2598 10.5 10.1327 10.5 10.0001V2.00006C10.5 1.86746 10.4473 1.74029 10.3535 1.64652C10.2598 1.55276 10.1326 1.50007 10 1.50006H8.5C8.50092 1.43317 8.4884 1.36677 8.46319 1.3048C8.43798 1.24283 8.4006 1.18655 8.35324 1.13929C8.30589 1.09202 8.24954 1.05475 8.18752 1.02966C8.1255 1.00457 8.05908 0.99218 7.99219 0.993225C7.85975 0.995295 7.73354 1.04983 7.64127 1.14485C7.54899 1.23987 7.49819 1.36762 7.5 1.50006H4.5C4.50092 1.43317 4.4884 1.36677 4.46319 1.3048C4.43798 1.24283 4.4006 1.18655 4.35325 1.13929C4.30589 1.09202 4.24954 1.05475 4.18752 1.02966C4.1255 1.00457 4.05908 0.99218 3.99219 0.993225ZM2.5 2.50006H3.5C3.49906 2.56632 3.5113 2.6321 3.53601 2.69358C3.56072 2.75507 3.5974 2.81103 3.64392 2.85821C3.69044 2.9054 3.74588 2.94287 3.80701 2.96844C3.86814 2.99401 3.93374 3.00718 4 3.00718C4.06626 3.00718 4.13186 2.99401 4.19299 2.96844C4.25412 2.94287 4.30956 2.9054 4.35608 2.85821C4.4026 2.81103 4.43928 2.75507 4.46399 2.69358C4.4887 2.6321 4.50094 2.56632 4.5 2.50006H7.5C7.49906 2.56632 7.5113 2.6321 7.53601 2.69358C7.56072 2.75507 7.5974 2.81103 7.64392 2.85821C7.69044 2.9054 7.74588 2.94287 7.80701 2.96844C7.86814 2.99401 7.93374 3.00718 8 3.00718C8.06626 3.00718 8.13186 2.99401 8.19299 2.96844C8.25412 2.94287 8.30956 2.9054 8.35608 2.85821C8.4026 2.81103 8.43928 2.75507 8.46399 2.69358C8.4887 2.6321 8.50094 2.56632 8.5 2.50006H9.5V4.00006H2.5V2.50006ZM2.5 5.00006H9.5V9.50006H2.5V5.00006Z"
				fill="#A0A0A1"
			/>
		</Svg>
	);
};
