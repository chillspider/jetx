/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState, useEffect } from "react";

import {
	Packet,
	IClientOptions,
	OnMessageCallback,
	IClientSubscribeOptions as SubscribeOptions,
	IClientPublishOptions as PublishOptions,
	ClientSubscribeCallback,
	ISubscriptionGrant,
	PacketCallback,
	MqttClient,
	OnConnectCallback,
	OnErrorCallback,
} from "mqtt";
import { useLatest } from "@/hooks/use-latest";
import { useBoolean } from "@/hooks/use-boolean";
import { useUnmount } from "@/hooks/use-unmount";
import mqtt from "mqtt";

export enum ReadyState {
	Connecting = 0,
	Open = 1,
	Closing = 2,
	Closed = 3,
}

export interface Options extends IClientOptions {
	manual?: boolean;
	onConnect?: OnConnectCallback;
	onMessage?: OnMessageCallback;
	onReconnect?: () => void;
	onClose?: () => void;
	onError?: OnErrorCallback;
}

export function useMqtt(
	url?: string,
	{
		manual = false,
		onConnect,
		onClose,
		onReconnect,
		onMessage,
		onError,
		...rest
	}: Options = {}
) {
	const mqttUrl = useRef(url);
	const mqttOpts = useRef(rest);
	const onConnectRef = useLatest(onConnect);
	const onCloseRef = useLatest(onClose);
	const onReconnectRef = useLatest(onReconnect);
	const onMessageRef = useLatest(onMessage);
	const onErrorRef = useLatest(onError);

	const mqttRef = useRef<MqttClient>(null);

	const unmountedRef = useRef(false);
	const [isConnected, isConnectedAction] = useBoolean();
	const [messageMap, setMessageMap] = useState<Record<string, any>>({});

	useEffect(() => {
		if (!manual) {
			connectMqtt();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [url, manual]);

	useUnmount(() => {
		unmountedRef.current = true;
		disconnect();
	});

	const connectMqtt = (
		url: string = mqttUrl.current,
		opts?: IClientOptions
	) => {
		mqttUrl.current = url;
		mqttOpts.current = {
			...mqttOpts.current,
			...opts,
		};

		if (mqttRef.current) {
			mqttRef.current.end();
		}

		if (!mqttUrl.current) return;

		const mt = mqtt.connect(mqttUrl.current, mqttOpts.current);

		mt.on("connect", (event) => {
			if (unmountedRef.current) {
				return;
			}
			isConnectedAction.setTrue();
			onConnectRef.current?.(event);
		});

		mt.on("reconnect", (...args) => {
			if (unmountedRef.current) {
				return;
			}

			onReconnectRef.current?.(...args);
		});

		mt.on("message", (...args) => {
			if (unmountedRef.current) {
				return;
			}

			onMessageRef.current?.(...args);
			handleMessage(...args);
		});

		mt.on("close", () => {
			if (unmountedRef.current) {
				return;
			}

			isConnectedAction.setFalse();
			onCloseRef.current?.();
		});

		mt.on("error", (error) => {
			if (unmountedRef.current) {
				return;
			}

			onErrorRef.current?.(error);
		});

		mqttRef.current = mt;
	};

	const disconnect = () => {
		if (mqttRef.current?.connected) {
			mqttRef.current.end();
		}
	};

	const handleMessage: OnMessageCallback = (topic: string, payload: Buffer) => {
		const data = JSON.parse(payload.toString());

		setMessageMap((prev) => ({
			...prev,
			[topic]: data,
		}));
	};

	const publish = (
		topic: string,
		message: string | Buffer,
		opts?: PublishOptions,
		callback?: PacketCallback
	) => {
		return new Promise<Packet>((resolve, reject) => {
			if (mqttRef.current?.connected) {
				mqttRef.current.publish(
					topic,
					message,
					opts,
					(error: any, packet: any) => {
						callback?.(error, packet);
						if (error) {
							reject(error);
							return;
						}

						resolve(packet);
					}
				);
				return;
			}

			reject("mqtt no connected");
		});
	};

	const reconnect = () => {
		mqttRef.current?.reconnect();
	};

	const subscribe = (
		topic: string,
		opts: SubscribeOptions = {} as unknown as SubscribeOptions,
		callback?: ClientSubscribeCallback
	) => {
		return new Promise<ISubscriptionGrant[]>((resolve, reject) => {
			if (mqttRef.current?.connected) {
				mqttRef.current?.subscribe(topic, opts, (error: any, granted: any) => {
					callback?.(error, granted);
					if (error) {
						reject(error);
						return;
					}

					resolve(granted);
				});
				return;
			}

			reject("mqtt no connected");
		});
	};

	const unsubscribe = (
		topic: string | string[],
		opts?: object,
		callback?: PacketCallback
	) => {
		// Remove message map
		setMessageMap((prev) => {
			const newMessageMap = { ...prev };
			if (Array.isArray(topic)) {
				topic.forEach((t) => delete newMessageMap[t]);
			} else {
				delete newMessageMap[topic];
			}
			return newMessageMap;
		});

		return new Promise<Packet>((resolve, reject) => {
			if (mqttRef.current?.connected) {
				mqttRef.current?.unsubscribe(topic, opts, (error: any, packet: any) => {
					callback?.(error, packet);
					if (error) {
						reject(error);
						return;
					}

					resolve(packet);
				});
				return;
			}

			reject(Error("mqtt no connected"));
		});
	};

	return {
		messageMap,
		connected: isConnected,
		mqttIns: mqttRef.current,
		connect: connectMqtt,
		reconnect: reconnect,
		disconnect: disconnect,
		subscribe: subscribe,
		unsubscribe: unsubscribe,
		publish: publish,
	};
}

export type { SubscribeOptions };
