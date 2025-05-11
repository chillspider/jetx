import { kioskSignOut } from "@/actions/auth/auth.action";
import { SESSION } from "@/constants";
import { getSession } from "@/libs/cookies";
import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { env } from "next-runtime-env";

const kioskClient: AxiosInstance = axios.create({
	baseURL: env("NEXT_PUBLIC_API_URL"),
	headers: {
		"Content-Type": "application/json",
	},
});

// Request interceptor to add the access token to headers
kioskClient.interceptors.request.use(
	async (config) => {
		if (config.headers && !config.headers.Authorization) {
			const session = await getSession(SESSION);
			config.headers.Authorization = `Bearer ${session?.accessToken ?? ""}`;
		}
		return config;
	},
	(error: AxiosError) => {
		return Promise.reject(error);
	}
);

// Response interceptor to handle responses globally if needed
kioskClient.interceptors.response.use(
	(response: AxiosResponse) => response,
	async (error: AxiosError) => {
		if (error.response?.status === 401) {
			await kioskSignOut();
		}

		return Promise.reject(error);
	}
);

export default kioskClient;
