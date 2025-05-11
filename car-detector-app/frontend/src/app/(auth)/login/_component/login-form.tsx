"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { signIn } from "@/actions/auth/auth.action";
import {
	resolveActionResult,
	resolveErrorMessage,
} from "@/actions/safe-action";

const formSchema = z.object({
	email: z
		.string()
		.min(1, {
			message: "Vui lòng nhập email",
		})
		.email({
			message: "Email không hợp lệ",
		}),
	password: z.string().min(1, {
		message: "Vui lòng nhập mật khẩu",
	}),
});

export function LoginForm() {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const { isPending, mutate } = useMutation({
		mutationFn: async (data: z.infer<typeof formSchema>) => {
			return resolveActionResult(signIn(data));
		},
		onSuccess: () => {
			toast.success("Đăng nhập thành công");
		},
		onError: (error) => {
			if (isRedirectError(error)) {
				toast.success("Đăng nhập thành công");
				return;
			}

			toast.error(
				resolveErrorMessage(error, "Tài khoản hoặc mật khẩu không chính xác!")
			);
		},
	});

	const onSubmit = async (data: z.infer<typeof formSchema>) => mutate(data);

	return (
		<div className='flex flex-col gap-6'>
			<Card>
				<CardHeader className='text-center'>
					<CardTitle className='text-xl'>Chào mừng trở lại</CardTitle>
					<CardDescription>Đăng nhập vào tài khoản của bạn</CardDescription>
				</CardHeader>
				<CardContent>
					<FormProvider {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className='flex flex-col gap-6'>
							<FormField
								control={form.control}
								name='email'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input placeholder='m@example.com' {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='password'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Mật khẩu</FormLabel>
										<FormControl>
											<Input
												type='password'
												placeholder='Mật khẩu'
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type='submit' className='w-full' disabled={isPending}>
								{isPending && <Loader2 className='animate-spin' />}
								Đăng nhập
							</Button>
						</form>
					</FormProvider>
				</CardContent>
			</Card>
			<div className='text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  '>
				Bằng cách tiếp tục, bạn đồng ý với{" "}
				<a href='https://www.wash24h.com/chinh-sach-hoat-dong-quy-dinh-chung'>
					Điều khoản dịch vụ
				</a>{" "}
				and{" "}
				<a href='https://www.wash24h.com/chinh-sach-bao-mat-thong-tin'>
					Chính sách bảo mật thông tin
				</a>
				.
			</div>
		</div>
	);
}
