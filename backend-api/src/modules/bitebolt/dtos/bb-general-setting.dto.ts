import {
  BooleanField,
  ClassFieldOptional,
  DateField,
  EnumFieldOptional,
  NumberField,
  StringField,
} from '../../../decorators';
import { BBApplicationCodeEnum } from '../enums/bb.enum';

export class BBApplicationsStatusResponseDto {
  @EnumFieldOptional(() => BBApplicationCodeEnum)
  applicationCode: BBApplicationCodeEnum;

  @BooleanField()
  isActive: boolean;
}

export class BBGeneralSettingDto {
  @StringField()
  code?: string;

  @StringField()
  branchName: string;

  @DateField()
  registrationDate: Date;

  @NumberField()
  tax: number;

  @BooleanField()
  isPriceIncludedTax: boolean;

  @BooleanField()
  active?: boolean;

  @StringField()
  subDomain: string;

  @StringField()
  tenantId: string;

  @ClassFieldOptional(() => BBApplicationsStatusResponseDto, { isArray: true })
  applicationsStatus?: BBApplicationsStatusResponseDto[];
}
