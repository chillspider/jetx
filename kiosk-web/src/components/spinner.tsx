import { Loader2 } from "lucide-react";

export const Spinner = () => (
	<div className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/5 transition-all'>
		<Loader2 className='animate-spin' size={24} />
	</div>
);
