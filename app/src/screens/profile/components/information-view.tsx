import { useNavigation } from '@react-navigation/native';
import { makeStyles, Text } from '@rneui/themed';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Linking, Pressable, TouchableOpacity, View } from 'react-native';

import GalaxyPayImage from '@/assets/images/galaxy_pay.png';
import NotiImage from '@/assets/images/sale_noti.png';
import IcAbout from '@/assets/svgs/ic_about_company.svg';
import IcPolicy from '@/assets/svgs/ic_policy.svg';
import { Box } from '@/components';
import { useAppSetting } from '@/core/store/setting';
import { MainNavNavigationProp } from '@/types/navigation';

const InformationView: React.FC = () => {
	const navigation = useNavigation<MainNavNavigationProp<'Profile'>>();

	const { t } = useTranslation();
	const styles = useStyles();

	const onNavigateTermOfUse = useCallback(() => {
		navigation.navigate('TermOfUse');
	}, [navigation]);

	const onNavigateAbout = useCallback(() => {
		navigation.navigate('About');
	}, [navigation]);

	const openViewViewLink = useCallback(
		(uri: string, title?: string) => {
			navigation.navigate('WebView', {
				uri,
				title,
			});
		},
		[navigation],
	);

	const {
		warrantyPolicyUrl,
		privacyPolicyUrl,
		refundPolicyUrl,
		generalRegulationsUrl,
		inspectionPolicyUrl,
		shippingPolicyUrl,
		productInfoUrl,
		transactionConditionsUrl,
		paymentPolicyUrl,
	} = useAppSetting();

	return (
		<View style={styles.container}>
			<Text style={styles.title}>{t('profile.informationAndPolicy')}</Text>
			<Pressable onPress={onNavigateTermOfUse}>
				<View style={styles.itemView}>
					<IcPolicy />
					<Text style={styles.itemTitle}>{t('profile.termOfUse')}</Text>
				</View>
			</Pressable>
			<Box height={8} />
			<Pressable onPress={onNavigateAbout}>
				<View style={styles.itemView}>
					<IcAbout />
					<Text style={styles.itemTitle}>{t('profile.about')}</Text>
				</View>
			</Pressable>
			<Box height={8} />
			<Pressable
				onPress={() => {
					openViewViewLink(warrantyPolicyUrl, t('policyLinks.warranty'));
				}}
			>
				<View style={styles.itemView}>
					<IcPolicy />
					<Text style={styles.itemTitle}>{t('policyLinks.warranty')}</Text>
				</View>
			</Pressable>
			<Box height={8} />
			<Pressable
				onPress={() => {
					openViewViewLink(privacyPolicyUrl, t('policyLinks.privacy'));
				}}
			>
				<View style={styles.itemView}>
					<IcPolicy />
					<Text style={styles.itemTitle}>{t('policyLinks.privacy')}</Text>
				</View>
			</Pressable>
			<Box height={8} />
			<Pressable
				onPress={() => {
					openViewViewLink(refundPolicyUrl, t('policyLinks.refund'));
				}}
			>
				<View style={styles.itemView}>
					<IcPolicy />
					<Text style={styles.itemTitle}>{t('policyLinks.refund')}</Text>
				</View>
			</Pressable>
			<Box height={8} />
			<Pressable
				onPress={() => {
					openViewViewLink(generalRegulationsUrl, t('policyLinks.generalRegulations'));
				}}
			>
				<View style={styles.itemView}>
					<IcPolicy />
					<Text style={styles.itemTitle}>{t('policyLinks.generalRegulations')}</Text>
				</View>
			</Pressable>
			<Box height={8} />
			<Pressable
				onPress={() => {
					openViewViewLink(inspectionPolicyUrl, t('policyLinks.inspection'));
				}}
			>
				<View style={styles.itemView}>
					<IcPolicy />
					<Text style={styles.itemTitle}>{t('policyLinks.inspection')}</Text>
				</View>
			</Pressable>
			<Box height={8} />
			<Pressable
				onPress={() => {
					openViewViewLink(shippingPolicyUrl, t('policyLinks.shipping'));
				}}
			>
				<View style={styles.itemView}>
					<IcPolicy />
					<Text style={styles.itemTitle}>{t('policyLinks.shipping')}</Text>
				</View>
			</Pressable>
			<Box height={8} />
			<Pressable
				onPress={() => {
					openViewViewLink(productInfoUrl, t('policyLinks.productInfo'));
				}}
			>
				<View style={styles.itemView}>
					<IcPolicy />
					<Text style={styles.itemTitle}>{t('policyLinks.productInfo')}</Text>
				</View>
			</Pressable>
			<Box height={8} />
			<Pressable
				onPress={() => {
					openViewViewLink(transactionConditionsUrl, t('policyLinks.transactionConditions'));
				}}
			>
				<View style={styles.itemView}>
					<IcPolicy />
					<Text style={styles.itemTitle}>{t('policyLinks.transactionConditions')}</Text>
				</View>
			</Pressable>
			<Box height={8} />
			<Pressable
				onPress={() => {
					openViewViewLink(paymentPolicyUrl, t('policyLinks.payment'));
				}}
			>
				<View style={styles.itemView}>
					<IcPolicy />
					<Text style={styles.itemTitle}>{t('policyLinks.payment')}</Text>
				</View>
			</Pressable>
			<Box height={8} />
			<CompanyInfoWidget />
		</View>
	);
};

