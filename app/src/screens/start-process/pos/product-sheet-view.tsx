import BottomSheet, { BottomSheetFlashList } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import { Button, Icon, Input, makeStyles, Text, useTheme } from '@rneui/themed';
import { isEmpty, isNotNil } from 'ramda';
import React, { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
	Extrapolation,
	interpolate,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import IcCart from '@/assets/svgs/pos/ic_cart.svg';
import IcClose from '@/assets/svgs/pos/ic_input_clear.svg';
import IcSearch from '@/assets/svgs/pos/ic_search.svg';
import { Box } from '@/components';
import EmptyView from '@/components/empty/empty-view';
import { useFnbOrderContext } from '@/core/contexts/fnb-order-context';
import { BBProductDto } from '@/models/bitebolt/bb-product.dto';
import { AppNavigationProp } from '@/types/navigation';

import ProductItemView from './product-item-view';

const ProductSheetView = () => {
	const { t } = useTranslation('pos');
	const styles = useStyles();
	const productSheetRef = useRef<BottomSheet>(null);

	const navigation = useNavigation<AppNavigationProp<'StartProcess'>>();

	const {
		theme: { colors, spacing },
	} = useTheme();

	const snapPoints = useMemo(() => ['44%', '100%'], []);
	const animatedIndex = useSharedValue(0);

	const isSheetExpanded = useDerivedValue(() => {
		return animatedIndex.value === 1;
	}, [animatedIndex]);

	const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();

	const gotoCart = useCallback(() => {
		navigation.navigate('FnbCart');
	}, [navigation]);

	const headerAnimatedStyle = useAnimatedStyle(() => {
		const marginTop = interpolate(
			animatedIndex.value,
			[0, 1],
			[6, Math.min(topInset, 24)],
			Extrapolation.CLAMP,
		);

		return {
			marginTop,
		};
	});

	const renderHeader = useCallback(() => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const backButtonStyle = useAnimatedStyle(() => ({
			opacity: interpolate(animatedIndex.value, [0, 1], [0, 1], Extrapolation.CLAMP),
		}));

		return (
			<Animated.View style={[styles.header, headerAnimatedStyle]}>
				<Animated.View style={backButtonStyle}>
					<TouchableOpacity
						onPress={() => {
							productSheetRef.current?.snapToIndex(0);
						}}
					>
						<Icon style={styles.backIcon} name="arrow-left" type="feather" size={24} hitSlop={8} />
					</TouchableOpacity>
				</Animated.View>
				<View style={styles.headerTitleContainer}>
					<Text style={styles.headerTitle}>{t('title')}</Text>
				</View>
				<CartIconView onPress={gotoCart} />
			</Animated.View>
		);
	}, [styles, headerAnimatedStyle, t, gotoCart, animatedIndex.value]);

	const { items } = useFnbOrderContext();

	const renderHandleComponent = useCallback(
		() => {
			// eslint-disable-next-line react-hooks/rules-of-hooks
			const handleStyle = useAnimatedStyle(() => ({
				//	display: isSheetExpanded.value ? 'none' : 'flex',
				opacity: interpolate(animatedIndex.value, [0, 1], [1, 0], Extrapolation.CLAMP),
			}));

			return (
				<Animated.View style={handleStyle}>
					<Box
						mb={spacing.lg}
						mt={spacing.md}
						height={5}
						width={60}
						alignSelf="center"
						backgroundColor={colors.neutral300}
						borderRadius={spacing.xs}
					/>
				</Animated.View>
			);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[isSheetExpanded.value],
	);

	return (
		<View style={styles.content}>
			<BottomSheet
				ref={productSheetRef}
				index={0}
				snapPoints={snapPoints}
				enablePanDownToClose={false}
				keyboardBehavior="extend"
				animatedIndex={animatedIndex}
				handleComponent={renderHandleComponent}
				enableDynamicSizing={false}
			>
				<View
					style={styles.bottomSheetContent}
					onStartShouldSetResponder={() => {
						Keyboard.dismiss();
						return false;
					}}
				>
					{renderHeader()}
					<ProductFilterView sheetRef={productSheetRef} />
					<ProductListView />
				</View>
			</BottomSheet>
			<View style={[styles.buttonView, { paddingBottom: bottomInset + 12 }]}>
				<Button title={t('title')} disabled={isEmpty(items)} onPress={gotoCart} />
			</View>
		</View>
	);
};

const ProductFilterView = React.memo(({ sheetRef }: { sheetRef: React.RefObject<BottomSheet> }) => {
	const navigation = useNavigation<AppNavigationProp<'FnbProductFilter'>>();
	const { t } = useTranslation('pos');
	const {
		theme: { colors },
	} = useTheme();

	const { setFilter, categoryId, filter } = useFnbOrderContext();

	const inputRef = useRef<TextInput>(null);

	const styles = useStyles();

	const debouncedSetFilter = useCallback(() => {
		let timeoutId: NodeJS.Timeout;

		return (text: string) => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				setFilter(text);
			}, 500);
		};
	}, [setFilter])();

	const handleFilter = useCallback(() => {
		navigation.navigate('FnbProductFilter');
	}, [navigation]);

	const hasCategory = useMemo(() => isNotNil(categoryId), [categoryId]);

	const renderRightIcon = useCallback(() => {
		if (filter) {
			return (
				<TouchableOpacity
					hitSlop={8}
					onPress={() => {
						inputRef.current?.clear();
						setFilter('');
					}}
				>
					<IcClose />
				</TouchableOpacity>
			);
		}
		return undefined;
	}, [filter, setFilter]);

	return (
		<Animated.View style={[styles.filterView]}>
			<Input
				placeholder={t('search')}
				ref={inputRef}
				placeholderTextColor={colors.neutral400}
				leftIcon={<IcSearch />}
				rightIcon={renderRightIcon()}
				inputContainerStyle={styles.inputContainer}
				containerStyle={styles.containerStyle}
				style={styles.input}
				autoCapitalize="none"
				onChangeText={debouncedSetFilter}
				onFocus={() => {
					sheetRef.current?.snapToIndex(1);
				}}
			/>
			<TouchableOpacity style={styles.filterButton} onPress={handleFilter}>
				<Text body2>{t('filter')}</Text>
				{hasCategory && (
					<View style={styles.cartCount}>
						<Text style={styles.cartText}>1</Text>
					</View>
				)}
			</TouchableOpacity>
		</Animated.View>
	);
});

