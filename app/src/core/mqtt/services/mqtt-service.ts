import mqtt, { IClientOptions, IConnackPacket, MqttClient } from 'mqtt';

import { getAccessToken } from '@/core/store/auth/utils';
import { Env } from '@/env';

import { emitStateError } from './error-handler';

// Define the types for MqttStatus (assuming it's an enum or union)
type MqttStatus = 'Connected' | 'Error' | 'Disconnected' | 'Offline' | 'Reconnecting';

type MqttData = {
	topic: string;
	message: Buffer;
};

/**
 * Interface for the createMqttClient function options
 */
interface CreateMqttClientOptions {
	setMqttStatus: (status: MqttStatus) => void;
	setMqttError: (error: string) => void;
	uniqueId: string;
	onMessage: (data: MqttData) => void;
}

/**
 * Function to create an MQTT client
 * @param options - Configuration options for the MQTT client
 * @returns MqttClient - The configured MQTT client instance
 */

const createMqttClient = ({
	setMqttStatus,
	setMqttError,
	uniqueId,
	onMessage,
}: CreateMqttClientOptions): MqttClient => {
	const host = Env.MQTT_HOST || 'mqtt.vn01.wash24h.io';

	const protocolVersion = 5;
	const port = 443;
	const protocol: 'ws' | 'wss' = 'wss';

	const token = getAccessToken();

	const clientOptions: IClientOptions = {
		protocol,
		host,
		port,
		username: 'username',
		password: token || '',
		protocolVersion,
		clientId: uniqueId,
		reconnectPeriod: 5000,
		queueQoSZero: true,
		resubscribe: true,
		clean: true,
		keepalive: 60,
		properties:
			protocolVersion === 5
				? {
						sessionExpiryInterval: 600,
					}
				: undefined,
	};

	const client: MqttClient = mqtt
		.connect(clientOptions)
		.on('connect', (connack: IConnackPacket) => {
			setMqttStatus('Connected');
		})
		.on('error', (error: Error) => {
			setMqttStatus('Error');
			emitStateError(setMqttError, 'MqttGeneral', error);
		})
		.on('disconnect', (packet: any) => {
			setMqttStatus('Disconnected');
		})
		.on('offline', () => {
			setMqttStatus('Offline');
		})
		.on('reconnect', () => {
			setMqttStatus('Reconnecting');
		})
		.on('close', () => {
			setMqttStatus('Disconnected');
		})
		.on('message', (topic: string, message: Buffer) => {
			onMessage({ topic, message });
		});

	return client;
};

export { createMqttClient };

export type { CreateMqttClientOptions, MqttData, MqttStatus };
