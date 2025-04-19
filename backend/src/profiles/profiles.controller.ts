import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
  Post,
  Put,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('profiles')
@ApiBearerAuth()
@Controller('profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  getMyProfile(@GetCurrentUser('sub') userId: string) {
    return this.profilesService.findByUserId(userId);
  }

  @Patch('me')
  updateMyProfile(
    @GetCurrentUser('sub') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.update(userId, updateProfileDto);
  }

  @Get(':userId')
  getProfileByUserId(@Param('userId') userId: string) {
    return this.profilesService.findByUserId(userId);
  }

  @Get('influencers/search')
  @Roles('brand')
  findInfluencers(
    @GetCurrentUser('sub') brandUserId: string,
    @Query() filters: any,
  ) {
    return this.profilesService.findInfluencersForBrand(brandUserId, filters);
  }

  @Get('brands/search')
  @Roles('influencer')
  findBrands(
    @GetCurrentUser('sub') influencerUserId: string,
    @Query() filters: any,
  ) {
    return this.profilesService.findBrandsForInfluencer(influencerUserId, filters);
  }

  @Get()
  @ApiOperation({ summary: 'Get all profiles' })
  @ApiResponse({ status: 200, description: 'Return all profiles.', type: [Profile] })
  findAll(): Promise<Profile[]> {
    return this.profilesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a profile by id' })
  @ApiResponse({ status: 200, description: 'Return the profile.', type: Profile })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  findOne(@Param('id') id: string): Promise<Profile> {
    return this.profilesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new profile' })
  @ApiResponse({ status: 201, description: 'The profile has been successfully created.', type: Profile })
  create(@Body() profile: Partial<Profile>): Promise<Profile> {
    return this.profilesService.create(profile);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a profile' })
  @ApiResponse({ status: 200, description: 'The profile has been successfully updated.', type: Profile })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  update(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto): Promise<Profile> {
    return this.profilesService.update(id, updateProfileDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a profile' })
  @ApiResponse({ status: 200, description: 'The profile has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.profilesService.remove(id);
  }
}