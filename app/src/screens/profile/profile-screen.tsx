import { useNavigation } from '@react-navigation/native';
import { makeStyles, Text, useTheme } from '@rneui/themed';
import { isNil } from 'ramda';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import IcHistorySetting from '@/assets/svgs/profile/ic_profile_history.svg';
import IcProfilePackage from '@/assets/svgs/profile/ic_profile_package.svg';
import IcProfilePayment from '@/assets/svgs/profile/ic_profile_payment.svg';
import IcProfileReferral from '@/assets/svgs/profile/ic_profile_referral.svg';
import IcProfileSetting from '@/assets/svgs/profile/ic_profile_setting.svg';
import IcProfileSupport from '@/assets/svgs/profile/ic_profile_support.svg';
import IcProfileVoucher from '@/assets/svgs/profile/ic_profile_voucher.svg';
import { Box, ScreenWrapper } from '@/components';
import { useAuth } from '@/core/store/auth';
import { AppNavigationProp } from '@/types/navigation';

import Avatar from './components/avatar';
import InformationView from './components/information-view';
import VehicleBadgeView from './components/my-vehicle-badge';
import SettingButton from './components/setting-button';

const ProfileScreen: React.FC = () => {
	const {
		theme: { colors },
	} = useTheme();

	const styles = useStyles();

	const navigation = useNavigation<AppNavigationProp<'MainTab'>>();

	const { t } = useTranslation();

	const { user } = useAuth();

	const onNavigateAccount = useCallback(() => {
		navigation.navigate('Account');
	}, [navigation]);

	const onNavigateSupport = useCallback(() => {
		navigation.navigate('Support');
	}, [navigation]);

	const onNavigateVoucher = useCallback(() => {
		navigation.navigate('Voucher');
	}, [navigation]);

	const onNavigatePayment = useCallback(() => {
		navigation.navigate('Card');
	}, [navigation]);

	const onNavigateReferral = useCallback(() => {
		navigation.navigate('Referral');
	}, [navigation]);

	const onNavigatePackage = useCallback(() => {
		navigation.navigate('Package');
	}, [navigation]);

	const onNavigateHistory = useCallback(() => {
		navigation.navigate('History');
	}, [navigation]);

	const getDisplayName = useMemo(() => {
		if (isNil(user)) {
			return '';
		}

		if (user.fullName) {
			return user.fullName;
		}

		const firstName = user.firstName || '';
		const lastName = user.lastName || '';

		return `${firstName} ${lastName}`.trim() || user.email || '';
	}, [user]);

	return (
		<ScreenWrapper backgroundColor={colors.red2}>
			<SafeAreaView style={styles.container}>
				<Box style={styles.contentView}>
					<Pressable onPress={onNavigateAccount}>
						<Avatar name={getDisplayName} />
					</Pressable>
					<Box pt={8} justifyContent="center" alignItems="center">
						<Text>{getDisplayName}</Text>
					</Box>
					{/* <Box height={16} />
					<MembershipBadgeView /> */}
					<Box height={24} />
					<ScrollView showsVerticalScrollIndicator={false}>
						<Box
							flexDirection="row"
							flexWrap="wrap"
							alignItems="center"
							justifyContent="space-between"
							mb={20}
						>
							<SettingButton
								title={t('profile.accountManagement')}
								icon={<IcProfileSetting />}
								onPress={onNavigateAccount}
							/>
							<SettingButton
								title={t('profile.package')}
								icon={<IcProfilePackage />}
								onPress={onNavigatePackage}
							/>
							<SettingButton
								title={t('profile.voucherSetting')}
								icon={<IcProfileVoucher />}
								onPress={onNavigateVoucher}
							/>

							<SettingButton
								title={t('profile.customerSupport')}
								icon={<IcProfileSupport />}
								onPress={onNavigateSupport}
							/>
							<SettingButton
								title={t('profile.historySetting')}
								icon={<IcHistorySetting />}
								onPress={onNavigateHistory}
							/>
							<SettingButton
								title={t('profile.paymentSetting')}
								icon={<IcProfilePayment />}
								onPress={onNavigatePayment}
							/>
							<SettingButton
								title={t('profile.referral')}
								icon={<IcProfileReferral />}
								onPress={onNavigateReferral}
							/>
						</Box>

						<VehicleBadgeView />
						<Box height={20} />
						<InformationView />
						<Box height={120} />
					</ScrollView>
				</Box>
			</SafeAreaView>
		</ScreenWrapper>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {
		flex: 1,
	},
	contentView: {
		backgroundColor: colors.white,
		flex: 1,
		marginTop: 70,
		borderTopLeftRadius: 40,
		borderTopRightRadius: 40,
		paddingHorizontal: 16,
	},
}));

export default ProfileScreen;
