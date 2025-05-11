/* eslint-disable consistent-return */
import 'react-native-get-random-values';

import { MqttClient } from 'mqtt';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { createMqttClient, MqttData, MqttStatus } from '../services/mqtt-service';

/**
 * @typedef {'Connected' | 'Disconnected' | 'Offline' | 'Reconnecting' | 'Error'} MqttStatus
 */

/**
 * @typedef {{ type: string, msg: string }} MqttError
 */

/**
 * @typedef {{ message: any, topic: string }} MqttData
 */

/**
 * @typedef {import('mqtt').MqttClient} MqttClient
 */

const useMqttConnection = (doMqttConnection: boolean) => {
	/**
	 * @type [MqttStatus, React.Dispatch<MqttStatus>]
	 */
	const [mqttStatus, setMqttStatus] = useState<MqttStatus>('Disconnected');

	/**
	 * @type [MqttError, React.Dispatch<MqttError>]
	 */
	const [mqttError, setMqttError] = useState({});

	/**
	 * @type [MqttData, React.Dispatch<MqttData>]
	 */
	const [mqttData, setMqttData] = useState<MqttData | undefined>(undefined);

	/**
	 * @type [MqttClient, React.Dispatch<MqttClient>]
	 */
	const [mqttClient, setMqttClient] = useState<MqttClient | null>(null);

	useEffect(() => {
		if (!doMqttConnection) {
			mqttClient?.end();
			setMqttClient(null);
			return;
		}

		const id = uuidv4();
		const client = createMqttClient({
			setMqttStatus,
			setMqttError,
			uniqueId: `app-client-${id}`,
			onMessage: data => {
				setMqttData(data);
			},
		});

		setMqttClient(client);

		return () => {
			if (client) {
				client.end();
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [doMqttConnection]);

	return {
		mqttClient,
		mqttData,
		mqttStatus,
		mqttError,
		setMqttStatus,
		setMqttError,
	};
};

export default useMqttConnection;
