import "@/styles/globals.css";

import type { Metadata } from "next";
import { APP_DESCRIPTION, APP_TITLE } from "@/lib/constants";
import { fontSans } from "@/lib/fonts";
import { WrapperProviders } from "@/providers/wrapper-providers";
import { unstable_noStore } from "next/cache";
import { PublicEnvScript } from "next-runtime-env";

export const metadata: Metadata = {
	title: {
		default: APP_TITLE,
		template: `%s | ${APP_TITLE}`,
	},
	description: APP_DESCRIPTION,
	icons: {
		icon: "/favicon.ico",
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	unstable_noStore();

	return (
		<html lang='en' className='mdl-js' suppressHydrationWarning>
			<head>
				<PublicEnvScript />
			</head>
			<body
				className={`${fontSans.variable} min-h-screen bg-background font-sans antialiased`}>
				<WrapperProviders>{children}</WrapperProviders>
			</body>
		</html>
	);
}
