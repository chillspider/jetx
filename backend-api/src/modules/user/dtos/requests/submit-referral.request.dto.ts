import { StringField } from '../../../../decorators';

export class SubmitReferralRequest {
  @StringField()
  referralCode: string;
}
