import { useNavigation, useRoute } from '@react-navigation/native';
import { Button, makeStyles, Text, useTheme } from '@rneui/themed';
import { isNotNil } from 'ramda';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	AppState,
	AppStateStatus,
	FlatList,
	Linking,
	Pressable,
	RefreshControl,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, ContentWrapper, Header, ScreenWrapper } from '@/components';
import EmptyView from '@/components/empty/empty-view';
import { useRefreshOnFocus } from '@/core/hooks/useRefreshOnFocus';
import { useServerTime } from '@/core/hooks/useServerTime';
import { useVoucherExcludedReasons, useVouchers } from '@/core/hooks/useVouchers';
import { isVoucherEnabled, VoucherDto } from '@/models/order/voucher.dto';
import { AppNavigationProp, AppRouteProp } from '@/types/navigation';
import { timeNow } from '@/utils/date-utils';

import VoucherItemView from './components/voucher-item';

const VoucherListScreen: React.FC = () => {
	const {
		params: { orderValue, onConfirm, select, stationId, deviceId, washMode },
	} = useRoute<AppRouteProp<'OrderVoucher'>>();

	const navigation = useNavigation<AppNavigationProp<'OrderVoucher'>>();

	const {
		theme: { colors },
	} = useTheme();
	const styles = useStyles();

	const { t } = useTranslation();

	const [selectedVoucher, setSelectedVoucher] = useState<VoucherDto | undefined>(select);

	const { data, refetch, hasNextPage, fetchNextPage, isRefetching } = useVouchers({
		variables: { orderValue },
	});

	const { data: voucherExcludedReasons, refetch: refetchVoucherExcludedReasons } =
		useVoucherExcludedReasons();

	const vouchers = useMemo(() => {
		return data?.pages.flatMap(page => page.data || []) ?? [];
	}, [data]);

	const { data: serverTime, refetch: refetchServerTime } = useServerTime();

	useRefreshOnFocus(refetchServerTime);
	useRefreshOnFocus(refetchVoucherExcludedReasons);

	const hasExcludedReasons = useMemo(() => {
		return isNotNil(voucherExcludedReasons) && voucherExcludedReasons.isExcluded === true;
	}, [voucherExcludedReasons]);

	const onRedeemAccept = useCallback(
		(voucher?: VoucherDto) => {
			if (voucher) {
				refetch();
			}
		},
		[refetch],
	);

	const navigateScanVoucherQR = useCallback(() => {
		navigation.navigate('ScanVoucherCode', { onBack: onRedeemAccept });
	}, [navigation, onRedeemAccept]);

	useEffect(() => {
		let interval: NodeJS.Timeout;

		const syncServerTime = async () => {
			try {
				await refetchServerTime();
			} catch (error) {
				console.warn('Failed to sync server time:', error);
			}
		};

		const handleAppStateChange = (nextAppState: AppStateStatus) => {
			if (nextAppState === 'active') {
				syncServerTime();
			}
		};

		const subscription = AppState.addEventListener('change', handleAppStateChange);

		syncServerTime();

		// eslint-disable-next-line prefer-const
		interval = setInterval(syncServerTime, 30000);

		return () => {
			clearInterval(interval);
			subscription.remove();
		};
	}, [refetchServerTime]);

	const renderItem = useCallback(
		({ item }: { item: VoucherDto }) => {
			const disabled = !isVoucherEnabled(
				item,
				serverTime || timeNow.toDate(),
				deviceId,
				stationId,
				washMode,
			);

			return (
				<Pressable
					disabled={disabled}
					onPress={() => {
						if (selectedVoucher?.id === item.id) {
							setSelectedVoucher(undefined);
						} else {
							setSelectedVoucher(item);
						}
					}}
				>
					<VoucherItemView
						data={item}
						selectable
						disabled={disabled}
						isSelected={isNotNil(selectedVoucher) && selectedVoucher.id === item.id}
					/>
				</Pressable>
			);
		},

		[serverTime, deviceId, selectedVoucher, stationId, washMode],
	);

	const { bottom: bottomSafe } = useSafeAreaInsets();

	const onConfirmVoucherChanged = useCallback(() => {
		if (isNotNil(onConfirm)) {
			onConfirm(selectedVoucher);
		}
		navigation.goBack();
	}, [navigation, onConfirm, selectedVoucher]);

	const hasChanged = useMemo(() => {
		return select?.id !== selectedVoucher?.id;
	}, [select?.id, selectedVoucher?.id]);

	const handleLinkPress = useCallback((url: string) => {
		Linking.canOpenURL(url)
			.then(supported => {
				if (supported) {
					Linking.openURL(url);
				}
			})
			.catch(err => console.error('Open Link error:', err));
	}, []);

	const renderListHeader = useCallback(() => {
		return (
			<View>
				<Box height={24} />
				<Button
					type="outline"
					titleStyle={{ color: colors.primary }}
					onPress={navigateScanVoucherQR}
				>
					{t('addRedeemCode')}
				</Button>
				<Box height={24} />
				{hasExcludedReasons && (
					<ReasonText
						content={voucherExcludedReasons?.reason || ''}
						onLinkPress={handleLinkPress}
					/>
				)}
			</View>
		);
	}, [
		colors.primary,
		handleLinkPress,
		hasExcludedReasons,
		navigateScanVoucherQR,
		t,
		voucherExcludedReasons?.reason,
	]);

	return (
		<ScreenWrapper>
			<Header type="modal" title={t('voucherTitle')} />
			<ContentWrapper>
				<FlatList
					showsVerticalScrollIndicator={false}
					data={vouchers}
					renderItem={renderItem}
					refreshControl={<RefreshControl onRefresh={refetch} refreshing={isRefetching} />}
					ListHeaderComponent={renderListHeader}
					keyExtractor={(item, index) => `${item.id}-${index}`}
					ItemSeparatorComponent={() => <Box height={8} />}
					onEndReachedThreshold={0.5}
					onEndReached={() => {
						if (hasNextPage) {
							fetchNextPage();
						}
					}}
					ListEmptyComponent={<EmptyView content={t('voucherEmpty')} />}
				/>
				<View style={[styles.bottomView, { paddingBottom: bottomSafe + 16 }]}>
					<Button title={t('complete')} disabled={!hasChanged} onPress={onConfirmVoucherChanged} />
				</View>
			</ContentWrapper>
		</ScreenWrapper>
	);
};

const URLRegex = /(https?:\/\/[^\s]+)/g;
type ReasonProps = {
	content: string;
	onLinkPress?: (url: string) => void;
};

const ReasonText: React.FC<ReasonProps> = ({ content, onLinkPress }) => {
	const parts = content.split(URLRegex);
	const styles = useStyles();

	return (
		<View style={styles.reasonContainer}>
			<Text style={styles.reasonText} selectable>
				{parts.map((part, index) => {
					if (URLRegex.test(part)) {
						return (
							<Text key={index} style={styles.reasonTextLink} onPress={() => onLinkPress?.(part)}>
								{part}
							</Text>
						);
					}
					return part;
				})}
			</Text>
		</View>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {},
	content: {
		flex: 1,
		paddingTop: 16,
	},
	bottomView: {
		paddingHorizontal: 16,
		paddingTop: 16,
		backgroundColor: colors.white,
	},
	reasonTextLink: {
		fontSize: 14,
		color: colors.blue,
		textDecorationLine: 'underline',
	},
	reasonText: {
		color: colors.red,
		fontSize: 14,
	},
	reasonContainer: {
		paddingVertical: 16,
		backgroundColor: colors.white,
	},
}));

export default VoucherListScreen;
