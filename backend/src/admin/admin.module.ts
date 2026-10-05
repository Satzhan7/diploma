import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../profiles/entities/profile.entity';
import { CreatorVerification } from '../verification/entities/creator-verification.entity';
import { PlanModule } from '../plan/plan.module';
import { AuditLog } from './entities/audit-log.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CreatorVerification, Profile, AuditLog]),
    PlanModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
