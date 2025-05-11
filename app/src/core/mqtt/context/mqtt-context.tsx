import { MqttClient } from 'mqtt';
import React, {
	createContext,
	PropsWithChildren,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react';

import useAppStateBackground from '../hooks/useAppStateReconnect';
import useMqttConnection from '../hooks/useMqttConnection';
import { emitStateError } from '../services/error-handler';
import { MqttData, MqttStatus } from '../services/mqtt-service';

type SubscribeToTopic = {
	topics: string[];
	options?: { qos: 0 | 1 | 2 };
};

type MqttContextType = {
	mqttClient?: MqttClient | null;
	mqttStatus: MqttStatus;
	mqttError: any;
	mqttData: MqttData | undefined;
	setDoMqttConnection: (value: boolean) => void;
	subscribeToTopics: (topics: SubscribeToTopic) => void;
};

const MqttContext = createContext<MqttContextType | string>(
	'useMqttContext should be used inside MqttProvider',
);

export const MqttProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const [doMqttConnection, setDoMqttConnection] = useState<boolean>(false);

	const { mqttClient, mqttData, mqttStatus, mqttError, setMqttError, setMqttStatus } =
		useMqttConnection(doMqttConnection);

	useAppStateBackground(mqttClient);

	// Ref to track subscribed topics and avoid redundant subscriptions
	const subscribedTopicsRef = useRef(new Set<string>());

	// Effect to clear subscribed topics when doMqttConnection changes to false
	useEffect(() => {
		if (!doMqttConnection) {
			subscribedTopicsRef.current.clear(); // Clear the set when disconnecting
		}
	}, [doMqttConnection]);

	const subscribeToTopics = ({ topics, options }: SubscribeToTopic) => {
		if (!mqttClient) return;

		const qos = options?.qos || 1;

		topics.forEach(topic => {
			if (subscribedTopicsRef.current.has(topic)) return;

			subscribedTopicsRef.current.add(topic);

			mqttClient.subscribe(topic, { qos }, (error, granted) => {
				if (error) {
					setMqttStatus('Error');
					emitStateError(setMqttError, 'MqttTopic', error);
				}
			});
		});
	};

	const value: MqttContextType = {
		mqttClient,
		mqttStatus,
		mqttError,
		mqttData,
		setDoMqttConnection,
		subscribeToTopics,
	};

	return <MqttContext.Provider {...{ value, children }} />;
};

export const useMqttContext = () => {
	const c = useContext(MqttContext);

	if (typeof c === 'string') {
		throw Error(c);
	}

	return c;
};
