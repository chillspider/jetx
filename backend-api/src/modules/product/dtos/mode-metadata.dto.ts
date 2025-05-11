import { AutoMap } from '@automapper/classes';

import { NumberFieldOptional } from '../../../decorators';

export class ModeMetadata {
  @AutoMap()
  @NumberFieldOptional({ description: 'Duration in minutes' })
  duration?: number;
}
