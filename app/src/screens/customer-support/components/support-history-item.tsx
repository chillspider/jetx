/* eslint-disable simple-import-sort/imports */
import { makeStyles, Text, useTheme } from '@rneui/themed';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ColorValue, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { Box } from '@/components';
import { SupportStatus } from '@/models/support/support-status.enum';
import { SupportDto } from '@/models/support/support.dto';
import { formatDate } from '@/utils/date-utils';
import { isNotEmpty, isNotNil } from 'ramda';

type Props = {
	item: SupportDto;
	index: number;
};

const SupportHistoryItem: React.FC<Props> = ({ item, index }) => {
	const { t } = useTranslation();

	const styles = useStyles({ index });

	const {
		theme: { colors },
	} = useTheme();

	const statusColor = useMemo(() => {
		switch (item.status) {
			case SupportStatus.OPEN:
				return colors.yellow;
			case SupportStatus.PROCESSING:
				return colors.green;
			case SupportStatus.COMPLETED:
				return colors.blue;
			default:
				return colors.neutral500;
		}
	}, [colors, item]);

	const statusString = useMemo(() => {
		switch (item.status) {
			case SupportStatus.OPEN:
				return t('support.status.new');
			case SupportStatus.PROCESSING:
				return t('support.status.processing');
			case SupportStatus.COMPLETED:
				return t('support.status.completed');
			default:
				return '';
		}
	}, [t, item]);

	return (
		<View style={styles.container}>
			<Text body2 numberOfLines={2}>
				{item.title || t('support.title')}
			</Text>
			<Box height={8} />
			<Text body2 numberOfLines={2}>
				{item.content || ''}
			</Text>
			<View style={styles.bottom}>
				<View style={styles.row}>
					<IconCalendar />
					<Text style={styles.textDesc}>{formatDate(item.createdAt || Date.now())}</Text>
				</View>
				<Dot color={colors.neutral400} />
				<View style={styles.row}>
					<IconImage />
					<Text style={styles.textDesc}>
						{isNotNil(item.images) && isNotEmpty(item.images) ? item.images.length : 0}
					</Text>
				</View>
				<Dot color={statusColor} />
				<View style={styles.row}>
					<Text style={[styles.textStatus, { color: statusColor }]}>{statusString}</Text>
				</View>
			</View>
		</View>
	);
};

const useStyles = makeStyles(({ colors }, { index }: { index: number }) => ({
	container: {
		paddingVertical: 10,
		paddingHorizontal: 16,
		backgroundColor: index % 2 ? '#F9F9F9' : colors.white,
	},
	bottom: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingTop: 8,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	textDesc: {
		fontSize: 12,
		fontWeight: '300',
		color: colors.neutral400,
		paddingLeft: 4,
	},
	textStatus: {
		fontSize: 12,
		fontWeight: '300',
		color: colors.neutral400,
	},
}));

