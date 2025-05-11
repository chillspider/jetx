"use client";

import { LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserDto } from "@/models/user.dto";
import { extractFirstChars, formatUserName } from "@/lib/utils";
import { signOut } from "@/actions/auth/auth.action";
import Image from "next/image";

export const NavUser = ({ user }: { user?: UserDto }) => {
	if (!user) return;

	const userName = formatUserName(user);
	const shortName = extractFirstChars(userName);

	return (
		<div className='flex justify-between items-center'>
			<Image src='/logo.png' alt='logo' width={65} height={30} />
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<div className='flex items-center gap-4'>
						<Avatar className='h-8 w-8 rounded-lg'>
							<AvatarFallback className='rounded-lg'>
								{shortName}
							</AvatarFallback>
						</Avatar>
						<div className='grid flex-1 text-left text-sm leading-tight'>
							<span className='truncate font-semibold'>{userName}</span>
							<span className='truncate text-xs'>{user.email}</span>
						</div>
					</div>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
					side={"bottom"}
					align='start'
					sideOffset={4}>
					<DropdownMenuLabel className='p-0 font-normal'>
						<div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
							<Avatar className='h-8 w-8 rounded-lg'>
								<AvatarFallback className='rounded-lg'>
									{shortName}
								</AvatarFallback>
							</Avatar>
							<div className='grid flex-1 text-left text-sm leading-tight'>
								<span className='truncate font-semibold'>{userName}</span>
								<span className='truncate text-xs'>{user.email}</span>
							</div>
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={() => {
							signOut();
						}}>
						<LogOut />
						Đăng xuất
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};
