import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
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
  create(@Body() createCollaborationDto: CreateCollaborationDto) {
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
  @ApiOperation({ summary: 'Get a collaboration by id' })
  @Roles(UserRole.BRAND, UserRole.INFLUENCER, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.collaborationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a collaboration' })
  @Roles(UserRole.BRAND, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateCollaborationDto: UpdateCollaborationDto) {
    return this.collaborationsService.update(id, updateCollaborationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a collaboration' })
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.collaborationsService.remove(id);
  }
} 