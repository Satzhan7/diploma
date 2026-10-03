import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { UserRole } from './entities/user.entity';
import { toPublicUser } from './public-user';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Full user records (with emails) are for admins only.
  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('influencers')
  async findInfluencers(
    @Query('search') searchQuery?: string,
    @Query('category') category?: string,
  ) {
    const users = await this.usersService.findInfluencers(
      searchQuery,
      category,
    );
    return users.map(toPublicUser);
  }

  @Get('brands')
  async findBrands(@Query('search') searchQuery?: string) {
    const users = await this.usersService.findBrands(searchQuery);
    return users.map(toPublicUser);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return toPublicUser(await this.usersService.findById(id));
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
    const {
      role: _ignoredRole,
      password: _ignoredPassword,
      ...safeFields
    } = updateUserDto as UpdateUserDto & { role?: unknown; password?: unknown };
    return this.usersService.update(id, safeFields as UpdateUserDto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetCurrentUser() currentUser: { id: string; role: UserRole },
  ) {
    // Ownership: same rule as PATCH — only the account owner (or an admin)
    // may delete a user record.
    if (id !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own account');
    }
    return this.usersService.remove(id);
  }
}
