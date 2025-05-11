import { useNavigation } from '@react-navigation/native';
import { makeStyles, Text } from '@rneui/themed';
import React, { useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { PackageDto } from '@/models/package/package.dto';
import { AppNavigationProp } from '@/types/navigation';

type Props = {
	data: PackageDto;
};

const PackageItemView: React.FC<Props> = ({ data }) => {
	const styles = useStyles();

	const navigation = useNavigation<AppNavigationProp<'Package'>>();

	const onPayPackage = useCallback(() => {
		navigation.navigate('PackagePrePayment', { package: data });
	}, [data, navigation]);

	return (
		<TouchableOpacity onPress={onPayPackage}>
			<View style={styles.itemContent}>
				<Text style={styles.name}>{data.name}</Text>
				<Text style={styles.details}>{data.details}</Text>
			</View>
		</TouchableOpacity>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	itemContent: {
		padding: 12,
		backgroundColor: colors.neutral100,
		borderRadius: 12,
	},
	name: {
		color: colors.primary,
		fontSize: 16,
	},
	details: {
		marginTop: 12,
		color: colors.neutral800,
		fontSize: 14,
	},
}));

export default PackageItemView;
