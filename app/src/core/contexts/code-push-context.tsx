/* eslint-disable react-hooks/exhaustive-deps */
import React, { PropsWithChildren, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState } from 'react-native';
import CodePush from 'react-native-code-push';
import { getReadableVersion } from 'react-native-device-info';

type ContextType = {
	version: string;
	isChecking: boolean;
};

export const CodePushContext = React.createContext<ContextType | string>(
	'useCodePush should be used inside CodePushProvider',
);

CodePushContext.displayName = 'CodePushContext';

export const CodePushProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const [version, setVersion] = React.useState('');
	const [isChecking, setChecking] = React.useState(true);
	const { t } = useTranslation();

	useEffect(() => {
		const syncCodePush = () => {
			if (__DEV__) {
				return;
			}

			CodePush.sync({
				updateDialog: {
					appendReleaseDescription: true,
					mandatoryContinueButtonLabel: t('code_push.mandatory_label'),
					mandatoryUpdateMessage: t('code_push.mandatory_message'),
					optionalIgnoreButtonLabel: t('code_push.ignore_label'),
					optionalInstallButtonLabel: t('code_push.install_label'),
					optionalUpdateMessage: t('code_push.optional_message'),
					title: t('code_push.title'),
				},
				installMode: CodePush.InstallMode.ON_NEXT_RESTART,
				mandatoryInstallMode: CodePush.InstallMode.IMMEDIATE,
			});
		};

		syncCodePush();

		const subscription = AppState.addEventListener('change', nextAppState => {
			if (nextAppState === 'active') {
				syncCodePush();
			}
		});

		return () => {
			subscription.remove();
		};
	}, []);

	useEffect(() => {
		if (!__DEV__) {
			setChecking(true);
			CodePush.getUpdateMetadata(CodePush.UpdateState.LATEST)
				.then(res => setVersion(res ? `${res.label} (${res.appVersion})` : getReadableVersion()))
				.finally(() => {
					setChecking(false);
				});
		} else {
			setVersion(`${getReadableVersion()} (Sideloaded)`);
			setChecking(false);
		}
	}, []);

	const value: ContextType = {
		version,
		isChecking,
	};

	return <CodePushContext.Provider {...{ value, children }} />;
};

export const useCodePush = () => {
	const context = React.useContext(CodePushContext);
	if (typeof context === 'string') {
		throw new Error(context);
	}
	return context;
};
