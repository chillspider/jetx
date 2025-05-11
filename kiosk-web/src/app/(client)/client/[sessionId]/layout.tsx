import { getClientSession } from "@/actions/client/kiosk-client.action";
import Navbar from "@/components/navbar";
import { KioskClientProvider } from "@/contexts/client/kiosk-client.context";
import Connector from "@/libs/mqtt/connector";
import { env } from "next-runtime-env";

export default async function ClientLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ sessionId: string }>;
}) {
	const { sessionId } = await params;

	const result = await getClientSession(sessionId);

	return (
		<section className='w-dvw h-dvh min-w-svw min-h-svh max-w-lvw max-h-lvh p-4 flex flex-col'>
			<Connector
				options={{
					password: result?.data?.accessToken || "",
					host: env("NEXT_PUBLIC_MQTT_URL"),
				}}>
				<KioskClientProvider profile={result?.data}>
					<Navbar deviceNo={result?.data?.device?.deviceNo ?? ""} />
					{children}
				</KioskClientProvider>
			</Connector>
		</section>
	);
}
