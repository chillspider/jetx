import { AutoMap } from '@automapper/classes';

import { NumberField, UUIDField } from '../../../decorators';

export class StationModeDto {
  @UUIDField()
  @AutoMap()
  id: string;

  @UUIDField()
  @AutoMap()
  stationId: string;

  @UUIDField()
  @AutoMap()
  modeId: string;

  @NumberField({ min: 0, int: true })
  @AutoMap()
  price: number;
}

export class CreateStationModeDto {
  @UUIDField()
  @AutoMap()
  stationId: string;

  @UUIDField()
  @AutoMap()
  modeId: string;

  @NumberField({ min: 0, int: true })
  @AutoMap()
  price: number;
}
