"use server";

import { SESSION_KEY } from "@/lib/constants";
import {
	decryptSession,
	removeSession,
	setSession,
	validateSession,
} from "@/lib/cookies";
import { Routes } from "@/lib/routes";
import authApi from "@/services/auth/auth.service";
import { redirect, RedirectType } from "next/navigation";
import { NextRequest } from "next/server";
import { actionClient, ActionError } from "../safe-action";
import { z } from "zod";

const _redirect = (path: Routes) => {
	redirect(path, RedirectType.replace);
};

export const signIn = actionClient
	.schema(
		z.object({
			email: z.string().email(),
			password: z.string().min(1),
		})
	)
	.action(async ({ parsedInput }) => {
		const response = await authApi.login(parsedInput);

		const user = response?.data?.user;
		const accessToken = response?.data?.accessToken;

		if (user && accessToken) {
			await setSession({
				user,
				accessToken,
				expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			});
			_redirect(Routes.Home);
			return true;
		}

		throw new ActionError("Thông tin đăng nhập không hợp lệ!");
	});

export const signOut = actionClient.action(async () => {
	await removeSession();
	_redirect(Routes.Login);
});

export const updateSession = async (request: NextRequest): Promise<boolean> => {
	const session = request.cookies.get(SESSION_KEY);
	if (!session?.value) return false;

	try {
		const decryptedPayload = await decryptSession(session.value);
		if (!decryptedPayload) {
			await signOut();
			return false;
		}

		const isValid = await validateSession(decryptedPayload);
		if (!isValid) {
			await signOut();
			return false;
		}

		decryptedPayload.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		await setSession(decryptedPayload);

		return true;
	} catch (error) {
		console.error(error);
		await signOut();
		return false;
	}
};
