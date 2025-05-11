import { EnumField } from '../../../../decorators';

export class SyncOrderRequestDto {
  @EnumField(() => ['retry', 'unSync'], {
    default: 'retry',
  })
  type: string;
}
