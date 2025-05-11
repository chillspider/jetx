"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { resolveActionResult, resolveErrorMessage } from "@/libs/safe-action";
import { onboard } from "@/actions/auth/auth.action";
import { toast } from "sonner";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import Logo from "@/components/logo";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function OnboardPage() {
	const [activeCode, setActiveCode] = useState("");

	const { isPending, mutate } = useMutation({
		mutationFn: async () => {
			return resolveActionResult(onboard(activeCode));
		},
		onSuccess: () => {
			toast.success("Kích hoạt thành công");
		},
		onError: (error) => {
			if (isRedirectError(error)) {
				toast.success("Kích hoạt thành công");
				return;
			}

			toast.error(resolveErrorMessage(error, "Mã kích hoạt không chính xác!"));
		},
	});

	return (
		<section className='bg-muted h-screen w-screen'>
			<div className='flex flex-col items-center justify-center h-screen gap-6'>
				<div className='flex flex-col gap-2 justify-center items-center'>
					<Logo />
					<Label className='text-xl font-medium'>JETX Vietnam</Label>
				</div>
				<Card className='w-96'>
					<CardHeader>
						<CardTitle className='text-l'>Kích hoạt</CardTitle>
						<CardDescription>
							Vui lòng nhập mã để kích hoạt KIOSK
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='flex flex-col gap-6 justify-center items-center '>
							<Input
								placeholder='Mã kích hoạt'
								value={activeCode}
								onChange={(e) => setActiveCode(e.target.value)}
							/>
							<Button
								className='w-full'
								disabled={!activeCode?.length}
								isLoading={isPending}
								onClick={() => mutate()}>
								<ArrowRight />
								Kích hoạt
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</section>
	);
}
