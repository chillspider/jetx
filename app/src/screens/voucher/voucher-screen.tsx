import { useNavigation } from '@react-navigation/native';
import { Button, useTheme } from '@rneui/themed';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, ContentWrapper, Header, ScreenWrapper } from '@/components';
import EmptyView from '@/components/empty/empty-view';
import { useVouchers } from '@/core/hooks/useVouchers';
import { VoucherDto } from '@/models/order/voucher.dto';
import { AppNavigationProp } from '@/types/navigation';

import VoucherItemView from '../start-process/components/voucher-item';

const VoucherScreen: React.FC = () => {
	const { navigate } = useNavigation<AppNavigationProp<'Voucher'>>();

	const {
		theme: { colors },
	} = useTheme();
	const { bottom: bottomInset } = useSafeAreaInsets();

	const { t } = useTranslation();

	const { data, refetch, hasNextPage, fetchNextPage, isRefetching } = useVouchers({
		variables: { isShowExpiredVouchers: true },
	});

	const vouchers = useMemo(() => {
		return data?.pages.flatMap(page => page.data || []) ?? [];
	}, [data]);

	const renderItem = useCallback(({ item }: { item: VoucherDto }) => {
		return <VoucherItemView data={item} />;
	}, []);

	const onRedeemAccept = useCallback(
		(voucher?: VoucherDto) => {
			if (voucher) {
				refetch();
			}
		},
		[refetch],
	);

	const navigateScanVoucherQR = useCallback(() => {
		navigate('ScanVoucherCode', { onBack: onRedeemAccept });
	}, [navigate, onRedeemAccept]);

	return (
		<ScreenWrapper>
			<Header title={t('profile.voucherSetting')} />
			<ContentWrapper>
				<Box height={24} />
				<Button
					type="outline"
					titleStyle={{ color: colors.primary }}
					onPress={navigateScanVoucherQR}
				>
					{t('addRedeemCode')}
				</Button>
				<Box height={24} />
				<FlatList
					showsVerticalScrollIndicator={false}
					data={vouchers}
					renderItem={renderItem}
					refreshControl={<RefreshControl onRefresh={refetch} refreshing={isRefetching} />}
					keyExtractor={(item, index) => `${item.id}-${index}`}
					ItemSeparatorComponent={() => <Box height={8} />}
					ListFooterComponent={() => <Box height={bottomInset + 12} />}
					onEndReachedThreshold={0.5}
					onEndReached={() => {
						if (hasNextPage) {
							fetchNextPage();
						}
					}}
					ListEmptyComponent={<EmptyView content={t('voucherEmpty')} />}
				/>
			</ContentWrapper>
		</ScreenWrapper>
	);
};

export default VoucherScreen;
