import { signOut } from "@/actions/auth/auth.action";
import { getSession } from "@/lib/cookies";
import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { env } from "next-runtime-env";

const httpClient: AxiosInstance = axios.create({
	baseURL: env("NEXT_PUBLIC_API_URL"),
	headers: {
		"Content-Type": "application/json",
	},
});

// Request interceptor to add the access token to headers
httpClient.interceptors.request.use(
	async (config) => {
		if (config.headers && !config.headers.Authorization) {
			const session = await getSession();
			config.headers.Authorization = `Bearer ${session?.accessToken ?? ""}`;
		}
		return config;
	},
	(error: AxiosError) => {
		return Promise.reject(error);
	}
);

// Response interceptor to handle responses globally if needed
httpClient.interceptors.response.use(
	(response: AxiosResponse) => response,
	(error: AxiosError) => {
		if (error.response?.status === 401) {
			signOut();
		}

		return Promise.reject(error);
	}
);

export default httpClient;
