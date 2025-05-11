import { AbstractDto } from '../commons/abstract.dto';

export class NotificationDto extends AbstractDto {
	title!: string;

	content!: string;

	userId?: string;

	isRead?: boolean;

	type: any;

	data?: any;

	deepLink?: string | undefined | null;
}
