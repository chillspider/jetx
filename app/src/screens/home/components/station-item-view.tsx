/* eslint-disable simple-import-sort/imports */
/* eslint-disable react-native/no-inline-styles */
import { Text, useTheme } from '@rneui/themed';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, TouchableOpacity } from 'react-native';

import IcArrowRight from '@/assets/svgs/ic_car_arrow_right.svg';
import IcCar from '@/assets/svgs/ic_cart.svg';
import IcClose from '@/assets/svgs/ic_close.svg';
import IcRoad from '@/assets/svgs/ic_road.svg';

import { Box, Image } from '@/components';
import { StationStatus } from '@/models/stations/station-status.enum';
import { StationDto } from '@/models/stations/station.dto';

import { getPublicMediaUrl } from '@/utils/resources';
import FastImage from 'react-native-fast-image';
import ComingSoonView from './commons/coming-soon-view';
import StationTagView from './station-tag-view';
import { formatDistance, getFormattedAddress, getTagColorByIndex } from './utils';

type StationItemProps = {
	data: StationDto;
	isDetail?: boolean;
	onOpenMap?: () => void;
	onClose?: () => void;
};

const StationItemView: React.FC<StationItemProps> = ({
	data,
	isDetail = false,
	onOpenMap,
	onClose,
}) => {
	const {
		theme: { colors },
	} = useTheme();

	const { t } = useTranslation();

	const isMaintenance = useMemo(() => {
		return data.status === StationStatus.MAINTENANCE;
	}, [data]);

	return (
		<Box mb={12} px={isDetail ? 16 : 0}>
			<Box flexDirection="row" justifyContent="center" alignItems="center">
				{isDetail && (
					<TouchableOpacity onPress={onClose}>
						<Box
							width={24}
							height={24}
							borderRadius={16}
							backgroundColor={colors.neutral100}
							alignItems="center"
							justifyContent="center"
							hitSlop={{ left: 8, right: 8, top: 8, bottom: 8 }}
						>
							<IcClose width={16} height={16} />
						</Box>
					</TouchableOpacity>
				)}
				<Box flex={1} pl={isDetail ? 8 : 0} flexDirection="row" alignItems="center">
					<Box flex={1}>
						<Text>{data.name ?? ''}</Text>
					</Box>
					<Pressable onPress={onOpenMap}>
						<Box
							width={24}
							height={24}
							borderRadius={16}
							backgroundColor={colors.neutral100}
							alignItems="center"
							justifyContent="center"
							hitSlop={{ left: 8, right: 8, top: 8, bottom: 8 }}
						>
							<IcArrowRight />
						</Box>
					</Pressable>
				</Box>
			</Box>

			<Box flexDirection="row" mt={8} alignItems="center">
				<Text style={{ color: colors.neutral500, fontSize: 14 }}>
					{getFormattedAddress(data.location)}
				</Text>
			</Box>
			<Box flexDirection="row" alignItems="center" mt={8}>
				<IcRoad />
				<Text style={{ fontSize: 14, color: colors.info }}>
					{formatDistance(data.distance || 0)}
				</Text>
			</Box>
			<Box flexDirection="row" alignItems="center" mt={8}>
				<Box
					flexDirection="row"
					backgroundColor={colors.neutral100}
					borderRadius={20}
					alignItems="center"
					alignSelf="flex-start"
					px={8}
					py={4}
				>
					<IcCar />
					<Text
						style={{
							fontSize: 14,
							color: colors.neutral500,
							marginLeft: 4,
						}}
					>
						{t('availableWashSlots', {
							deviceCount: data.deviceCount,
						})}
					</Text>
				</Box>
				{isMaintenance && (
					<>
						<Box width={8} />
						<ComingSoonView />
					</>
				)}
			</Box>
			<Box flexDirection="row" flexWrap="wrap" mt={8}>
				{data.tags?.map((tag, index) => {
					const tagColor = getTagColorByIndex(index);

					return (
						<StationTagView tag={tag.name || ''} key={`${tag.name}-${index}`} color={tagColor} />
					);
				})}
			</Box>
			{isDetail && !!data.images && (
				<ScrollView horizontal style={{ marginTop: 16 }} showsHorizontalScrollIndicator={false}>
					{data.images.map((img, index) => (
						<Image
							key={`${index}-${img}`}
							style={{ height: 100, width: 100, borderRadius: 12, marginRight: 8 }}
							source={{
								uri: getPublicMediaUrl(img),
							}}
							resizeMode={FastImage.resizeMode.cover}
						/>
					))}
				</ScrollView>
			)}
		</Box>
	);
};

export default StationItemView;
