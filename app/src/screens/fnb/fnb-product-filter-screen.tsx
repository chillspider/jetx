import { useNavigation } from '@react-navigation/native';
import { CheckBox, makeStyles, Text, useTheme } from '@rneui/themed';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, TouchableOpacity } from 'react-native';

import { Box, ContentWrapper, Header, ScreenWrapper } from '@/components';
import { useFnbOrderContext } from '@/core/contexts/fnb-order-context';
import { BBCategoryDto } from '@/models/bitebolt/bb-category.dto';
import { AppNavigationProp } from '@/types/navigation';

const ProductFilterScreen: React.FC = () => {
	const { t } = useTranslation('pos');
	const styles = useStyles();
	const { categories, categoryId, setCategoryId } = useFnbOrderContext();

	const navigation = useNavigation<AppNavigationProp<'FnbProductFilter'>>();

	const renderItem = useCallback(
		({ item }: { item: BBCategoryDto }) => {
			return (
				<CategoryItemView
					category={item}
					isSelected={item.id === categoryId}
					toggleChecked={() => {
						if (item.id === categoryId) {
							setCategoryId(undefined);
						} else {
							setCategoryId(item.id);
						}
						navigation.goBack();
					}}
				/>
			);
		},
		[categoryId, setCategoryId, navigation],
	);

	return (
		<ScreenWrapper>
			<Header type="modal" title={t('product-filter')} />
			<ContentWrapper>
				<Box pt={12}>
					<Text style={styles.cateTitle}>{t('category')}</Text>
				</Box>
				<FlatList
					showsVerticalScrollIndicator={false}
					keyExtractor={item => item.id}
					data={categories}
					renderItem={renderItem}
				/>
			</ContentWrapper>
		</ScreenWrapper>
	);
};

type CategoryItemViewProps = {
	category: BBCategoryDto;
	isSelected: boolean;
	toggleChecked: () => void;
};

const CategoryItemView: React.FC<CategoryItemViewProps> = ({
	category,
	isSelected,
	toggleChecked,
}) => {
	const styles = useStyles();

	const {
		theme: { colors },
	} = useTheme();

	return (
		<TouchableOpacity style={styles.categoryItem} onPress={toggleChecked}>
			<Text style={styles.categoryItemText}>{category.name}</Text>
			<CheckBox
				checked={isSelected}
				onPress={toggleChecked}
				iconType="material-community"
				checkedIcon="checkbox-marked"
				uncheckedIcon="checkbox-blank-outline"
				checkedColor={colors.primary}
				containerStyle={styles.categoryItemCheckbox}
			/>
		</TouchableOpacity>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {
		flex: 1,
	},
	cateTitle: {
		fontSize: 16,
		fontWeight: '500',
	},
	categoryItem: {
		paddingHorizontal: 8,
		paddingVertical: 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	categoryItemText: {
		flex: 1,
	},
	categoryItemCheckbox: {
		padding: 0,
	},
}));

export default ProductFilterScreen;
