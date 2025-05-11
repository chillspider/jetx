import { getKioskProfile } from "@/actions/kiosk/kiosk.action";
import Navbar from "@/components/navbar";
import { KioskProvider } from "@/contexts/kiosk/kiosk.context";
import Connector from "@/libs/mqtt/connector";
import { env } from "next-runtime-env";

export default async function KioskLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const result = await getKioskProfile();

	const deviceNo = result?.data?.profile?.device?.deviceNo ?? "";

	return (
		<section className='w-dvw h-dvh min-w-svw min-h-svh max-w-lvw max-h-lvh p-4 flex flex-col'>
			<Connector
				options={{
					password: result?.data?.token || "",
					host: env("NEXT_PUBLIC_MQTT_URL"),
				}}>
				<KioskProvider profile={result?.data?.profile}>
					<Navbar deviceNo={deviceNo} />
					{children}
				</KioskProvider>
			</Connector>
		</section>
	);
}
