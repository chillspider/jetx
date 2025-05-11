import { NavUser } from "@/components/nav-user";
import { getSession } from "@/lib/cookies";

export default async function DetectorLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getSession();

	return (
		<section className='w-dvw h-dvh min-w-svw min-h-svh max-w-lvw max-h-lvh flex flex-col gap-6 px-6 py-6'>
			<NavUser user={session?.user} />
			{children}
		</section>
	);
}
