import { makeStyles, Text } from '@rneui/themed';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Box } from '@/components';
import { ModeDto } from '@/models/devices/mode.dto';
import { displayPrice } from '@/utils/format';

import { Ratio, RatioSelected } from '../svgs/ratio';

type Props = {
	items: ModeDto[];
	selectedItem?: ModeDto;
	onChanged: (item: ModeDto) => void;
};

const WashMode: React.FC<Props> = ({ items = [], selectedItem, onChanged }) => {
	const styles = useStyles();

	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<Text>{t('process.washMode')}</Text>
			<Box height={12} />
			{items?.map((item, index) => (
				<ItemMode
					key={`${item.id}-${index}`}
					item={item}
					selected={selectedItem?.id === item.id}
					onChanged={onChanged}
				/>
			))}
		</View>
	);
};

type ItemProps = {
	item: ModeDto;
	selected: boolean;
	onChanged: (item: ModeDto) => void;
};

const ItemMode: React.FC<ItemProps> = ({ item, selected, onChanged }) => {
	const styles = useStyles({ selected });

	const isShowOriginPrice = useMemo(() => {
		return item.originPrice > item.price;
	}, [item]);

	return (
		<Pressable
			style={styles.itemContainer}
			onPress={() => {
				onChanged(item);
			}}
		>
			<View style={styles.itemContent}>
				<Text body2>{item.name}</Text>
				{isShowOriginPrice && (
					<Text style={styles.originPrice}>{displayPrice(item.originPrice)}</Text>
				)}
				<Text style={styles.itemPrice}>{displayPrice(item.price)}</Text>
			</View>
			{selected ? <RatioSelected /> : <Ratio />}
		</Pressable>
	);
};

const useStyles = makeStyles(({ colors }, { selected }: { selected?: boolean }) => ({
	container: {
		paddingVertical: 24,
	},
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
	},
	itemPrice: {
		fontSize: 14,
		color: colors.primary500,
		marginTop: 4,
	},
	originPrice: {
		fontSize: 14,
		color: colors.neutral500,
		marginTop: 4,
		textDecorationLine: 'line-through',
	},
}));

export default WashMode;
