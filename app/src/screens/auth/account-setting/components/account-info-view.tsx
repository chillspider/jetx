import { makeStyles, Text } from '@rneui/themed';
import { isNil } from 'ramda';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useAuth } from '@/core/store/auth';
import Avatar from '@/screens/profile/components/avatar';

const AccountInfoView: React.FC = () => {
	const styles = useStyles();

	const { user } = useAuth();
	const { t } = useTranslation();

	const getDisplayName = useMemo(() => {
		if (isNil(user)) {
			return '';
		}

		if (user.fullName) {
			return user.fullName;
		}

		const firstName = user.firstName || '';
		const lastName = user.lastName || '';

		return `${firstName} ${lastName}`.trim();
	}, [user]);

	if (isNil(user)) {
		return <></>;
	}

	return (
		<View style={styles.container}>
			<Avatar name={getDisplayName || user.email || ''} style={styles.avatar} />
			<View style={styles.content}>
				<InfoItem title={t('profile.fullName')} value={getDisplayName} />
				<InfoItem title={t('profile.phoneNumber')} value={user.phone} />
				<InfoItem title={t('profile.email')} value={user.email} />
			</View>
		</View>
	);
};

type ItemProps = {
	title: string;
	value?: string;
};

const InfoItem: React.FC<ItemProps> = ({ title, value }) => {
	const styles = useStyles();

	return (
		<View style={styles.itemRow}>
			<Text style={styles.itemValue}>{title}</Text>
			<Text numberOfLines={1} ellipsizeMode="tail" style={styles.itemValue}>
				{value || '...'}
			</Text>
		</View>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {},
	content: {
		marginTop: 16,
		padding: 8,
		borderRadius: 8,
		borderWidth: 0.5,
		borderColor: colors.neutral300,
	},
	avatar: {
		marginTop: 0,
	},
	itemRow: {
		flexDirection: 'row',
		paddingVertical: 8,
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	itemValue: {
		paddingRight: 12,
		fontSize: 14,
		fontWeight: '300',
		color: colors.neutral800,
	},
}));

export default AccountInfoView;
