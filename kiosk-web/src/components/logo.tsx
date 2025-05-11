import Image from "next/image";

type LogoProps = {
	size?: "s" | "m" | "l";
	className?: string;
};

const LogoSize = {
	s: { width: 32.5, height: 15 },
	m: { width: 65, height: 30 },
	l: { width: 130, height: 60 },
};

export default function Logo({ size = "m", className }: LogoProps) {
	const { width, height } = LogoSize[size];

	return (
		<Image
			className={className}
			src='/assets/logo.png'
			alt='logo'
			width={width}
			height={height}
		/>
	);
}
