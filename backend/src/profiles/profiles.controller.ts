import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
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

  @Get('influencers/search')
  @Roles('brand')
  @ApiOperation({ summary: 'Search influencers (brands only)' })
  findInfluencers(
    @GetCurrentUser('sub') brandUserId: string,
    @Query() filters: any,
  ) {
    return this.profilesService.findInfluencersForBrand(brandUserId, filters);
  }

  @Get('brands/search')
  @Roles('influencer')
  @ApiOperation({ summary: 'Search brands (influencers only)' })
  findBrands(
    @GetCurrentUser('sub') influencerUserId: string,
    @Query() filters: any,
  ) {
    return this.profilesService.findBrandsForInfluencer(
      influencerUserId,
      filters,
    );
  }

  // Read-only public-within-the-app lookup of any user's profile by their userId
  // (used by the role-aware "view profile" link in the dashboards).
  @Get(':userId')
  @ApiOperation({ summary: 'Get a profile by its owning user id' })
  @ApiResponse({ status: 200, type: Profile })
  getProfileByUserId(@Param('userId') userId: string) {
    return this.profilesService.findPublicByUserId(userId);
  }
}
