import { Metadata } from "next";
import { LoginForm } from "./_component/login-form";
import Image from "next/image";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
	title: "Đăng nhập - JETX Vietnam",
	description: "JETX Vietnam - Car detector",
};

export default function LoginPage() {
	return (
		<div className='flex flex-col items-center justify-center gap-6 bg-muted p-6'>
			<div className='flex flex-col gap-6 justify-center items-center'>
				<div className='flex flex-col gap-2 justify-center items-center'>
					<Image src='/logo.png' alt='logo' width={65} height={30} />
					<Label className='text-xl font-medium'>JETX Vietnam</Label>
				</div>
				<LoginForm />
			</div>
		</div>
	);
}
