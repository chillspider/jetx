import { makeStyles, Text } from '@rneui/themed';
import { isNotNil } from 'ramda';
import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';

import IcMinus from '@/assets/svgs/pos/ic_minus.svg';
import IcPlus from '@/assets/svgs/pos/ic_plus.svg';
import { Image } from '@/components';
import { useFnbOrderContext } from '@/core/contexts/fnb-order-context';
import { BBProductDto } from '@/models/bitebolt/bb-product.dto';
import { displayPrice } from '@/utils/format';

type ProductItemViewProps = {
	data: BBProductDto;
};

const ProductItemView = React.memo(({ data }: ProductItemViewProps) => {
	const styles = useStyles();

	const { items, addItem, minusItem } = useFnbOrderContext();

	const quantity = useMemo(() => {
		return items.find(item => item.product.id === data.id)?.quantity || 0;
	}, [items, data.id]);

	const hasDiscount = useMemo(() => {
		if (isNotNil(data.discountPrice) && data.discountPrice !== data.price) {
			return true;
		}
		return false;
	}, [data]);

	return (
		<View style={styles.container}>
			<Image source={{ uri: data.photo }} style={styles.image} />
			<View style={styles.content}>
				<Text>{data.name}</Text>
				{hasDiscount && (
					<>
						<Text style={styles.textPriceDiscount}>{displayPrice(data.price || 0)}</Text>
						<Text style={styles.textPrice}>{displayPrice(data.discountPrice || 0)}</Text>
					</>
				)}
				{!hasDiscount && <Text style={styles.textPrice}>{displayPrice(data.price || 0)}</Text>}
			</View>
			<View style={styles.action}>
				<TouchableOpacity style={styles.actionIcon} onPress={() => minusItem(data)}>
					<IcMinus />
				</TouchableOpacity>
				<Text style={styles.textQuantity}>{quantity}</Text>
				<TouchableOpacity style={styles.actionIcon} onPress={() => addItem(data)}>
					<IcPlus />
				</TouchableOpacity>
			</View>
		</View>
	);
});

const useStyles = makeStyles(({ colors }) => ({
	container: {
		paddingVertical: 4,
		flexDirection: 'row',
	},
	content: {
		flex: 1,
		paddingLeft: 12,
	},
	image: {
		width: 48,
		height: 48,
		borderRadius: 4,
	},
	textPrice: {
		fontSize: 14,
		color: colors.neutral500,
	},
	textPriceDiscount: {
		fontSize: 14,
		color: colors.neutral500,
		textDecorationLine: 'line-through',
	},
	action: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		alignSelf: 'flex-end',
	},
	textQuantity: {
		fontSize: 14,
		paddingHorizontal: 8,
	},
	actionIcon: {
		backgroundColor: colors.neutral100,
		borderRadius: 4,
		padding: 4,
	},
}));

export default ProductItemView;
