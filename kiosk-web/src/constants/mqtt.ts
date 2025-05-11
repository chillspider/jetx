import { IClientOptions } from "mqtt";
import { v4 as uuid } from "uuid";

export class MQTT_TOPICS {
	static ORDER = (id: string) => `order_${id}`;
	static KIOSK_PAYMENT = (deviceId: string) => `kiosk_payment_${deviceId}`;
}

export const MQTT_OPTIONS: IClientOptions = {
	protocol: "wss",
	port: 443,
	protocolVersion: 5,
	clientId: `kiosk-client-${uuid()}`,
	reconnectPeriod: 5000,
	queueQoSZero: true,
	resubscribe: true,
	clean: true,
	keepalive: 60,
	username: "username",
};
