import { LottieComponentProps } from "lottie-react";
import dynamic from "next/dynamic";
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export function LazyLottie({ animationData, ...props }: LottieComponentProps) {
	return <Lottie animationData={animationData} {...props} />;
}
