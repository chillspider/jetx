/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-param-reassign */
import React, { useCallback, useEffect } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Dimensions, StyleSheet, TouchableOpacity, View, ViewProps, ViewStyle } from 'react-native';
import Reanimated, {
	cancelAnimation,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSpring,
	WithSpringConfig,
	withTiming,
} from 'react-native-reanimated';

import useLayout from '@/core/hooks/useLayout';

export interface BarcodeMaskProps {
	lineAnimationDuration?: number;
	showAnimatedLine?: boolean;
	animatedLineOrientation?: 'vertical' | 'horizontal';
	animatedLineThickness?: number;
	width?: number;
	height?: number;
	outerMaskOpacity?: number;
	backgroundColor?: string;
	edgeColor?: string;
	edgeWidth?: number;
	edgeHeight?: number;
	edgeBorderWidth?: number;
	edgeRadius?: number;
	animatedLineColor?: string;
	isActive?: boolean;
	onPress?: (event?: GestureResponderEvent) => void;
	topComponent?: React.ReactNode;
	bottomComponent?: React.ReactNode;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MASK_PADDING = 8;
const PADDING = 40;
const DEFAULT_WIDTH = SCREEN_WIDTH - PADDING * 2;
const DEFAULT_HEIGHT = SCREEN_HEIGHT / 3;

const checkNumber = (value: any, defaultValue = 0) => {
	value = Number(value);
	if (typeof value === 'number' && !isNaN(value) && value !== null) {
		return value;
	}
	return defaultValue;
};

const springConfig: WithSpringConfig = {
	damping: 15,
	stiffness: 100,
	mass: 0.5,
};

const BarcodeMask: React.FC<BarcodeMaskProps> = ({
	animatedLineColor = '#FFFFFF',
	outerMaskOpacity = 0.25,
	lineAnimationDuration = 2000,
	animatedLineOrientation = 'horizontal',
	animatedLineThickness = 3,
	edgeColor = '#FFFFFF',
	width: defaultWidth = DEFAULT_WIDTH,
	height: defaultHeight = DEFAULT_HEIGHT,
	showAnimatedLine = true,
	backgroundColor = '#000000',
	edgeWidth = 20,
	edgeHeight = 20,
	edgeBorderWidth = 4,
	edgeRadius = 8,
	isActive = true,
	onPress,
	topComponent,
	bottomComponent,
}) => {
	const translationY = useSharedValue(0);
	const translationX = useSharedValue(0);
	const lineWidth = useSharedValue<any>(0);
	const lineHeight = useSharedValue<any>(0);
	const maskHight = useSharedValue<any>(defaultHeight);
	const maskWidth = useSharedValue<any>(defaultWidth);
	const outMaskWidthHight = useSharedValue<any>(0);
	const outMaskWidthWidth = useSharedValue<any>(0);
	const outMaskHightHight = useSharedValue<any>(0);
	const { width, height, portrait } = useLayout();
	const opacity = outerMaskOpacity || 1;
	const EDGE_WIDTH = checkNumber(edgeWidth, 25);
	const EDGE_HEIGHT = checkNumber(edgeHeight, 25);
	const EDGE_BORDER_WIDTH = checkNumber(edgeBorderWidth, 4);
	const EDGE_RADIUS = checkNumber(edgeRadius, 0);

	const TouchableOpacityAnimated = Reanimated.createAnimatedComponent(TouchableOpacity);

	const styleLine = useAnimatedStyle(() => {
		return {
			transform: [
				{
					translateY: translationY.value,
				},
				{
					translateX: translationX.value,
				},
			],
			width: lineWidth.value,
			height: lineHeight.value,
		} as ViewStyle;
	});

	const maskStyle = useAnimatedStyle(() => {
		return {
			width: maskWidth.value,
			height: maskHight.value,
		};
	});

	const outMaskStyleWidth = useAnimatedStyle(() => {
		return {
			height: outMaskWidthWidth.value,
			width: outMaskWidthHight.value,
		};
	});

	const outMaskStyleHight = useAnimatedStyle(() => {
		return {
			height: outMaskHightHight.value,
		};
	});

	const setAnimation = (value: any, config: WithSpringConfig = springConfig) => {
		'worklet';

		return withSpring(value, config);
	};

	const setAnimationTranslation = (value = 0) => {
		return withRepeat(
			withTiming(value, {
				duration: checkNumber(lineAnimationDuration, 2000),
			}),
			-1,
			true,
		);
	};

	useEffect(() => {
		maskHight.value = setAnimation(checkNumber(defaultHeight, DEFAULT_HEIGHT));
		maskWidth.value = setAnimation(checkNumber(defaultWidth, DEFAULT_WIDTH));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [defaultHeight, defaultWidth]);

	useEffect(() => {
		const _maskHight = checkNumber(defaultHeight, DEFAULT_HEIGHT);
		const _maskWidth = checkNumber(defaultWidth, DEFAULT_WIDTH);
		outMaskHightHight.value = (height - _maskHight) / 2;
		outMaskWidthWidth.value = _maskHight;
		outMaskWidthHight.value = (width - _maskWidth) / 2;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [height, width, defaultHeight, defaultWidth, portrait]);

	useEffect(() => {
		if (isActive) {
			const lineThickness = checkNumber(animatedLineThickness, 2);
			const _maskHight = checkNumber(defaultHeight, DEFAULT_HEIGHT);
			const _maskWidth = checkNumber(defaultWidth, DEFAULT_WIDTH);
			if (animatedLineOrientation && animatedLineOrientation === 'vertical') {
				translationX.value = 0;
				translationY.value = 0;
				lineHeight.value = setAnimation(_maskHight);
				lineWidth.value = setAnimation(lineThickness);
				translationX.value = setAnimationTranslation(_maskWidth - MASK_PADDING * 2);
			} else {
				translationX.value = 0;
				translationY.value = 0;
				lineHeight.value = setAnimation(lineThickness);
				lineWidth.value = setAnimation(_maskWidth);
				translationY.value = setAnimationTranslation(_maskHight - MASK_PADDING * 2);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		lineAnimationDuration,
		defaultHeight,
		defaultWidth,
		animatedLineOrientation,
		animatedLineThickness,
		isActive,
	]);

	useEffect(() => {
		if (isActive === false) {
			cancelAnimation(translationY);
			cancelAnimation(translationX);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isActive]);

	const Edge = useCallback(
		({ index, style, ...rest }: ViewProps & { index: number }) => {
			const edgeAnimationStyle = useAnimatedStyle(() => {
				'worklet';

				return {
					right: setAnimation(
						index % 2 === 0
							? -(EDGE_BORDER_WIDTH - 1)
							: maskWidth.value - EDGE_WIDTH + EDGE_BORDER_WIDTH,
						springConfig,
					),
				};
			});
			return (
				<Reanimated.View
					style={[
						styles.borders,
						{
							width: EDGE_WIDTH,
							height: EDGE_HEIGHT,
							borderColor: edgeColor,
							borderWidth: EDGE_BORDER_WIDTH,
							borderLeftWidth: index % 2 === 0 ? 0 : EDGE_BORDER_WIDTH,
							borderRightWidth: index % 2 === 0 ? EDGE_BORDER_WIDTH : 0,
							borderTopWidth: 0,
							borderBottomRightRadius: index % 2 === 0 ? EDGE_RADIUS : 0,
							borderBottomLeftRadius: index % 2 === 0 ? 0 : EDGE_RADIUS,
						},
						style,
						edgeAnimationStyle,
					]}
					{...rest}
				/>
			);
		},
		[EDGE_WIDTH, EDGE_HEIGHT, edgeColor, EDGE_BORDER_WIDTH, EDGE_RADIUS, maskWidth.value],
	);

	return (
		<Reanimated.View style={[styles.container]}>
			<TouchableOpacityAnimated
				onPress={onPress}
				activeOpacity={1}
				style={[styles.mask, maskStyle]}
			>
				{Array.from({ length: 2 }).map((_, index) => {
					return (
						<Edge
							key={index.toString()}
							index={index}
							style={{
								top: -(EDGE_BORDER_WIDTH - 1),
								transform: [{ rotate: index % 2 === 0 ? '270deg' : '90deg' }],
							}}
						/>
					);
				})}
				{Array.from({ length: 2 }).map((_, index) => {
					return (
						<Edge
							key={index.toString()}
							index={index}
							style={{
								bottom: -(EDGE_BORDER_WIDTH - 1),
							}}
						/>
					);
				})}
				{showAnimatedLine ? (
					<Reanimated.View
						style={[
							styles.line,
							{
								backgroundColor: animatedLineColor,
								top: animatedLineOrientation === 'vertical' ? EDGE_BORDER_WIDTH : 0,
							},
							styleLine,
						]}
					/>
				) : null}
			</TouchableOpacityAnimated>
			{Array.from({ length: 2 }).map((_, index) => {
				return (
					<Reanimated.View
						key={index.toString()}
						style={[
							styles.back,
							{ backgroundColor },
							index % 2 === 0 ? { top: 0 } : { bottom: 0 },
							{
								left: 0,
								right: 0,
								opacity,
							},
							outMaskStyleHight,
						]}
					/>
				);
			})}
			{Array.from({ length: 2 }).map((_, index) => {
				return (
					<Reanimated.View
						key={index.toString()}
						style={[
							styles.back,
							{ backgroundColor },
							index % 2 === 0 ? { left: 0 } : { right: 0 },
							{
								opacity,
							},
							outMaskStyleWidth,
						]}
					/>
				);
			})}
			{Array.from({ length: 2 }).map((_, index) => {
				return (
					<Reanimated.View
						key={`co-${index}`}
						style={[
							styles.back,
							index % 2 === 0 ? { top: 0 } : { bottom: 0 },
							{
								left: 0,
								right: 0,
							},
							outMaskStyleHight,
						]}
					>
						{index % 2 === 0 && !!topComponent && (
							<View
								style={{
									position: 'absolute',
									bottom: 12,
									left: PADDING,
									right: PADDING,
									alignItems: 'center',
								}}
							>
								{topComponent}
							</View>
						)}
						{index % 2 !== 0 && !!bottomComponent && (
							<View
								style={{
									position: 'absolute',
									top: 12,
									left: PADDING,
									right: PADDING,
									alignItems: 'center',
								}}
							>
								{bottomComponent}
							</View>
						)}
					</Reanimated.View>
				);
			})}
		</Reanimated.View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		position: 'absolute',
		top: 0,
		left: 0,
		height: '100%',
		width: '100%',
	},
	back: {
		position: 'absolute',
	},
	mask: {
		position: 'relative',
		maxHeight: '100%',
		paddingHorizontal: MASK_PADDING,
		paddingVertical: MASK_PADDING,
	},
	line: {
		maxWidth: '100%',
		maxHeight: '100%',
	},
	borders: {
		position: 'absolute',
	},
});

export default BarcodeMask;
