/* eslint-disable react-native/no-inline-styles */
import Clipboard from '@react-native-clipboard/clipboard';
import { useRoute } from '@react-navigation/native';
import { makeStyles, Text, useTheme } from '@rneui/themed';
import CryptoJS from 'crypto-js';
import { isNotEmpty, isNotNil } from 'ramda';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Box, Header, Image, ScreenWrapper } from '@/components';
import { Loading } from '@/components/loading';
import { useAuth } from '@/core/store/auth';
import { Env } from '@/env';
import { SupportStatus } from '@/models/support/support-status.enum';
import { AppRouteProp } from '@/types/navigation';
import { getPublicMediaUrl } from '@/utils/resources';

import ChatWootWidget from './components/chatwoot/app';
import FeedbackTextRender from './components/feedback-content-text';
import SupportCenterView from './components/support-center';
import { useSupportDetail } from './hooks/useSupportDetail';

const SupportTicketDetailScreen: React.FC = () => {
	const { t, i18n } = useTranslation();
	const {
		params: { id },
	} = useRoute<AppRouteProp<'SupportDetail'>>();

	const [isShowLiveChat, setShowLiveChat] = useState<boolean>(false);

	const { user } = useAuth();

	const { data, isLoading } = useSupportDetail({ variables: { id } });

	const styles = useStyles();

	const {
		theme: { colors },
	} = useTheme();

	const statusColor = useMemo(() => {
		switch (data?.status) {
			case SupportStatus.OPEN:
				return colors.yellow;
			case SupportStatus.PROCESSING:
				return colors.green;
			case SupportStatus.COMPLETED:
				return colors.blue;
			default:
				return colors.neutral500;
		}
	}, [colors, data]);

	const statusString = useMemo(() => {
		switch (data?.status) {
			case SupportStatus.OPEN:
				return t('support.status.new');
			case SupportStatus.PROCESSING:
				return t('support.status.processing');
			case SupportStatus.COMPLETED:
				return t('support.status.completed');
			default:
				return '';
		}
	}, [t, data]);

	const handleLinkPress = (url: string) => {
		Linking.canOpenURL(url)
			.then(supported => {
				if (supported) {
					Linking.openURL(url);
				}
			})
			.catch(err => console.error('Open Link error:', err));
	};

	const canShowLiveChat = useMemo(() => {
		return data?.status === SupportStatus.PROCESSING;
	}, [data]);

	const identifierHash = useMemo(() => {
		return CryptoJS.HmacSHA256(user?.email || '', Env.CHATWOOT_HMAC_KEY).toString(CryptoJS.enc.Hex);
	}, [user]);

	const onClipboardPress = (value: string) => {
		Clipboard.setString(value);
	};

	return (
		<ScreenWrapper>
			<Header type="modal" title={t('support.history')} />
			<ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
				{!!data && (
					<>
						<Box height={12} />
						<Box flexDirection="row">
							<Box flex={3}>
								<Text body2 style={styles.title}>{`${t('support.email')}`}</Text>
							</Box>
							<Box flex={7}>
								<Text body2>{data.customerEmail || ''}</Text>
							</Box>
						</Box>
						<Box height={12} />
						<Box flexDirection="row">
							<Box flex={3}>
								<Text body2 style={styles.title}>
									{t('support.name')}
								</Text>
							</Box>
							<Box flex={7}>
								<Text body2>{data.customerName || ''}</Text>
							</Box>
						</Box>
						<Box height={12} />
						<Box flexDirection="row">
							<Box flex={3}>
								<Text body2 style={styles.title}>
									{t('support.phoneNumber')}
								</Text>
							</Box>
							<Box flex={7}>
								<Text body2>{data.customerPhone || ''}</Text>
							</Box>
						</Box>
						<Box height={12} />
						<Box flexDirection="row">
							<Box flex={3}>
								<Text body2 style={styles.title}>
									{t('support.title')}
								</Text>
							</Box>
							<Box flex={7}>
								<Text body2>{data.title || ''}</Text>
							</Box>
						</Box>
						<Box height={12} />
						<Box flexDirection="row">
							<Box flex={3}>
								<Text body2 style={styles.title}>
									{t('support.content')}
								</Text>
							</Box>
							<Box flex={7}>
								<Text body2>{data.content || ''}</Text>
							</Box>
						</Box>
						{isNotEmpty(data.images || []) && (
							<>
								<Box height={12} />
								<Text style={styles.title} body2>
									{t('support.image')}:
								</Text>
								<Box height={8} />
								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									style={styles.imageScrollView}
								>
									{(data.images || []).map((image, index) => (
										<Image
											style={styles.image}
											key={index}
											source={{ uri: getPublicMediaUrl(image || '') }}
										/>
									))}
								</ScrollView>
							</>
						)}
						<Box height={12} />
						<Box flexDirection="row">
							<Box flex={3}>
								<Text style={styles.title} body2>
									{t('support.statusTitle')}
								</Text>
							</Box>
							<Box flex={7}>
								<Text body2 style={{ color: statusColor, fontSize: 14 }}>
									{statusString}
								</Text>
							</Box>
						</Box>
						{isNotNil(data.data?.supportResponse) && isNotEmpty(data.data?.supportResponse) && (
							<>
								<Box height={12} />
								<Text style={styles.title} body2>
									{t('support.responseTitle')}:
								</Text>
								<View style={styles.feedbackView}>
									<Box flex={1} mr={4}>
										<FeedbackTextRender
											content={data.data?.supportResponse || ''}
											onLinkPress={handleLinkPress}
										/>
									</Box>
									<TouchableOpacity
										style={styles.clipboard}
										onPress={() => {
											onClipboardPress(data.data?.supportResponse || '');
										}}
									>
										<ClipboardIcon />
									</TouchableOpacity>
								</View>
							</>
						)}
						{canShowLiveChat && (
							<>
								<Box height={24} />
								<SupportCenterView
									onPress={() => {
										setShowLiveChat(true);
									}}
								/>
							</>
						)}
						{isShowLiveChat && (
							<ChatWootWidget
								user={{
									identifier: user?.email || '',
									name: user?.fullName || user?.email,
									email: user?.email || '',
									identifier_hash: identifierHash,
								}}
								websiteToken={Env.CHATWOOT_WEBSITE_TOKEN}
								locale={i18n.language}
								baseUrl={Env.CHATWOOT_BASE_URL}
								isModalVisible={isShowLiveChat}
								closeModal={() => {
									setShowLiveChat(false);
								}}
								customAttributes={{
									supportId: data?.nflowId,
									userId: user?.id,
									orderId: data?.orderId,
								}}
							/>
						)}
					</>
				)}
			</ScrollView>
			{isLoading && <Loading />}
		</ScreenWrapper>
	);
};

