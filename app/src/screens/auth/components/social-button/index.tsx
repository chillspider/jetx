import { appleAuth } from '@invertase/react-native-apple-authentication';
import {
	GoogleSignin,
	isErrorWithCode,
	statusCodes,
} from '@react-native-google-signin/google-signin';
import { makeStyles, Text } from '@rneui/themed';
import * as Sentry from '@sentry/react-native';
import React, { useCallback } from 'react';
import { TouchableOpacity } from 'react-native';

import IcApple from '@/assets/svgs/ic_apple.svg';
import IcGoogle from '@/assets/svgs/ic_google.svg';
import { Box } from '@/components';
import { Env } from '@/env';
import { AuthProvider } from '@/models/auth/enums/auth-provider.enum';
import { LoginDto } from '@/models/auth/request/login.dto';

GoogleSignin.configure({
	webClientId: `${Env.WEB_CLIENT_ID}.apps.googleusercontent.com`,
	iosClientId: `${Env.IOS_CLIENT_ID}.apps.googleusercontent.com`,
	offlineAccess: true,
});

const useStyles = makeStyles(({ colors }) => ({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		borderRadius: 40,
		backgroundColor: colors.neutral100,
		flex: 1,
	},
	buttonTitle: {
		fontWeight: '500',
		paddingLeft: 8,
	},
}));

type Props = {
	onSignIn: (request: LoginDto) => void;
};

const SocialButton: React.FC<Props> = ({ onSignIn }) => {
	const styles = useStyles();

	const onAppleButtonPress = useCallback(async () => {
		try {
			const appleAuthRequestResponse = await appleAuth.performRequest({
				requestedOperation: appleAuth.Operation.LOGIN,
				requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
			});

			if (!appleAuthRequestResponse.identityToken) {
				throw new Error('Apple Sign-In failed - no identify token returned');
			}

			const { identityToken, email, fullName } = appleAuthRequestResponse;

			// const isPrivateEmail = email?.endsWith('@privaterelay.appleid.com');

			if (identityToken) {
				onSignIn({
					token: identityToken,
					email: email ?? '',
					firstName: fullName?.familyName ?? '',
					lastName: fullName?.givenName ?? '',
					provider: AuthProvider.apple,
				});
			} else {
				//! id token not found
				Sentry.captureException('Apple Sign-In failed - no identify token returned');
			}
		} catch (error) {
			Sentry.captureException(error);
			if ((error as any).code === appleAuth.Error.CANCELED) {
				//!
			}
		}
		//! Call api here
	}, [onSignIn]);

	const onGoogleSignIn = useCallback(async () => {
		try {
			await GoogleSignin.hasPlayServices({
				showPlayServicesUpdateDialog: true,
			});

			const { idToken, user } = await GoogleSignin.signIn();

			if (idToken) {
				onSignIn({
					token: idToken,
					email: user?.email ?? '',
					firstName: user?.familyName ?? '',
					lastName: user?.givenName ?? '',
					provider: AuthProvider.google,
				});
			} else {
				throw new Error('Google Sign-In failed - no identify token returned');
			}
		} catch (error) {
			Sentry.captureException(error);
			if (isErrorWithCode(error)) {
				switch (error.code) {
					case statusCodes.SIGN_IN_CANCELLED:
						console.log('Sign in cancelled');
						break;
					case statusCodes.IN_PROGRESS:
						console.log('Sign in in progress');
						break;
					case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
						console.log('Play services not available');
						break;
					default:
						console.log(JSON.stringify(error));
						break;
				}
			} else {
				console.log(JSON.stringify(error));
			}
		}
	}, [onSignIn]);

	return (
		<Box flexDirection="row" justifyContent="center" alignContent="center">
			<TouchableOpacity onPress={onGoogleSignIn} style={styles.button}>
				<IcGoogle />
				<Text style={styles.buttonTitle}>Google</Text>
			</TouchableOpacity>
			{appleAuth.isSupported && (
				<>
					<Box width={12} />
					<TouchableOpacity onPress={onAppleButtonPress} style={styles.button}>
						<IcApple />
						<Text style={styles.buttonTitle}>Apple</Text>
					</TouchableOpacity>
				</>
			)}
		</Box>
	);
};

export default SocialButton;
