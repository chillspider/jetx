import { DateField } from '../../../decorators';

export class ExportReferralRequest {
  @DateField()
  start: Date;

  @DateField()
  end: Date;
}
