import { Button, makeStyles, Text, useTheme } from '@rneui/themed';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalProps, TouchableWithoutFeedback, View } from 'react-native';

import { Box } from '../box';

type Props = Partial<ModalProps> & {
	title?: string;
	description?: string;
	closeLabel?: string;
	confirmLabel?: string;
	isRequired?: boolean | undefined;
	actionVisible?: boolean;
	isVisible?: boolean;
	onClosed?: () => void;
	onConfirm?: () => void;
};

const Dialog: React.FC<Props> = ({
	isVisible,
	children,
	title,
	description,
	closeLabel,
	confirmLabel,
	isRequired = false,
	actionVisible = true,
	style,
	onClosed,
	onConfirm,
	...props
}) => {
	const {
		theme: { colors, spacing },
	} = useTheme();

	const styles = useStyles();

	const { t } = useTranslation();

	const onBackdropPress = useCallback(() => {
		if (!isRequired && !!onClosed) {
			onClosed();
		}
	}, [isRequired, onClosed]);

	return (
		<View>
			<Modal
				{...props}
				animationType="fade"
				visible={isVisible}
				transparent
				onRequestClose={onBackdropPress}
			>
				<TouchableWithoutFeedback onPress={onBackdropPress}>
					<View style={styles.modal}>
						<TouchableWithoutFeedback onPress={() => {}}>
							<Box
								backgroundColor={colors.background}
								borderRadius={spacing.xl}
								alignItems="center"
								p={spacing.xl}
							>
								<Text h4 style={styles.title}>
									{title ?? t('notificationTitle')}
								</Text>
								<Box height={24} />
								{!!description && <Text style={styles.description}>{description}</Text>}
								{children}
								{actionVisible && (
									<Box flexDirection="row" justifyContent="space-between" mt={40}>
										{!isRequired && (
											<>
												<Button
													containerStyle={styles.flex}
													title={closeLabel ?? t('close')}
													buttonStyle={styles.closeButton}
													titleStyle={styles.closeTitle}
													onPress={onClosed}
												/>
												<Box width={8} />
											</>
										)}
										<Button
											containerStyle={styles.flex}
											title={confirmLabel ?? t('confirm')}
											titleStyle={styles.confirmTitle}
											onPress={onConfirm}
										/>
									</Box>
								)}
							</Box>
						</TouchableWithoutFeedback>
					</View>
				</TouchableWithoutFeedback>
			</Modal>
		</View>
	);
};

const useStyles = makeStyles(({ colors }) => ({
	modal: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 16,
	},
	flex: {
		flex: 1,
	},
	closeButton: {
		backgroundColor: colors.primary100,
	},
	closeTitle: {
		color: colors.primary,
		fontWeight: '400',
	},
	confirmTitle: {
		fontWeight: '400',
	},
	xButton: {
		position: 'absolute',
		top: 16,
		right: 16,
	},
	title: {
		textAlign: 'center',
	},
	description: {
		textAlign: 'center',
	},
}));

export default Dialog;
