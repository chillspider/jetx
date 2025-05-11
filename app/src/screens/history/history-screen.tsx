import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl } from 'react-native';

import { Header, ScreenWrapper } from '@/components';
import EmptyView from '@/components/empty/empty-view';
import { useRefreshOnFocus } from '@/core/hooks/useRefreshOnFocus';
import { OrderDto, OrderTypeEnum } from '@/models/order/order.dto';
import { AppNavigationProp } from '@/types/navigation';

import { useOrderHistory } from '../../core/hooks/useOrderHistory';
import HistoryItem from './components/history-item-view';
import PackageItem from './components/package-item-view';

const HistoryScreen: React.FC = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<AppNavigationProp<'History'>>();

	const { data, fetchNextPage, hasNextPage, refetch, isRefetching } = useOrderHistory({
		variables: {
			order: 'DESC',
		},
	});

	useRefreshOnFocus(refetch);

	const orders = useMemo(() => {
		return data?.pages.flatMap(page => page.data!) ?? [];
	}, [data]);

	const renderItem = useCallback(
		({ item, index }: { item: OrderDto; index: number }) => {
			if (item.type === OrderTypeEnum.PACKAGE) {
				return <PackageItem data={item} index={index} />;
			}

			return (
				<Pressable
					onPress={() => {
						navigation.navigate('Processing', {
							orderId: item.id,
						});
					}}
				>
					<HistoryItem data={item} index={index} />
				</Pressable>
			);
		},
		[navigation],
	);

	return (
		<ScreenWrapper>
			<Header title={t('profile.historySetting')} />
			<FlatList
				showsVerticalScrollIndicator={false}
				data={orders}
				renderItem={renderItem}
				refreshControl={<RefreshControl onRefresh={refetch} refreshing={isRefetching} />}
				keyExtractor={(item, index) => `${item.id}-${index}`}
				onEndReachedThreshold={0.5}
				onEndReached={() => {
					if (hasNextPage) {
						fetchNextPage();
					}
				}}
				ListEmptyComponent={<EmptyView content={t('orderHistoryEmpty')} />}
			/>
		</ScreenWrapper>
	);
};

export default HistoryScreen;
