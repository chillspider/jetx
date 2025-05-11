/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-shadow */
// eslint-disable-next-line simple-import-sort/imports
import { useNavigation } from '@react-navigation/native';
import { makeStyles, Text } from '@rneui/themed';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, TouchableOpacity, View } from 'react-native';

import OptionIcon from '@/assets/svgs/ic_option.svg';
import MarkAsReadIcon from '@/assets/svgs/ic_read_all.svg';
import { Box, ContentWrapper, Header, ScreenWrapper, useModal } from '@/components';
import EmptyView from '@/components/empty/empty-view';
import { Loading } from '@/components/loading';
import { Option, Options } from '@/components/select/select';
import { useNotificationContext } from '@/core/contexts/notification-context';
import { useRefreshOnFocus } from '@/core/hooks/useRefreshOnFocus';
import { NotificationOrderData } from '@/models/notification/notification-order.dto';
import { NotificationDto } from '@/models/notification/notification.dto';
import { AppStackParamList } from '@/types/navigation';
import { formatDate } from '@/utils/date-utils';

const NotificationScreen: React.FC = () => {
	const navigation = useNavigation<any>();
	const {
		notifications,
		refetch,
		fetchNextPage,
		hasNextPage,
		isRefetching,
		totalUnread,
		isLoading,
		readAllNotifications,
		readNotification,
		deleteNotification,
	} = useNotificationContext();

	const modal = useModal();
	const { t } = useTranslation();
	const [selectedNotification, setSelectedNotification] = useState<NotificationDto | null>(null);

	const onNotificationItemPress = useCallback(
		(notification: NotificationDto) => {
			if (!notification.isRead) {
				readNotification(notification.id, true);
			}
			const { deepLink } = notification;
			if (!deepLink) return;

			try {
				const simpleRoutes = [
					'Account',
					'History',
					'News',
					'Support',
					'Voucher',
					'Package',
					'Card',
					'Referral',
					'About',
					'EditProfile',
					'TermOfUse',
					'CreateVehicle',
					'CreatePaymentCard',
				] as const;

				const route = simpleRoutes.find(route => route.toLowerCase() === deepLink.toLowerCase());
				if (route) {
					navigation.navigate(route as keyof AppStackParamList);
				}

				if (deepLink.includes('order')) {
					console.log(notification.data);
					if (notification.data) {
						const notiData: NotificationOrderData = JSON.parse(JSON.stringify(notification.data));
						if (notiData.id) {
							navigation.navigate('Processing', { orderId: notiData.id });
						}
					}
				}
				if (deepLink.includes('support')) {
					if (notification.data) {
						const notiData: NotificationOrderData = JSON.parse(JSON.stringify(notification.data));
						if (notiData.id) {
							navigation.navigate('SupportDetail', { id: notiData.id });
						} else {
							navigation.navigate('Support');
						}
					} else {
						navigation.navigate('Support');
					}
				}
			} catch (err) {
				console.log(err);
			}
		},
		[navigation, readNotification],
	);

	const renderItem = useCallback(
		({ item }: { item: NotificationDto }) => {
			return (
				<NotificationItem
					notification={item}
					onOptionPress={() => {
						setSelectedNotification(item);
						modal.present();
					}}
					onPress={() => onNotificationItemPress(item)}
				/>
			);
		},
		[modal, onNotificationItemPress],
	);

	const headerActionIcon = useMemo(() => {
		if (totalUnread > 0) {
			return (
				<TouchableOpacity onPress={readAllNotifications}>
					<MarkAsReadIcon />
				</TouchableOpacity>
			);
		}
		return <Box />;
	}, [totalUnread, readAllNotifications]);

	const options: Option[] = useMemo(() => {
		if (selectedNotification) {
			const { isRead = false } = selectedNotification;
			if (isRead) {
				return [
					{
						label: t('notification.delete'),
						value: 'delete',
					},
				];
			}
			return [
				{
					label: t('notification.read'),
					value: 'read',
				},
				{
					label: t('notification.delete'),
					value: 'delete',
				},
			];
		}
		return [];
	}, [selectedNotification, t]);

	const onOptionSelected = useCallback(
		(option: Option) => {
			modal.dismiss();
			if (!selectedNotification) return;
			const { id } = selectedNotification;
			if (option.value === 'read') {
				readNotification(id, true);
			} else {
				deleteNotification(id);
			}
			setSelectedNotification(null);
		},
		[deleteNotification, modal, readNotification, selectedNotification],
	);

	useRefreshOnFocus(refetch);

	return (
		<ScreenWrapper>
			<Header type="modal" title={t('notification.title')} rightComponent={headerActionIcon} />
			<ContentWrapper>
				<FlashList
					showsVerticalScrollIndicator={false}
					data={notifications}
					renderItem={renderItem}
					refreshControl={<RefreshControl onRefresh={refetch} refreshing={isRefetching} />}
					keyExtractor={item => item.id}
					ItemSeparatorComponent={() => <Box height={12} />}
					onEndReachedThreshold={0.5}
					estimatedItemSize={150}
					onEndReached={() => {
						if (hasNextPage) {
							fetchNextPage();
						}
					}}
					ListEmptyComponent={<EmptyView content={t('notification.empty')} />}
				/>
			</ContentWrapper>
			<Options ref={modal.ref} options={options} onSelect={onOptionSelected} />
			{isLoading && <Loading />}
		</ScreenWrapper>
	);
};

type NotificationItemProps = {
	notification: NotificationDto;
	onOptionPress?: () => void;
	onPress?: () => void;
};

const NotificationItem: React.FC<NotificationItemProps> = ({
	notification,
	onOptionPress,
	onPress,
}) => {
	const { title, content, createdAt, isRead = false } = notification;
	const styles = useStyles({ isRead });

	return (
		<TouchableOpacity style={styles.container} onPress={onPress}>
			<View style={styles.header}>
				{!isRead && <View style={styles.unreadDot} />}
				<Box flex={1}>
					<Text style={styles.time}>
						{formatDate(createdAt || new Date(), 'HH:mm - DD/MM/YYYY ')}
					</Text>
				</Box>
				<TouchableOpacity hitSlop={8} style={styles.moreIcon} onPress={onOptionPress}>
					<OptionIcon />
				</TouchableOpacity>
			</View>
			<Box height={8} />
			<Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
				{title}
			</Text>
			<Box height={8} />
			<Text style={styles.content} numberOfLines={3} ellipsizeMode="tail">
				{content}
			</Text>
		</TouchableOpacity>
	);
};

const useStyles = makeStyles(({ colors }, { isRead }: { isRead: boolean }) => ({
	container: {
		padding: 16,
		backgroundColor: isRead ? colors.white : colors.neutral100,
		borderRadius: 8,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	unreadDot: {
		width: 8,
		height: 8,
		backgroundColor: colors.primary,
		borderRadius: 4,
		marginRight: 8,
	},
	time: {
		fontSize: 14,
		fontWeight: '400',
		color: colors.neutral400,
	},
	content: {
		fontSize: 14,
		fontWeight: '400',
		color: isRead ? colors.neutral500 : colors.neutral800,
	},
	title: {
		fontSize: 16,
		fontWeight: '400',
		color: isRead ? colors.neutral500 : colors.neutral800,
	},
	moreIcon: {
		width: 24,
		height: 24,
	},
}));

export default NotificationScreen;
