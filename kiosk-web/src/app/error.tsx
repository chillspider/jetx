"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";

export default function Error() {
	return (
		<div className='h-screen flex flex-col justify-center items-center space-y-4'>
			<TriangleAlert color='red' width={80} height={80} strokeWidth={1} />
			<h2 className='text-xl font-medium'>Đã xảy ra lỗi</h2>
			<Button asChild>
				<Link href={"/"}>Quay lại</Link>
			</Button>
		</div>
	);
}
