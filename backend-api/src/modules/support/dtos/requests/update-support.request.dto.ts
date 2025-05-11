import { EnumField, StringFieldOptional } from '../../../../decorators';
import { SupportStatus } from '../../enums/support-status.enum';

export class UpdateSupportRequestDto {
  @EnumField(() => SupportStatus)
  status: SupportStatus;

  @StringFieldOptional({
    description: 'When closed, please pass on any support responses.',
  })
  supportResponse?: string;
}
