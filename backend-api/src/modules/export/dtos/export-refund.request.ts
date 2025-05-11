import {
  ClassField,
  DateField,
  EmailField,
  NumberField,
  StringField,
  StringFieldOptional,
} from '../../../decorators';

export class RefundRequest {
  @StringField()
  customerId: string;

  @StringFieldOptional()
  customerName: string = '';

  @NumberField()
  amount: number;

  @StringField()
  paymentMethod: string;

  @StringFieldOptional()
  accountInformation: string = '';

  @StringField()
  approvedBy: string;

  @DateField()
  approvedAt: Date;
}

export class ExportRefundRequest {
  @ClassField(() => RefundRequest, { isArray: true, each: true })
  refunds: RefundRequest[];

  @EmailField({ isArray: true, each: true })
  emails: string[];
}
