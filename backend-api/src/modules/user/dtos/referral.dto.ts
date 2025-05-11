import { AutoMap } from '@automapper/classes';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import { StringField } from '../../../decorators';

export class ReferralDto extends AbstractDto {
  @StringField()
  @AutoMap()
  referralId: string;

  @StringField()
  @AutoMap()
  referredId: string;

  @StringField()
  @AutoMap()
  referralCode: string;
}

export class ReferralAndNameDto extends ReferralDto {
  @StringField()
  @AutoMap()
  referralName: string;

  @StringField()
  @AutoMap()
  referralEmail: string;

  @StringField()
  @AutoMap()
  referredName: string;

  @StringField()
  @AutoMap()
  referredEmail: string;
}