const ProductListView = React.memo(() => {
	const styles = useStyles();

	const { products } = useFnbOrderContext();

	const renderItem = useCallback(({ item }: { item: BBProductDto; index: number }) => {
		return <ProductItemView data={item} />;
	}, []);

	const { t } = useTranslation('pos');

	return (
		<BottomSheetFlashList
			keyboardDismissMode="on-drag"
			keyboardShouldPersistTaps="never"
			showsVerticalScrollIndicator={false}
			contentContainerStyle={styles.containerStyle}
			keyExtractor={(i, index) => `${i.id}-${index}`}
			data={products}
			renderItem={renderItem}
			ItemSeparatorComponent={() => <Box height={8} />}
			ListFooterComponent={<Box height={100} />}
			ListEmptyComponent={<EmptyView content={t('product-not-found')} />}
			estimatedItemSize={64}
		/>
	);
});

const CartIconView = React.memo(({ onPress }: { onPress: () => void }) => {
	const styles = useStyles();

	const { items } = useFnbOrderContext();

	const totalQuantity = useMemo(() => {
		const { length } = items;
		if (length > 9) return '9+';

		return length;
	}, [items]);

	return (
		<TouchableOpacity style={styles.headerIcon} onPress={onPress} disabled={isEmpty(items)}>
			<IcCart />
			{!isEmpty(items) && (
				<View style={styles.cartCount}>
					<Text style={styles.cartText}>{totalQuantity}</Text>
				</View>
			)}
		</TouchableOpacity>
	);
});

const useStyles = makeStyles(({ colors }) => ({
	content: {
		...StyleSheet.absoluteFillObject,
		pointerEvents: 'box-none',
	},
	sheetContent: {
		paddingHorizontal: 12,
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		justifyContent: 'center',
	},
	headerTitle: {
		fontSize: 16,
		fontWeight: '500',
	},
	headerTitleContainer: {
		flex: 1,
		alignItems: 'center',
	},
	headerIcon: {},
	scrollView: {
		flex: 1,
	},
	scrollViewContentContainer: {
		paddingHorizontal: 16,
		paddingTop: 12,
	},
	textAlign: {
		textAlign: 'center',
	},
	backIcon: {},
	buttonView: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: colors.white,
		paddingHorizontal: 16,
		paddingTop: 12,
	},
	cartCount: {
		position: 'absolute',
		backgroundColor: colors.red,
		width: 20,
		height: 20,
		borderRadius: 20,
		right: -10,
		top: -10,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cartText: {
		fontSize: 10,
		color: colors.white,
		textAlign: 'center',
	},
	filterView: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		marginTop: 12,
	},
	inputContainer: {
		borderWidth: 1,
		borderColor: colors.neutral200,
		borderRadius: 8,
		paddingLeft: 16,
		paddingRight: 4,
		paddingVertical: 2,
		padding: 0,
		maxHeight: 40,
	},
	containerStyle: {
		paddingHorizontal: 12,
		flex: 1,
	},
	input: {
		color: colors.neutral800,
		fontSize: 16,
	},
	filterButton: {
		backgroundColor: colors.neutral100,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		height: 40,
		marginLeft: 8,
	},
	bottomSheetContent: {
		flex: 1,
	},
}));

export default ProductSheetView;
