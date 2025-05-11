import { AbstractDto } from '../commons/abstract.dto';
import { SupportDataDto } from './support-data.dto';
import { SupportStatus } from './support-status.enum';

export class SupportDto extends AbstractDto {
	customerId?: string;

	customerEmail?: string;

	customerName?: string;

	customerPhone?: string;

	orderId?: string;

	title?: string;

	content?: string;

	images?: string[];

	status!: SupportStatus;

	data?: SupportDataDto;

	nflowId?: string;
}