const ClipboardIcon = () => {
	return (
		<Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M5.33325 2.00008C5.33325 1.26389 5.9304 0.666748 6.66659 0.666748H11.3333C11.5101 0.666748 11.6796 0.736986 11.8047 0.86201L14.4713 3.52868C14.5963 3.6537 14.6666 3.82327 14.6666 4.00008V10.6667C14.6666 11.4029 14.0694 12.0001 13.3333 12.0001H6.66659C5.9304 12.0001 5.33325 11.4029 5.33325 10.6667V2.00008ZM11.0571 2.00008H6.66659V10.6667H13.3333V4.27622L11.0571 2.00008Z"
				fill="#A0A0A1"
			/>
			<Path
				d="M10.6667 1.33325V3.99992C10.6667 4.36792 10.9647 4.66658 11.3334 4.66658H14.0001L10.6667 1.33325Z"
				fill="#A0A0A1"
			/>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M2 4.66659C2 3.9304 2.59714 3.33325 3.33333 3.33325H6V4.66659H3.33333V13.3333H10V11.3333H11.3333V13.3333C11.3333 14.0694 10.7362 14.6666 10 14.6666H3.33333C2.59714 14.6666 2 14.0694 2 13.3333V4.66659Z"
				fill="#A0A0A1"
			/>
		</Svg>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {
		paddingHorizontal: 16,
	},
	image: {
		width: 114,
		height: 114,
		borderRadius: 8,
		marginRight: 8,
	},
	imageScrollView: {
		height: 114,
	},
	feedbackView: {
		backgroundColor: colors.neutral100,
		padding: 12,
		borderRadius: 8,
		marginTop: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	clipboard: {
		padding: 8,
	},
	title: {
		color: colors.neutral500,
	},
}));

export default SupportTicketDetailScreen;
