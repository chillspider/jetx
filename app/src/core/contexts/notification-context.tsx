import messaging from '@react-native-firebase/messaging';
import { isEmpty, isNil } from 'ramda';
import {
	createContext,
	PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { NotificationDto } from '@/models/notification/notification.dto';
import notificationApi from '@/services/notification/notification-services';

import { useNotification } from '../hooks/notifications/useNotification';

type NotificationContextType = {
	notifications: NotificationDto[];
	totalUnread: number;
	readNotification: (id: string, isRead: boolean) => void;
	readAllNotifications: () => void;
	deleteNotification: (id: string) => void;
	refetch: () => void;
	fetchNextPage: () => void;
	hasNextPage: boolean;
	isRefetching: boolean;
	isLoading: boolean;
};

export const NotificationContext = createContext<NotificationContextType | string>(
	'useNotificationContext should be used inside NotificationProvider',
);

export const NotificationProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);

	const { data, refetch, fetchNextPage, hasNextPage, isRefetching } = useNotification({
		variables: { order: 'DESC' },
	});

	useEffect(() => {
		const unsubscribe = messaging().onMessage(() => {
			refetch();
		});

		return unsubscribe;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const notifications = useMemo(() => {
		return data?.pages.flatMap(page => page.data || []) || [];
	}, [data]);

	const totalUnread = useMemo(() => {
		if (isNil(data?.pages) || isEmpty(data?.pages)) return 0;
		return data?.pages[0].totalUnread || 0;
	}, [data]);

	const readNotification = useCallback(
		async (id: string, isRead: boolean) => {
			try {
				setIsLoading(true);
				const res = await notificationApi.readNotification(id, isRead);
				if (res.isSuccess) {
					refetch();
				}
			} catch (err) {
				console.log(err);
				Toast.show({
					text1: t('notificationTitle'),
					text2: t('networkError'),
					type: 'error',
				});
			} finally {
				setIsLoading(false);
			}
		},
		[refetch, t],
	);

	const readAllNotifications = useCallback(async () => {
		try {
			setIsLoading(true);
			const res = await notificationApi.readAllNotifications();
			if (res.isSuccess) {
				refetch();
			}
		} catch (err) {
			console.log(err);
			Toast.show({
				text1: t('notificationTitle'),
				text2: t('networkError'),
				type: 'error',
			});
		} finally {
			setIsLoading(false);
		}
	}, [refetch, t]);

	const deleteNotification = useCallback(
		async (id: string) => {
			try {
				setIsLoading(true);
				const res = await notificationApi.deleteNotification(id);
				if (res.isSuccess) {
					refetch();
				}
			} catch (err) {
				console.log(err);
				Toast.show({
					text1: t('notificationTitle'),
					text2: t('networkError'),
					type: 'error',
				});
			} finally {
				setIsLoading(false);
			}
		},
		[refetch, t],
	);

	const value: NotificationContextType = {
		notifications,
		totalUnread,
		readNotification,
		readAllNotifications,
		deleteNotification,
		refetch,
		fetchNextPage,
		hasNextPage,
		isRefetching,
		isLoading,
	};

	return <NotificationContext.Provider {...{ value, children }} />;
};

export const useNotificationContext = () => {
	const c = useContext(NotificationContext);

	if (typeof c === 'string') {
		throw Error(c);
	}

	return c;
};
