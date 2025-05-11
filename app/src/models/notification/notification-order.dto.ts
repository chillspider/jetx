export interface NotificationOrderData {
	id?: string | undefined | null;
}

export interface NotificationData {
	data: any;
	type: string;
	deepLink?: string | undefined | null;
}

export interface MqttMessage {
	data: NotificationData;
}
