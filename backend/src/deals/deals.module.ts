import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deal } from './entities/deal.entity';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Deal])],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
