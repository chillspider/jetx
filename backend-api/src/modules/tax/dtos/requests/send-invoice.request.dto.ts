import { StringFieldOptional } from '../../../../decorators';

export class SendInvoiceRequestDto {
  @StringFieldOptional()
  email?: string;
}
