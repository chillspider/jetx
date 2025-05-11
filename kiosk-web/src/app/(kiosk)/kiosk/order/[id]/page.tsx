import { getKioskOrder } from "@/actions/kiosk/kiosk.action";
import { Routes } from "@/libs/routes";
import { redirect, RedirectType } from "next/navigation";
import KioskOrderDetail from "./_component/order-detail";
import { isOrderFinalized } from "@/libs/helpers";

export default async function KioskOrderDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const res = await getKioskOrder(id);
	if (!res?.data || isOrderFinalized(res.data.status)) {
		redirect(Routes.Kiosk, RedirectType.replace);
	}

	return <KioskOrderDetail order={res.data} />;
}
