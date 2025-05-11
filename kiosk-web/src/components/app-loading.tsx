import Logo from "./logo";

export default function AppLoading() {
	return (
		<section className='flex items-center justify-center h-screen w-screen'>
			<Logo size='l' className='animate-pulse' />
		</section>
	);
}
