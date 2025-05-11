"use server";

import { UserDto } from "@/models/user.dto";
import { SESSION_KEY } from "./constants";
import { cookies } from "next/headers";
import { decrypt, encrypt } from "./encrypt";
import { env } from "next-runtime-env";

export type SessionPayload = {
	user: UserDto;
	accessToken: string;
	expires: Date;
};

const secretKey = env("SECRET_KEY") || "secret";

export const getSession = async () => {
	try {
		const cookieStore = await cookies();
		const session = cookieStore.get(SESSION_KEY);
		if (!session?.value) return null;

		const decryptedPayload = await decryptSession(session.value);
		if (!decryptedPayload) return null;

		const isValid = await validateSession(decryptedPayload);
		if (!isValid) return null;

		return decryptedPayload;
	} catch (error) {
		console.error(error);
		return null;
	}
};

export const setSession = async (payload: SessionPayload) => {
	try {
		const cookieStore = await cookies();
		const encryptedPayload = await encryptSession(payload);

		cookieStore.set(SESSION_KEY, encryptedPayload, {
			httpOnly: true,
			secure: true,
			expires: payload.expires,
		});
	} catch (error) {
		console.error(error);
	}
};

export const removeSession = async () => {
	const cookieStore = await cookies();
	cookieStore.delete(SESSION_KEY);
};

export const decryptSession = async (
	session: string
): Promise<SessionPayload> => {
	const decryptedPayload = await decrypt<SessionPayload>(session, secretKey);
	return decryptedPayload;
};

export const encryptSession = async (
	payload: SessionPayload
): Promise<string> => {
	return encrypt(JSON.stringify(payload), secretKey);
};

export const validateSession = async (
	session: SessionPayload
): Promise<boolean> => {
	if (!session) return false;

	if (session.expires < new Date()) {
		return false;
	}

	if (!session.user || !session.accessToken) {
		return false;
	}

	return true;
};
