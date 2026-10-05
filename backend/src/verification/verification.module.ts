import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../profiles/entities/profile.entity';
import { FilesModule } from '../files/files.module';
import { CreatorVerification } from './entities/creator-verification.entity';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CreatorVerification, Profile]),
    FilesModule,
  ],
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
