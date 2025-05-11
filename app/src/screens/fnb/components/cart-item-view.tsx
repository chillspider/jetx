import { makeStyles, Text } from '@rneui/themed';
import { isNotNil } from 'ramda';
import React, { useMemo } from 'react';
import { View } from 'react-native';

import { Image } from '@/components';
import { BBProductDto } from '@/models/bitebolt/bb-product.dto';
import { displayPrice } from '@/utils/format';

type CartItemViewProps = {
	data: BBProductDto;
	quantity: number;
};

const CartItemView = React.memo(({ data, quantity }: CartItemViewProps) => {
	const styles = useStyles();

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
			<Text style={styles.quantity}>x{quantity}</Text>
		</View>
	);
});

const useStyles = makeStyles(({ colors }) => ({
	container: {
		paddingVertical: 4,
		flexDirection: 'row',
		alignItems: 'center',
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
	},
	quantity: {
		fontSize: 16,
	},
}));

export default CartItemView;
