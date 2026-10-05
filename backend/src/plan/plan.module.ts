import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../profiles/entities/profile.entity';
import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Profile])],
  controllers: [PlanController],
  providers: [PlanService],
  exports: [PlanService],
})
export class PlanModule {}
