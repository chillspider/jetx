"use server";

import { actionClient } from "@/libs/safe-action";
import kioskClientApi from "@/services/client/kiosk-client.service";
import { z } from "zod";

export const getClientSession = actionClient
	.schema(z.string())
	.action(async ({ parsedInput: sessionId }) => {
		const response = await kioskClientApi.getClientSession(sessionId);
		const payload = response?.data;
		return payload;
	});

export const getDeviceStatus = actionClient
	.schema(z.void())
	.action(async () => {
		const response = await kioskClientApi.getDeviceStatus();
		return response.data;
	});

export const createPayment = actionClient
	.schema(
		z.object({
			modeId: z.string().uuid(),
		})
	)
	.action(async ({ parsedInput: { modeId } }) => {
		const response = await kioskClientApi.createPayment(modeId);
		return response.data;
	});

export const getClientOrder = actionClient
	.schema(z.string())
	.action(async ({ parsedInput: id }) => {
		const response = await kioskClientApi.getClientOrder(id);
		return response.data;
	});
