import Logo from "@/components/logo";
import { Label } from "@/components/ui/label";

type NavbarProps = {
	deviceNo: string;
};

export default function Navbar({ deviceNo }: NavbarProps) {
	return (
		<div className='flex justify-between items-center'>
			<Logo />
			<Label className='text-l'>{deviceNo}</Label>
		</div>
	);
}
