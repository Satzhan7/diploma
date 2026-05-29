import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('influencers')
  findInfluencers(
    @Query('search') searchQuery?: string,
    @Query('category') category?: string,
  ) {
    return this.usersService.findInfluencers(searchQuery, category);
  }

  @Get('brands')
  findBrands(@Query('search') searchQuery?: string) {
    return this.usersService.findBrands(searchQuery);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetCurrentUser('sub') currentUserId: string,
  ) {
    // Ownership: a user can only patch their own record. Role and password are
    // also stripped — role escalation must not be possible via this endpoint,
    // and password changes belong to a dedicated flow.
    if (id !== currentUserId) {
      throw new ForbiddenException('You can only update your own profile');
    }
    const { role: _ignoredRole, password: _ignoredPassword, ...safeFields } =
      updateUserDto as UpdateUserDto & { role?: unknown; password?: unknown };
    return this.usersService.update(id, safeFields as UpdateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
} 