const IconCalendar = () => {
	return (
		<Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
			<Path
				d="M3.99219 0.993225C3.85975 0.995295 3.73354 1.04983 3.64127 1.14485C3.54899 1.23987 3.49819 1.36762 3.5 1.50006H2C1.8674 1.50007 1.74023 1.55276 1.64646 1.64652C1.5527 1.74029 1.50001 1.86746 1.5 2.00006V10.0001C1.50001 10.1327 1.5527 10.2598 1.64646 10.3536C1.74023 10.4474 1.8674 10.5 2 10.5001H10C10.1326 10.5 10.2598 10.4474 10.3535 10.3536C10.4473 10.2598 10.5 10.1327 10.5 10.0001V2.00006C10.5 1.86746 10.4473 1.74029 10.3535 1.64652C10.2598 1.55276 10.1326 1.50007 10 1.50006H8.5C8.50092 1.43317 8.4884 1.36677 8.46319 1.3048C8.43798 1.24283 8.4006 1.18655 8.35324 1.13929C8.30589 1.09202 8.24954 1.05475 8.18752 1.02966C8.1255 1.00457 8.05908 0.99218 7.99219 0.993225C7.85975 0.995295 7.73354 1.04983 7.64127 1.14485C7.54899 1.23987 7.49819 1.36762 7.5 1.50006H4.5C4.50092 1.43317 4.4884 1.36677 4.46319 1.3048C4.43798 1.24283 4.4006 1.18655 4.35325 1.13929C4.30589 1.09202 4.24954 1.05475 4.18752 1.02966C4.1255 1.00457 4.05908 0.99218 3.99219 0.993225ZM2.5 2.50006H3.5C3.49906 2.56632 3.5113 2.6321 3.53601 2.69358C3.56072 2.75507 3.5974 2.81103 3.64392 2.85821C3.69044 2.9054 3.74588 2.94287 3.80701 2.96844C3.86814 2.99401 3.93374 3.00718 4 3.00718C4.06626 3.00718 4.13186 2.99401 4.19299 2.96844C4.25412 2.94287 4.30956 2.9054 4.35608 2.85821C4.4026 2.81103 4.43928 2.75507 4.46399 2.69358C4.4887 2.6321 4.50094 2.56632 4.5 2.50006H7.5C7.49906 2.56632 7.5113 2.6321 7.53601 2.69358C7.56072 2.75507 7.5974 2.81103 7.64392 2.85821C7.69044 2.9054 7.74588 2.94287 7.80701 2.96844C7.86814 2.99401 7.93374 3.00718 8 3.00718C8.06626 3.00718 8.13186 2.99401 8.19299 2.96844C8.25412 2.94287 8.30956 2.9054 8.35608 2.85821C8.4026 2.81103 8.43928 2.75507 8.46399 2.69358C8.4887 2.6321 8.50094 2.56632 8.5 2.50006H9.5V4.00006H2.5V2.50006ZM2.5 5.00006H9.5V9.50006H2.5V5.00006Z"
				fill="#A0A0A1"
			/>
		</Svg>
	);
};

const IconImage = () => {
	return (
		<Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M1.5 2.875C1.5 2.11586 2.11586 1.5 2.875 1.5H9.125C9.88414 1.5 10.5 2.11586 10.5 2.875V9.125C10.5 9.88414 9.88414 10.5 9.125 10.5H2.875C2.11586 10.5 1.5 9.88414 1.5 9.125V2.875ZM2.875 2.5C2.66814 2.5 2.5 2.66814 2.5 2.875V9.125C2.5 9.33186 2.66814 9.5 2.875 9.5H9.125C9.33186 9.5 9.5 9.33186 9.5 9.125V2.875C9.5 2.66814 9.33186 2.5 9.125 2.5H2.875Z"
				fill="#A0A0A1"
			/>
			<Path
				d="M7.75 5C8.16421 5 8.5 4.66421 8.5 4.25C8.5 3.83579 8.16421 3.5 7.75 3.5C7.33579 3.5 7 3.83579 7 4.25C7 4.66421 7.33579 5 7.75 5Z"
				fill="#A0A0A1"
			/>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M3.79266 6.00018C4.18329 5.60882 4.81653 5.60955 5.20696 5.99998L6.85346 7.64648C7.04872 7.84174 7.04872 8.15833 6.85346 8.35359C6.6582 8.54885 6.34162 8.54885 6.14635 8.35359L4.49991 6.70714L2.48246 8.72459C2.2872 8.91985 1.97062 8.91985 1.77535 8.72459C1.58009 8.52933 1.58009 8.21274 1.77535 8.01748L3.79266 6.00018C3.79274 6.00009 3.79257 6.00026 3.79266 6.00018ZM4.49961 6.70674C4.49957 6.70671 4.4996 6.70673 4.49961 6.70674V6.70674Z"
				fill="#A0A0A1"
			/>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M6.29195 6.5028C6.68194 6.1108 7.31672 6.10965 7.70796 6.50089L10.246 9.03889C10.4412 9.23415 10.4412 9.55073 10.246 9.746C10.0507 9.94126 9.73411 9.94126 9.53885 9.746L7.0009 7.20805L6.36893 7.84352C6.17421 8.03932 5.85763 8.04019 5.66183 7.84547C5.46603 7.65075 5.46515 7.33417 5.65988 7.13837L6.29195 6.5028Z"
				fill="#A0A0A1"
			/>
		</Svg>
	);
};

const Dot: React.FC<{ color?: ColorValue | undefined }> = ({ color }) => {
	return <Box width={4} height={4} borderRadius={2} backgroundColor={color} mx={8} />;
};

export default SupportHistoryItem;
