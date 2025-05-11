import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '../../shared/shared.module';
import { DeviceModule } from '../device/device.module';
import { CarDetectorController } from './controllers/car-detector.controller';
import { CarDetectorEntity } from './entities/car-detector.entity';
import { CarDetectorService } from './services/car-detector.service';

@Module({
  imports: [
    SharedModule,
    DeviceModule,
    TypeOrmModule.forFeature([CarDetectorEntity]),
  ],
  controllers: [CarDetectorController],
  providers: [CarDetectorService],
  exports: [CarDetectorService],
})
export class CarDetectorModule {}
