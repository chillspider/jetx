import * as z from 'zod';

export const schema = z.object({
	brand: z.string().optional(),
	model: z.string().optional(),
	number: z
		.string({
			required_error: 'errorNumber',
		})
		.trim()
		.min(1, 'errorNumber'),
	color: z.string().optional(),
	count: z
		.string({
			required_error: 'errorCount',
		})
		.trim()
		.min(1, 'errorCount'),
	image: z.string().optional(),
	default: z
		.boolean({
			required_error: '',
		})
		.default(false),
});

export type FormType = z.infer<typeof schema>;
