import { AutoMap } from '@automapper/classes';

import {
  DateField,
  DateFieldOptional,
  UUIDField,
  UUIDFieldOptional,
} from '../../decorators';

export class AbstractDto {
  @UUIDField()
  @AutoMap()
  id!: string;

  @DateField()
  @AutoMap()
  createdAt?: Date;

  @UUIDFieldOptional()
  @AutoMap()
  createdBy?: string;

  @DateField()
  @AutoMap()
  updatedAt?: Date;

  @UUIDFieldOptional()
  @AutoMap()
  updatedBy?: string;

  @DateFieldOptional()
  @AutoMap()
  deletedAt?: Date;

  @UUIDFieldOptional()
  @AutoMap()
  deletedBy?: string;
}
