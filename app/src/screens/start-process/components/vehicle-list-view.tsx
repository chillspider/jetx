/* eslint-disable react-native/no-inline-styles */
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Text, useTheme } from '@rneui/themed';
import React, { useCallback } from 'react';
import { Pressable } from 'react-native';
import Svg, { Path, SvgProps } from 'react-native-svg';

import { Box } from '@/components';
import { VehicleDto } from '@/models/vehicle/vehicle.dto';

type Props = {
	vehicle?: VehicleDto;
	list: VehicleDto[];
	onChanged: (vehicle: VehicleDto) => void;
};

const VehicleListView: React.FC<Props> = ({ vehicle, list, onChanged }) => {
	const {
		theme: { colors },
	} = useTheme();

	const renderItem = useCallback(
		({ item }: { item: VehicleDto }) => {
			const selected = vehicle?.id === item.id;
			return (
				<Pressable
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						borderBottomWidth: 1,
						borderColor: colors.neutral300,
						backgroundColor: colors.white,
						paddingHorizontal: 16,
						paddingVertical: 10,
					}}
					onPress={() => {
						onChanged(item);
					}}
				>
					<Box flex={1}>
						<Text
							style={{ fontWeight: selected ? 'bold' : '400' }}
						>{`${item.brand} ${item.model}`}</Text>
						<Text body2 style={{ fontWeight: selected ? 'bold' : '400', marginTop: 4 }}>
							{item.numberPlate}
						</Text>
					</Box>
					{selected && <Check />}
				</Pressable>
			);
		},

		[colors, onChanged, vehicle],
	);

	return <BottomSheetFlatList data={list} renderItem={renderItem} />;
};

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

export default VehicleListView;
