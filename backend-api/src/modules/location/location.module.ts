import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '../../shared/shared.module';
import { LocationCacheService } from './cache/location-cache.service';
import { LocationController } from './controllers/location.controller';
import { CityEntity } from './entities/city.entity';
import { CountryEntity } from './entities/country.entity';
import { DistrictEntity } from './entities/district.entity';
import { WardEntity } from './entities/ward.entity';
import { LocationListener } from './listeners/location.listener';
import { LocationProfile } from './profiles/location.profile';
import { LocationService } from './services/location.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CityEntity,
      DistrictEntity,
      WardEntity,
      CountryEntity,
    ]),
    SharedModule,
  ],
  controllers: [LocationController],
  providers: [
    LocationService,
    LocationCacheService,
    LocationProfile,
    LocationListener,
  ],
  exports: [LocationService, LocationCacheService],
})
export class LocationModule {}
