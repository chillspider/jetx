"use server";

import { cookies } from "next/headers";
import { decrypt, encrypt } from "./encrypt";
import { LoginResponse } from "@/models/responses/login.response";
import { env } from "next-runtime-env";

const secretKey = env("SECRET_KEY") || "secret";

export const getSession = async (key: string) => {
	const cookieStore = await cookies();
	const session = cookieStore.get(key);
	if (!session?.value) return null;

	try {
		const decryptedPayload = await validateSession(session.value);
		if (!decryptedPayload) {
			cookieStore.delete(key);
			return null;
		}

		return decryptedPayload;
	} catch (error) {
		cookieStore.delete(key);
		console.error(error);
		return null;
	}
};

export const setSession = async (key: string, payload: LoginResponse) => {
	try {
		const cookieStore = await cookies();
		const encryptedPayload = await encryptSession({
			accessToken: payload?.accessToken,
			user: payload?.user,
		});

		cookieStore.set(key, encryptedPayload, {
			httpOnly: true,
			secure: true,
		});
	} catch (error) {
		console.error(error);
	}
};

export const removeSession = async (key: string) => {
	try {
		const cookieStore = await cookies();
		cookieStore.set(key, "", {
			httpOnly: true,
			secure: true,
			expires: new Date(0),
		});
	} catch (error) {
		console.error(error);
	}
};

export const decryptSession = async (
	session: string
): Promise<LoginResponse> => {
	try {
		const decryptedPayload = await decrypt<LoginResponse>(session, secretKey);
		return decryptedPayload;
	} catch (error) {
		console.error(error);
		return null;
	}
};

export const encryptSession = async (
	payload: LoginResponse
): Promise<string> => {
	try {
		return encrypt(JSON.stringify(payload), secretKey);
	} catch (error) {
		console.error(error);
		return null;
	}
};

export const validateSession = async (
	value: string
): Promise<LoginResponse> => {
	if (!value) return;

	const decryptedPayload = await decryptSession(value);
	if (!decryptedPayload) return;

	if (!decryptedPayload.user || !decryptedPayload.accessToken) {
		return;
	}

	return decryptedPayload;
};
