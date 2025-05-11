import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import { DateField, EnumField } from '../../../decorators';

export enum BiteboltWebhookType {
  CREATED = 'created',
  UPDATED = 'updated',
}

export enum BiteboltWebhookEntity {
  ORDER = 'order',
}

export class BiteboltWebhookEventDto {
  @EnumField(() => BiteboltWebhookType)
  type: BiteboltWebhookType;

  @EnumField(() => BiteboltWebhookEntity)
  entity: BiteboltWebhookEntity;

  @DateField()
  occurredAt: Date;

  @ApiProperty()
  @IsNotEmpty()
  data: any;
}
