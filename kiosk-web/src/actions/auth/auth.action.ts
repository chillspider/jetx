"use server";

import { CLIENT_SESSION, SESSION } from "@/constants";
import { removeSession, setSession, validateSession } from "@/libs/cookies";
import { Routes } from "@/libs/routes";
import { actionClient, ActionError } from "@/libs/safe-action";
import kioskApi from "@/services/kiosk/kiosk.service";
import { redirect, RedirectType } from "next/navigation";
import { NextRequest } from "next/server";
import { z } from "zod";

export const onboard = actionClient
	.schema(z.string())
	.action(async ({ parsedInput: code }) => {
		const response = await kioskApi.onboard(code);
		const payload = response.data;

		if (payload) {
			await setSession(SESSION, payload);
			redirect(Routes.Kiosk, RedirectType.replace);
		}

		throw new ActionError("Failed to onboard");
	});

export const kioskSignOut = actionClient.schema(z.void()).action(async () => {
	await removeSession(SESSION);
	redirect(Routes.Onboard, RedirectType.replace);
});

export const clientSignOut = actionClient.schema(z.void()).action(async () => {
	await removeSession(CLIENT_SESSION);
	redirect(Routes.Home, RedirectType.replace);
});

export const ensureKioskSession = actionClient
	.schema(z.instanceof(NextRequest))
	.action(async ({ parsedInput: request }) => {
		return verifySession(request, SESSION);
	});

export const ensureClientSession = actionClient
	.schema(z.instanceof(NextRequest))
	.action(async ({ parsedInput: request }) => {
		return verifySession(request, CLIENT_SESSION);
	});

export const verifySession = async (
	request: NextRequest,
	key: string
): Promise<boolean> => {
	try {
		const session = request.cookies.get(key);
		if (!session?.value) return false;

		const isValid = await validateSession(session.value);
		if (!isValid) {
			await removeSession(key);
		}

		return !!isValid;
	} catch (error) {
		await removeSession(key);
		console.error(error);
		return false;
	}
};
