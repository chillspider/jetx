import { useNavigation } from '@react-navigation/native';
import { Button, CheckBox, makeStyles, Text } from '@rneui/themed';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, FlatList, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Image } from '@/components';
import { AttentionDto } from '@/models/attention/attention.dto';
import { DeviceDto } from '@/models/devices/device.dto';
import { AppNavigationProp } from '@/types/navigation';
import { getPublicMediaUrl } from '@/utils/resources';

type Props = {
	device: DeviceDto;
	onNext?: () => void;
};

const numColumns = 3;
const screenWidth = Dimensions.get('window').width;

const gap = 12;

const availableSpace = screenWidth - (numColumns - 1) * gap - 32;
const itemSize = availableSpace / numColumns;

const StepSafeCheck: React.FC<Props> = ({ device, onNext }) => {
	const { t } = useTranslation();

	const styles = useStyles();

	const { bottom } = useSafeAreaInsets();
	const [checkedTerms, setCheckedTerms] = useState<boolean>(false);

	const toggleCheckbox = useCallback(() => {
		setCheckedTerms(!checkedTerms);
	}, [checkedTerms]);

	const navigation = useNavigation<AppNavigationProp<'StartProcess'>>();

	const onNavigateTerms = useCallback(() => {
		navigation.navigate('TermOfUse');
	}, [navigation]);

	const renderItem = useCallback(
		({ item }: { item: AttentionDto }) => {
			const isEnd = item.id === 'attention-end';

			return (
				<View
					style={[
						{
							width: itemSize,
						},
						isEnd ? styles.itemStyleBorder : styles.itemStyle,
					]}
				>
					{isEnd ? (
						<Box p={12}>
							<Text style={styles.itemAttentionText}>{t('process.attentionTitle')}</Text>
							<Text style={styles.itemText}>{t('process.attentionDesc')}</Text>
						</Box>
					) : (
						<>
							<Image
								source={{ uri: getPublicMediaUrl(item.featureImageUrl || '') }}
								style={styles.itemImg}
							/>
							<Text style={styles.itemText}>{item.name}</Text>
						</>
					)}
				</View>
			);
		},
		[styles, t],
	);

	const renderTerms = useCallback(
		() => (
			<TouchableWithoutFeedback onPress={toggleCheckbox}>
				<View style={styles.termsView}>
					<CheckBox
						checked={checkedTerms}
						onPress={toggleCheckbox}
						iconType="material-community"
						checkedIcon="checkbox-marked"
						uncheckedIcon="checkbox-blank-outline"
						containerStyle={styles.checkbox}
					/>
					<Text style={styles.terms} textBreakStrategy="simple">
						{t('agree_terms')}
						<TouchableWithoutFeedback onPress={onNavigateTerms}>
							<Text style={styles.termsAndCondition}> {t('process.termsAndCondition')} </Text>
						</TouchableWithoutFeedback>
						{t('agree_terms_suffix')}
					</Text>
				</View>
			</TouchableWithoutFeedback>
		),
		[
			checkedTerms,
			onNavigateTerms,
			styles.checkbox,
			styles.terms,
			styles.termsAndCondition,
			styles.termsView,
			t,
			toggleCheckbox,
		],
	);

	const attentions = useMemo(() => {
		return [...(device.attentions || []), new AttentionDto('attention-end', 'attention')];
	}, [device]);

	return (
		<View style={[styles.container]}>
			<View style={styles.content}>
				<Text h4>{t('process.safeTitle')}</Text>
				<Text style={styles.decs}>{t('process.safeDesc')}</Text>
				<FlatList
					data={attentions}
					numColumns={3}
					keyExtractor={(item, index) => `${item.id}-${index}`}
					renderItem={renderItem}
					contentContainerStyle={{ gap }}
					columnWrapperStyle={{ gap }}
					style={styles.list}
				/>
			</View>
			<View style={[styles.bottom, { paddingBottom: bottom + 16 }]}>
				{renderTerms()}
				<Button title={t('process.nextStep')} onPress={onNext} disabled={!checkedTerms} />
			</View>
		</View>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingTop: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},
	bottom: {
		backgroundColor: colors.white,
		paddingTop: 16,
	},
	decs: {
		marginTop: 8,
		fontSize: 14,
		textAlign: 'center',
	},
	itemStyle: {
		backgroundColor: colors.primary50,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
		aspectRatio: 1,
	},
	itemStyleBorder: {
		borderWidth: 1,
		borderColor: colors.neutral200,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
		aspectRatio: 1,
	},
	itemText: {
		fontSize: 10,
		fontWeight: '300',
	},
	itemImg: {
		width: 48,
		height: 48,
		marginBottom: 8,
	},
	termsAndCondition: {
		color: colors.blue,
		textDecorationStyle: 'solid',
		textDecorationLine: 'underline',
		fontSize: 12,
	},
	terms: {
		fontSize: 12,
		flex: 1,
	},
	termsView: {
		flexDirection: 'row',
		alignItems: 'center',
		alignContent: 'center',
		paddingTop: 8,
		paddingBottom: 8,
		width: 'auto',
	},
	list: {
		marginTop: 16,
	},
	itemAttentionText: {
		fontSize: 14,
		fontWeight: '500',
		marginBottom: 4,
	},
	checkbox: {
		padding: 0,
		marginLeft: 0,
		marginRight: 4,
	},
}));

export default StepSafeCheck;
