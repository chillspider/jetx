/* eslint-disable react-native/no-inline-styles */
import { makeStyles, Text, useTheme } from '@rneui/themed';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';

export type Step = 'one' | 'two' | 'three';

type Props = {
	step: Step;
};

const StartProcessStep: React.FC<Props> = ({ step }) => {
	const styles = useStyles();
	const {
		theme: { colors },
	} = useTheme();

	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<View style={styles.viewFlex}>
				<Dot selected={step === 'one'} passed={step !== 'one'} />
				<View
					style={[
						styles.line,
						{ backgroundColor: step !== 'one' ? colors.primary : colors.neutral200 },
					]}
				/>
				<Dot selected={step === 'two'} passed={step === 'three'} />
				<View
					style={[
						styles.line,
						{ backgroundColor: step === 'three' ? colors.primary : colors.neutral200 },
					]}
				/>
				<Dot selected={step === 'three'} passed={false} />
			</View>
			<View style={styles.viewStepName}>
				<StepTitle title={t('process.step1')} selected={step === 'one'} />
				<StepTitle title={t('process.step2')} selected={step === 'two'} />
				<StepTitle title={t('process.step3')} selected={step === 'three'} />
			</View>
		</View>
	);
};

type DotProps = {
	selected: boolean;
	passed: boolean;
};

const Dot: React.FC<DotProps> = ({ selected, passed }) => {
	const {
		theme: { colors },
	} = useTheme();

	const styles = useStyles();

	const scale = useSharedValue(0);

	scale.value = withRepeat(
		withTiming(2, {
			duration: 1200,
			easing: Easing.out(Easing.ease),
		}),
		-1,
		false,
	);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ scale: scale.value }],
			opacity: selected ? 1 - scale.value / 2 : 0,
			backgroundColor: colors.primary,
		};
	});

	return (
		<View>
			<View
				style={[
					styles.step,
					{ backgroundColor: selected || passed ? colors.primary : colors.neutral200 },
				]}
			/>
			<Animated.View
				style={[
					styles.step,
					{
						position: 'absolute',
					},
					animatedStyle,
				]}
			/>
		</View>
	);
};

type StepProps = {
	title: string;
	selected: boolean;
};

const StepTitle: React.FC<StepProps> = ({ title, selected }) => {
	const styles = useStyles({ selected });

	return <Text style={[styles.stepName]}>{title}</Text>;
};

type StyleProps = {
	selected: boolean;
};

const useStyles = makeStyles(({ colors }, { selected = false }: StyleProps) => ({
	container: {
		paddingVertical: 12,
		marginHorizontal: 48,
	},
	step: {
		width: 12,
		height: 12,
		borderRadius: 6,
		marginHorizontal: 8,
	},
	bgSelected: {
		backgroundColor: colors.primary,
	},
	line: {
		height: 1,
		flex: 1,
		backgroundColor: colors.neutral200,
	},
	viewFlex: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: 2,
	},
	viewStepName: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: 4,
	},
	stepName: {
		fontSize: 12,
		color: selected ? colors.primary : colors.neutral400,
	},
	stepSelected: {
		color: colors.primary,
	},
}));

export default StartProcessStep;
