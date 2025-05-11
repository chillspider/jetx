import { clientSignOut } from "@/actions/auth/auth.action";
import { CLIENT_SESSION } from "@/constants";
import { getSession } from "@/libs/cookies";
import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { env } from "next-runtime-env";

const publicClient: AxiosInstance = axios.create({
	baseURL: env("NEXT_PUBLIC_API_URL"),
	headers: {
		"Content-Type": "application/json",
	},
});

// Request interceptor to add the access token to headers
publicClient.interceptors.request.use(
	async (config) => {
		if (config.headers && !config.headers.Authorization) {
			const session = await getSession(CLIENT_SESSION);
			config.headers.Authorization = `Bearer ${session?.accessToken ?? ""}`;
		}
		return config;
	},
	(error: AxiosError) => {
		return Promise.reject(error);
	}
);

// Response interceptor to handle responses globally if needed
publicClient.interceptors.response.use(
	(response: AxiosResponse) => response,
	async (error: AxiosError) => {
		if (error.response?.status === 401) {
			await clientSignOut();
		}

		return Promise.reject(error);
	}
);

export default publicClient;
