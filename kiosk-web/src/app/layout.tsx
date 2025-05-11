import "@/styles/globals.css";

import type { Metadata } from "next";
import { unstable_noStore } from "next/cache";
import { fontSans } from "@/libs/fonts";
import { AppProvider } from "@/providers/app-provider";
import { APP_DESCRIPTION, APP_NAME } from "@/constants";
import { PublicEnvScript } from "next-runtime-env";

export const metadata: Metadata = {
	title: {
		default: APP_NAME,
		template: `%s | ${APP_NAME}`,
	},
	description: APP_DESCRIPTION,
	icons: [
		{
			rel: "apple-touch-icon",
			url: "/apple-touch-icon.png",
		},
		{
			rel: "icon",
			type: "image/png",
			sizes: "32x32",
			url: "/favicon-32x32.png",
		},
		{
			rel: "icon",
			type: "image/png",
			sizes: "16x16",
			url: "/favicon-16x16.png",
		},
		{
			rel: "icon",
			url: "/favicon.ico",
		},
	],
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	unstable_noStore();

	return (
		<html lang='vi' suppressHydrationWarning>
			<head>
				<PublicEnvScript />
			</head>
			<body
				className={`${fontSans.variable} bg-background antialiased w-dvw h-dvh min-w-svw min-h-svh max-w-lvw max-h-lvh`}>
				<AppProvider>{children}</AppProvider>
			</body>
		</html>
	);
}
