import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ImageUpload } from '../files/image-upload';
import { UploadedImage } from '../files/files.service';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { VerificationService } from './verification.service';
import { MyVerificationView } from './verification-view';

@ApiTags('verification')
@ApiBearerAuth()
@Controller('verification')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.INFLUENCER)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('me')
  mine(@GetCurrentUser('sub') userId: string): Promise<MyVerificationView> {
    return this.verificationService.mine(userId);
  }

  /** Multipart: `followers`, `engagementRate` and the screenshot in `file`. */
  @Post()
  @ApiConsumes('multipart/form-data')
  @ImageUpload()
  submit(
    @GetCurrentUser('sub') userId: string,
    @Body() dto: SubmitVerificationDto,
    @UploadedFile() file: UploadedImage | undefined,
  ): Promise<MyVerificationView> {
    return this.verificationService.submit(userId, dto, file);
  }
}
