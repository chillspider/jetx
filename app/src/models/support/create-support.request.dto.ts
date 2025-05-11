import { PickerImage } from '@/components/image-picker/image-picker';

export class CreateSupportRequestDto {
	customerEmail!: string;

	customerName?: string;

	customerPhone?: string;

	orderId?: string;

	title?: string;

	content?: string;

	images?: PickerImage[];

	constructor({
		customerEmail,
		customerName,
		customerPhone,
		orderId,
		title,
		content,
		images,
	}: {
		customerEmail: string;
		customerName?: string;
		customerPhone?: string;
		orderId?: string;
		title?: string;
		content?: string;
		images?: PickerImage[];
	}) {
		this.customerEmail = customerEmail;
		this.customerName = customerName;
		this.customerPhone = customerPhone;
		this.orderId = orderId;
		this.title = title;
		this.content = content;
		this.images = images;
	}
}
