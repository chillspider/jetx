"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import mqtt from "mqtt";
import { useEffect, useMemo, useRef, useState } from "react";

import { MQTT_OPTIONS } from "@/constants/mqtt";
import MqttContext from "./context";
import { ConnectorProps, Error, IMqttContext } from "./types";

export default function Connector({
	children,
	brokerUrl = "",
	options = {},
	parserMethod,
}: ConnectorProps) {
	const clientValid = useRef(false);
	const [connectionStatus, setStatus] = useState<string | Error>("Offline");
	const [client, setClient] = useState<mqtt.MqttClient | null>(null);

	useEffect(() => {
		if (!client && !clientValid.current) {
			onConnectClient();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [client, clientValid, brokerUrl, options]);

	// Only do this when the component unmounts
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => () => onRemoveClient(), [client, clientValid]);

	const onConnectClient = () => {
		// This synchronously ensures we won't enter this block again
		// before the client is asynchronously set
		clientValid.current = true;
		setStatus("Connecting");

		const mqttClient = mqtt.connect({
			...MQTT_OPTIONS,
			...options,
		});
		mqttClient.on("connect", () => {
			console.debug("on connect");
			setStatus("Connected");
			// For some reason setting the client as soon as we get it from connect breaks things
			setClient(mqttClient);
		});
		mqttClient.on("reconnect", () => {
			console.debug("on reconnect");
			setStatus("Reconnecting");
		});
		mqttClient.on("error", (err: any) => {
			console.log(`Connection error: ${err}`);
			setStatus(err.message);
		});
		mqttClient.on("offline", () => {
			console.debug("on offline");
			setStatus("Offline");
		});
		mqttClient.on("end", () => {
			console.debug("on end");
			setStatus("Offline");
		});
	};

	const onRemoveClient = () => {
		if (client) {
			console.log("closing mqtt client");
			client.end(true);
			setClient(null);
			clientValid.current = false;
		}
	};

	// This is to satisfy
	// https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/jsx-no-constructed-context-values.md
	const value: IMqttContext = useMemo<IMqttContext>(
		() => ({
			connectionStatus,
			client,
			parserMethod,
			onConnectClient,
			onRemoveClient,
		}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[connectionStatus, client, parserMethod]
	);

	return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
}