const CompanyInfoWidget: React.FC = () => {
	const styles = useStyles();

	const onOpenLink = useCallback(async () => {
		const url = 'http://online.gov.vn/Home/AppDetails/3100';
		try {
			const canOpen = await Linking.canOpenURL(url);
			if (canOpen) {
				Linking.openURL(url);
			}
		} catch (err) {
			console.error('Failed to open URL:', err);
		}
	}, []);

	return (
		<View style={styles.companyContainer}>
			<Text style={styles.label}>Tên Doanh nghiệp:</Text>
			<Text style={styles.value}>CÔNG TY CỔ PHẦN WASH 24H</Text>

			<Text style={styles.label}>MST/ĐKKD/QĐTL:</Text>
			<Text style={styles.value}>0318505644</Text>

			<Text style={styles.label}>Trụ sở Doanh nghiệp:</Text>
			<Text style={styles.value}>
				Tòa nhà Five Star, 28 Bis Mạc Đĩnh Chi, Phường Đa Kao, Quận 1, Thành phố Hồ Chí Minh, Việt
				Nam
			</Text>

			<Text style={styles.label}>Tỉnh/Thành phố:</Text>
			<Text style={styles.value}>Hồ Chí Minh</Text>

			<Text style={styles.label}>Quốc gia:</Text>
			<Text style={styles.value}>Việt Nam</Text>

			<Text style={styles.label}>Điện thoại:</Text>
			<Text style={styles.value}>02873060886</Text>

			<Text style={styles.label}>Cổng thanh toán GalaxyPay:</Text>
			<Image source={GalaxyPayImage} style={styles.logo} resizeMode="contain" />
			<Box height={16} />
			<TouchableOpacity onPress={onOpenLink}>
				<Image source={NotiImage} style={styles.logo} resizeMode="contain" />
			</TouchableOpacity>
		</View>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {},
	title: {
		marginBottom: 12,
	},
	itemView: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 14,
		paddingHorizontal: 8,
		backgroundColor: colors.neutral100,
		borderRadius: 6,
	},
	itemTitle: {
		marginLeft: 8,
		fontSize: 14,
		fontWeight: '300',
	},
	label: {
		fontWeight: 'bold',
		fontSize: 14,
		marginTop: 8,
	},
	value: {
		fontSize: 16,
		marginBottom: 8,
	},
	companyContainer: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	logo: {
		width: 292,
		height: 105,
	},
}));

export default InformationView;
