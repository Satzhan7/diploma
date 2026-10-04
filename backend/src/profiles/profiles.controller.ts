import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

// `/profiles/me` is the canonical edit route for the authenticated user.
// Generic admin-only CRUD on profiles is intentionally NOT exposed here —
// profiles are always owned by exactly one user and are created automatically
// during registration. Search endpoints are role-restricted.
@ApiTags('profiles')
@ApiBearerAuth()
@Controller('profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiResponse({ status: 200, type: Profile })
  getMyProfile(@GetCurrentUser('sub') userId: string) {
    return this.profilesService.findByUserId(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile has been successfully updated.',
    type: Profile,
  })
  updateMyProfile(
    @GetCurrentUser('sub') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    return this.profilesService.updateProfile(userId, updateProfileDto);
  }

  // Read-only public-within-the-app lookup of any user's profile by their userId
  // (used by the role-aware "view profile" link in the dashboards).
  @Get(':userId')
  @ApiOperation({ summary: 'Get a profile by its owning user id' })
  @ApiResponse({ status: 200, type: Profile })
  getProfileByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.profilesService.findPublicByUserId(userId);
  }
}
