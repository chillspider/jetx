import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl } from 'react-native';

import { Box, ContentWrapper, Header, ScreenWrapper } from '@/components';
import EmptyView from '@/components/empty/empty-view';
import { Loading } from '@/components/loading';
import { PackageDto } from '@/models/package/package.dto';

import { usePackages } from '../../core/hooks/usePackages';
import PackageItemView from './package-item-view';

const PackageScreen: React.FC = () => {
	const { t } = useTranslation();

	const renderItem = useCallback(({ item }: { item: PackageDto }) => {
		return <PackageItemView data={item} />;
	}, []);

	const { data, isLoading, refetch, isRefetching } = usePackages();

	return (
		<ScreenWrapper>
			<Header type="modal" title={t('package.package_title')} />
			<ContentWrapper>
				<FlatList
					showsVerticalScrollIndicator={false}
					data={data || []}
					refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
					renderItem={renderItem}
					keyExtractor={(item, index) => `${item.guid}-${index}`}
					ItemSeparatorComponent={() => <Box height={8} />}
					ListEmptyComponent={<EmptyView content={t('package.empty')} />}
				/>
			</ContentWrapper>
			{isLoading && <Loading />}
		</ScreenWrapper>
	);
};

export default PackageScreen;
