import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import { Button, Input, makeStyles, Text } from '@rneui/themed';
import { isNotEmpty } from 'ramda';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import IcClipboard from '@/assets/svgs/ic_clipboard.svg';
import IcShare from '@/assets/svgs/ic_share.svg';
import { Box, ContentWrapper, Header, ScreenWrapper } from '@/components';
import { Loading } from '@/components/loading';
import { useAuth } from '@/core/store/auth';
import { AppNavigationProp } from '@/types/navigation';

import { useSubmitReferral } from '../../core/hooks/useSubmitReferral';
import ReferralFailedDialog from './dialogs/referral-failed';
import ReferralSuccessDialog from './dialogs/referral-success';

const ReferralScreen: React.FC = () => {
	const [inputReferral, setInputReferral] = useState<string>('');
	const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
	const [showFailedDialog, setShowFailedDialog] = useState<boolean>(false);

	const navigation = useNavigation<AppNavigationProp<'Referral'>>();

	const { t } = useTranslation();

	const styles = useStyles();

	const { user, getProfile } = useAuth();

	const mutation = useSubmitReferral({
		onSuccess: () => {
			setShowSuccessDialog(true);
			getProfile();
		},
		onError: () => {
			setInputReferral('');
			setShowFailedDialog(true);
		},
	});

	const canApplyReferral = useMemo(() => {
		return !(user?.isReferred ?? false);
	}, [user]);

	const onCopyClipboard = useCallback(() => {
		Clipboard.setString(user?.referralCode || '');
		Toast.show({
			type: 'success',
			text1: t('referral.copied_to_clipboard'),
			text2: t('referral.copy_success_message'),
		});
	}, [t, user?.referralCode]);

	const validatedReferral = useMemo(() => {
		return isNotEmpty(inputReferral);
	}, [inputReferral]);

	const onSetReferral = useCallback(() => {
		mutation.mutate({
			referral: inputReferral.trim(),
		});
	}, [inputReferral, mutation]);

	return (
		<ScreenWrapper>
			<Header type="modal" title={t('referral.title')} />
			<ContentWrapper style={styles.content}>
				<Text style={styles.title}>{t('referral.invite_text')}</Text>
				<Box height={20} />
				<Text>{t('referral.referral_code')}</Text>
				<View style={styles.referralView}>
					<Text style={styles.code}>{user?.referralCode || ''}</Text>
					<TouchableOpacity onPress={onCopyClipboard}>
						<IcClipboard />
					</TouchableOpacity>
				</View>
				<Button
					title={
						<View style={styles.shareNow}>
							<IcShare />
							<Box width={8} />
							<Text style={styles.shareTitle}>{t('referral.share_now')}</Text>
						</View>
					}
					onPress={onCopyClipboard}
				/>
				{canApplyReferral && (
					<View style={styles.inputContent}>
						<Text>{t('referral.input_referral_code')}</Text>
						<Box height={8} />
						<Input
							value={inputReferral}
							style={styles.input}
							inputContainerStyle={styles.inputContainer}
							containerStyle={styles.containerStyle}
							placeholder={t('referral.placeholder_referral_code')}
							errorStyle={styles.error}
							onChangeText={text => {
								setInputReferral(text);
							}}
						/>
						<Box height={8} />
						<Button
							title={t('referral.confirm')}
							disabled={!validatedReferral}
							onPress={onSetReferral}
						/>
					</View>
				)}
			</ContentWrapper>
			{showSuccessDialog && (
				<ReferralSuccessDialog
					onClose={() => {
						setShowSuccessDialog(false);
						navigation.goBack();
					}}
				/>
			)}
			{showFailedDialog && (
				<ReferralFailedDialog
					onClose={() => {
						setShowFailedDialog(false);
					}}
				/>
			)}
			{mutation.isPending && <Loading />}
		</ScreenWrapper>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {},
	content: {
		paddingTop: 12,
	},
	title: {
		fontSize: 16,
		fontWeight: '300',
	},
	titleHighlight: {
		fontSize: 16,
		color: colors.primary,
	},
	referralView: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginVertical: 8,
		borderRadius: 8,
		backgroundColor: colors.neutral100,
		padding: 12,
	},
	code: {
		fontSize: 16,
		fontWeight: '300',
	},
	shareNow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	shareTitle: {
		fontSize: 16,
		fontWeight: '400',
		color: colors.white,
	},
	inputContent: {
		marginTop: 20,
	},
	input: {
		color: colors.neutral800,
		fontSize: 16,
	},
	inputContainer: {
		borderWidth: 1,
		borderColor: colors.neutral200,
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 2,
		padding: 0,
	},
	containerStyle: {
		paddingHorizontal: 0,
	},
	error: {
		display: 'none',
	},
}));

export default ReferralScreen;
