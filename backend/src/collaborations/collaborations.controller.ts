import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { CollaborationsService } from './collaborations.service';
import { CreateCollaborationDto } from './dto/create-collaboration.dto';
import { UpdateCollaborationDto } from './dto/update-collaboration.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('collaborations')
@Controller('collaborations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CollaborationsController {
  constructor(private readonly collaborationsService: CollaborationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new collaboration' })
  @Roles(UserRole.BRAND, UserRole.ADMIN)
  create(@Req() req, @Body() createCollaborationDto: CreateCollaborationDto) {
    // Never trust caller-supplied brandId (SECURITY_AUDIT H2). Brands always
    // create collaborations as themselves; only admins may set it explicitly.
    if (req.user.role !== UserRole.ADMIN) {
      createCollaborationDto.brandId = req.user.id;
    }
    return this.collaborationsService.create(createCollaborationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all collaborations' })
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.collaborationsService.findAll();
  }

  @Get('brand')
  @ApiOperation({ summary: 'Get collaborations for the authenticated brand' })
  @Roles(UserRole.BRAND)
  findBrandCollaborations(@Req() req) {
    return this.collaborationsService.findByBrandId(req.user.id);
  }

  @Get('influencer')
  @ApiOperation({ summary: 'Get collaborations for the authenticated influencer' })
  @Roles(UserRole.INFLUENCER)
  findInfluencerCollaborations(@Req() req) {
    return this.collaborationsService.findByInfluencerId(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a collaboration by id (participants only)' })
  @Roles(UserRole.BRAND, UserRole.INFLUENCER, UserRole.ADMIN)
  async findOne(@Param('id') id: string, @Req() req) {
    const collaboration = await this.collaborationsService.findOne(id);
    this.assertParticipant(collaboration, req.user);
    return collaboration;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a collaboration (owning brand only)' })
  @Roles(UserRole.BRAND, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Req() req,
    @Body() updateCollaborationDto: UpdateCollaborationDto,
  ) {
    const collaboration = await this.collaborationsService.findOne(id);
    this.assertParticipant(collaboration, req.user);
    return this.collaborationsService.update(id, updateCollaborationDto);
  }

  // Ownership guard for per-collaboration operations (SECURITY_AUDIT H2).
  private assertParticipant(
    collaboration: { brandId: string; influencerId: string },
    user: { id: string; role: UserRole },
  ): void {
    if (
      user.role !== UserRole.ADMIN &&
      collaboration.brandId !== user.id &&
      collaboration.influencerId !== user.id
    ) {
      throw new ForbiddenException('You do not have access to this collaboration');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a collaboration' })
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.collaborationsService.remove(id);
  }
} 