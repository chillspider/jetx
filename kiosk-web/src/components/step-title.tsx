import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/libs/utils";

export function TaskStepHeading({
	title,
	taskTitle,
	size = "lg",
}: {
	title: string;
	taskTitle: string;
	size?: "lg" | "md" | "sm";
}) {
	const fontSize = {
		lg: {
			title: "text-xl",
			taskTitle: "text-3xl",
		},
		md: {
			title: "text-lg",
			taskTitle: "text-2xl",
		},
		sm: {
			title: "text-lg",
			taskTitle: "text-xl",
		},
	};

	return (
		<Alert className='flex flex-col items-center justify-center'>
			<AlertDescription className={cn(fontSize[size].title)}>
				{title}
			</AlertDescription>
			<AlertTitle
				className={cn(
					"text-red-500 text-center line-clamp-none",
					fontSize[size].taskTitle
				)}>
				{taskTitle}
			</AlertTitle>
		</Alert>
	);
}
