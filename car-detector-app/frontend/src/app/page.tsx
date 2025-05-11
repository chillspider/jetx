import { getSession } from "@/lib/cookies";
import { Routes } from "@/lib/routes";
import { redirect } from "next/navigation";

export default async function Main() {
	const session = await getSession();

	if (session) {
		redirect(Routes.CarDetector);
	}

	redirect(Routes.Login);
}
