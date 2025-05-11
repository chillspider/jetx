import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { makeStyles } from '@rneui/themed';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';

import { Box } from '@/components';
import EmptyView from '@/components/empty/empty-view';
import { SupportDto } from '@/models/support/support.dto';
import { AppNavigationProp } from '@/types/navigation';

import SupportHistoryItem from '../components/support-history-item';
import { useSupports } from '../hooks/useSupport';

const SupportHistoryScreen: React.FC = () => {
	const styles = useStyles();

	const { t } = useTranslation();

	const { data, refetch, hasNextPage, fetchNextPage, isRefetching } = useSupports({
		variables: { order: 'DESC' },
	});

	const { navigate } = useNavigation<AppNavigationProp<'Support'>>();

	useFocusEffect(
		React.useCallback(() => {
			refetch();
		}, [refetch]),
	);

	const supports = useMemo(() => {
		return data?.pages.flatMap(page => page.data || []) ?? [];
	}, [data]);

	const renderItem = useCallback(
		({ item, index }: { item: SupportDto; index: number }) => {
			return (
				<Pressable
					onPress={() => {
						navigate('SupportDetail', { id: item.id });
					}}
				>
					<SupportHistoryItem item={item} index={index} />
				</Pressable>
			);
		},
		[navigate],
	);

	return (
		<View style={styles.container}>
			<FlatList
				showsVerticalScrollIndicator={false}
				data={supports}
				renderItem={renderItem}
				refreshControl={<RefreshControl onRefresh={refetch} refreshing={isRefetching} />}
				keyExtractor={(item, index) => `${item.id}-${index}`}
				ItemSeparatorComponent={() => <Box height={8} />}
				onEndReachedThreshold={0.5}
				onEndReached={() => {
					if (hasNextPage) {
						fetchNextPage();
					}
				}}
				ListEmptyComponent={<EmptyView content={t('support.empty')} />}
			/>
		</View>
	);
};

const useStyles = makeStyles(() => ({
	container: {
		flex: 1,
	},
}));

export default SupportHistoryScreen;
