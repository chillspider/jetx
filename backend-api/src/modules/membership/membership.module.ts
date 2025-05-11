import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '../../shared/shared.module';
import { MembershipController } from './controllers/membership.controller';
import { MembershipEntity } from './entities/membership.entity';
import { UserMembershipEntity } from './entities/user-membership.entity';
import { MembershipListener } from './listeners/membership.listener';
import { MembershipProfile } from './profiles/membership.profile';
import { MembershipService } from './services/membership.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([MembershipEntity, UserMembershipEntity]),
  ],
  controllers: [MembershipController],
  providers: [MembershipService, MembershipProfile, MembershipListener],
  exports: [MembershipService, MembershipProfile, MembershipListener],
})
export class MembershipModule {}
