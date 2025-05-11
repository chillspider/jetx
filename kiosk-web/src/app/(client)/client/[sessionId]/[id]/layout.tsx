import { getClientOrder } from "@/actions/client/kiosk-client.action";
import { Routes } from "@/libs/routes";
import { redirect, RedirectType } from "next/navigation";

export default async function ClientOrderLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ sessionId: string; id: string }>;
}) {
	const { sessionId, id } = await params;

	const result = await getClientOrder(id);
	if (!result?.data) {
		redirect(`${Routes.Client}/${sessionId}`, RedirectType.replace);
	}

	return <>{children}</>;
}
