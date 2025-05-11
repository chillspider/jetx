/* eslint-disable @typescript-eslint/no-explicit-any */
import { IClientSubscribeOptions } from "mqtt";
import { matches } from "mqtt-pattern";
import { useCallback, useContext, useEffect, useState } from "react";

import MqttContext from "./context";
import { IMqttContext as Context, IMessage, IUseSubscription } from "./types";

export default function useSubscription(
	topic: string | string[],
	options: IClientSubscribeOptions = {} as IClientSubscribeOptions
): IUseSubscription {
	const {
		client,
		connectionStatus,
		parserMethod,
		onConnectClient,
		onRemoveClient,
	} = useContext<Context>(MqttContext);

	const [message, setMessage] = useState<IMessage | undefined>(undefined);

	const subscribe = useCallback(() => {
		client?.subscribe(topic, options);
	}, [client, options, topic]);

	const unsubscribe = useCallback(() => {
		client?.unsubscribe(topic, options);
		setMessage(undefined);
	}, [client, options, topic]);

	const callback = useCallback(
		(receivedTopic: string, receivedMessage: any) => {
			if ([topic].flat().some((rTopic) => matches(rTopic, receivedTopic))) {
				setMessage({
					topic: receivedTopic,
					message:
						parserMethod?.(receivedMessage) || receivedMessage.toString(),
				});
			}
		},
		[parserMethod, topic]
	);

	useEffect(() => {
		if (client?.connected) {
			subscribe();
			client.on("message", callback);
		}
		return () => {
			unsubscribe();
			client?.off("message", callback); // Clean up the listener
		};
	}, [client, subscribe, callback, unsubscribe]);

	return {
		client,
		topic,
		message,
		connectionStatus,
		onConnectClient,
		onRemoveClient,
		unsubscribe,
	};
}
