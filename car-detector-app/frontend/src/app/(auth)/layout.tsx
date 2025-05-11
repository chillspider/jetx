export default function AuthLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className='w-dvw h-dvh min-w-svw min-h-svh max-w-lvw max-h-lvh grid place-items-center p-4'>
			{children}
		</div>
	);
}
