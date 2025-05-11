import { useNavigation } from '@react-navigation/native';
import { Button, makeStyles, Text } from '@rneui/themed';
import { isNotNil } from 'ramda';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import Toast from 'react-native-toast-message';

import IcSuccess from '@/assets/svgs/ic-congratulation.svg';
import { Box, Dialog, Header, ScreenWrapper } from '@/components';
import EmptyView from '@/components/empty/empty-view';
import { Loading } from '@/components/loading';
import { useRefreshOnFocus } from '@/core/hooks/useRefreshOnFocus';
import { UserTokenDto } from '@/models/payment/user-token.dto';
import { AppNavigationProp } from '@/types/navigation';

import {
	useDefaultCard,
	useDeleteCard,
	useUserCardTokens,
} from '../../core/hooks/payment/useUserCardTokens';
import UserCardItem from './components/user-card-item';

const PaymentSettingScreen: React.FC = () => {
	const navigation = useNavigation<AppNavigationProp<'Card'>>();
	const { t } = useTranslation();

	const { data: cardPages, refetch, isFetching, fetchNextPage, hasNextPage } = useUserCardTokens();

	const cards = useMemo(() => {
		return cardPages?.pages.flatMap(page => page.data || []) || [];
	}, [cardPages?.pages]);

	const [deleteId, setDeleteId] = useState<string | undefined>(undefined);
	const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
	const [showDefaultCardSuccess, setShowDefaultCardSuccess] = useState<boolean>(false);

	const [edit, setEdit] = useState<boolean>(false);
	const [currDefaultCard, setCurrDefaultCard] = useState<string | undefined>(undefined);
	const [savedDefaultCard, setSavedDefaultCard] = useState<string | undefined>(undefined);

	useRefreshOnFocus(refetch);

	useEffect(() => {
		const defaultCard = cards.find(card => card.isDefault);
		setCurrDefaultCard(defaultCard?.id);
		setSavedDefaultCard(defaultCard?.id);
	}, [cards]);

	const deleteMutation = useDeleteCard({
		onError: () => {
			Toast.show({
				type: 'error',
				text1: t('notificationTitle'),
				text2: t('networkError'),
			});
		},
		onSuccess: () => {
			setEdit(false);
			refetch();
		},
	});

	const defaultMutation = useDefaultCard({
		onError: () => {
			Toast.show({
				type: 'error',
				text1: t('notificationTitle'),
				text2: t('networkError'),
			});
		},
		onSuccess: () => {
			setShowDefaultCardSuccess(true);
			setEdit(false);
			refetch();
		},
	});

	const renderItem = useCallback(
		({ item }: { item: UserTokenDto }) => {
			const isDefault = isNotNil(currDefaultCard) && item.id === currDefaultCard;

			return (
				<UserCardItem
					data={item}
					isDefault={edit ? isDefault : item.isDefault || false}
					editable={edit}
					onRemove={() => {
						setShowConfirmDelete(true);
						setDeleteId(item.id);
					}}
					onDefaultChanged={() => {
						setCurrDefaultCard(item.id);
					}}
				/>
			);
		},
		[currDefaultCard, edit],
	);

	const styles = useStyles();

	const navigateCreateNewCard = useCallback(() => {
		navigation.navigate('CreatePaymentCard', { status: undefined });
	}, [navigation]);

	const onConfirmDefaultCard = useCallback(() => {
		if (isNotNil(currDefaultCard) && currDefaultCard !== savedDefaultCard) {
			defaultMutation.mutate(currDefaultCard);
		}
	}, [currDefaultCard, defaultMutation, savedDefaultCard]);

	const hasDefaultChanged = useMemo(() => {
		return isNotNil(currDefaultCard) && currDefaultCard !== savedDefaultCard;
	}, [currDefaultCard, savedDefaultCard]);

	return (
		<ScreenWrapper>
			<Header
				title={t('profile.paymentSetting')}
				rightComponent={
					<Pressable
						style={styles.headerAction}
						onPress={() => {
							setEdit(e => !e);
						}}
					>
						<Text style={styles.actionEdit}>
							{edit ? t('payment_setting.done') : t('payment_setting.edit')}
						</Text>
					</Pressable>
				}
			/>
			<FlatList
				style={styles.list}
				data={cards}
				refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
				keyExtractor={(i, index) => `${i.id}-${index}`}
				showsVerticalScrollIndicator={false}
				renderItem={renderItem}
				onEndReachedThreshold={0.5}
				onEndReached={() => {
					if (hasNextPage) {
						fetchNextPage();
					}
				}}
				ListEmptyComponent={<EmptyView content={t('cardTokenEmpty')} style={styles.emptyStyle} />}
				ItemSeparatorComponent={() => <Box height={8} />}
				ListFooterComponent={
					<View style={styles.action}>
						{!edit && (
							<Button
								title={t('payment_setting.add_new')}
								buttonStyle={styles.addButton}
								titleStyle={styles.addTitleStyle}
								onPress={navigateCreateNewCard}
							/>
						)}
						{edit && hasDefaultChanged && (
							<Button
								title={t('payment_setting.set_default')}
								buttonStyle={styles.buttonDefault}
								titleStyle={styles.buttonDefaultTitleStyle}
								onPress={onConfirmDefaultCard}
							/>
						)}
					</View>
				}
			/>
			{showConfirmDelete && (
				<Dialog
					isVisible={showConfirmDelete}
					title={t('payment_setting.remove_card_title')}
					description={t('payment_setting.remove_card_decs')}
					confirmLabel={t('payment_setting.remove')}
					closeLabel={t('payment_setting.cancel')}
					onConfirm={() => {
						setShowConfirmDelete(false);
						deleteMutation.mutate(deleteId!);
					}}
					onClosed={() => {
						setShowConfirmDelete(false);
						setDeleteId(undefined);
					}}
				/>
			)}
			{showDefaultCardSuccess && (
				<Dialog
					isRequired
					isVisible={showDefaultCardSuccess}
					title={t('payment_setting.success')}
					confirmLabel={t('payment_setting.know')}
					onConfirm={() => {
						setShowDefaultCardSuccess(false);
					}}
					onClosed={() => {
						setShowDefaultCardSuccess(false);
					}}
				>
					<Box justifyContent="center" alignItems="center">
						<IcSuccess />
						<Box height={12} />
						<Text style={styles.textAlign}>{t('payment_setting.set_default_success')}</Text>
					</Box>
				</Dialog>
			)}
			{deleteMutation.isPending && <Loading />}
		</ScreenWrapper>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	list: { paddingHorizontal: 16, paddingTop: 16 },
	actionEdit: {
		color: colors.blue,
		textDecorationLine: 'underline',
		fontSize: 14,
	},
	headerAction: {
		alignContent: 'center',
	},
	action: {
		paddingVertical: 12,
	},
	addTitleStyle: {
		color: colors.neutral800,
		fontWeight: '400',
	},
	addButton: {
		backgroundColor: colors.neutral100,
	},
	buttonDefaultTitleStyle: {
		color: colors.primary500,
		fontWeight: '400',
	},
	buttonDefault: {
		backgroundColor: colors.primary50,
	},
	textAlign: {
		textAlign: 'center',
	},
	emptyStyle: {
		marginBottom: 48,
	},
}));

export default PaymentSettingScreen;
