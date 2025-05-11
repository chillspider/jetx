import analytics, { FirebaseAnalyticsTypes } from '@react-native-firebase/analytics';

class AnalyticsService {
	private analytics: FirebaseAnalyticsTypes.Module;

	constructor() {
		this.analytics = analytics();
	}

	public logCustomEvent(eventName: string, params?: Record<string, any>) {
		try {
			this.analytics.logEvent(eventName, params);
		} catch (error) {
			console.error('Failed to log event:', error);
		}
	}

	public logScreenView(screenName: string | undefined, screenClass: string | undefined) {
		if (!screenName) return;

		try {
			this.analytics.logScreenView({
				screen_name: screenName,
				screen_class: screenClass,
			});
		} catch (error) {
			console.error('Failed to log screen view:', error);
		}
	}
	public logUserLogin(method: string) {
		try {
			this.analytics.logLogin({ method });
		} catch (error) {
			console.error('Failed to log user login:', error);
		}
	}

	public logButtonClick(buttonName: string, additionalParams?: Record<string, any>) {
		this.logCustomEvent('button_click', {
			button_name: buttonName,
			...additionalParams,
		});
	}

	public logUserAction(actionName: string, additionalParams?: Record<string, any>) {
		this.logCustomEvent('user_action', {
			action_name: actionName,
			...additionalParams,
		});
	}

	public logError(errorMessage: string, errorCode?: string) {
		this.logCustomEvent('error', {
			error_message: errorMessage,
			error_code: errorCode,
		});
	}
}

export const analyticsService = new AnalyticsService();
