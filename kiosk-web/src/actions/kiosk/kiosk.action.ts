"use server";

import { SESSION } from "@/constants";
import { getSession } from "@/libs/cookies";
import { actionClient } from "@/libs/safe-action";
import kioskApi from "@/services/kiosk/kiosk.service";
import { z } from "zod";

export const getKioskProfile = actionClient
	.schema(z.void())
	.action(async () => {
		const response = await kioskApi.getProfile();

		if (!response?.data) {
			return null;
		}

		const session = await getSession(SESSION);
		return {
			profile: response?.data,
			token: session?.accessToken,
		};
	});

export const refreshKioskQR = actionClient.schema(z.void()).action(async () => {
	const response = await kioskApi.refreshQRCode();
	return response.data;
});

export const kioskHeartbeat = actionClient.schema(z.void()).action(async () => {
	const response = await kioskApi.heartbeat();
	return response.data;
});

export const getKioskOrder = actionClient
	.schema(z.string())
	.action(async ({ parsedInput: id }) => {
		const response = await kioskApi.getOrder(id);
		return response.data;
	});
