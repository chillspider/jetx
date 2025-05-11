import { StringField } from '../../../../decorators';

export class TriggerSyncNflowVoucherDto {
  @StringField({ isArray: true, each: true })
  ids: string[];
}
