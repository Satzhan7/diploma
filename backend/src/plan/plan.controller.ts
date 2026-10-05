import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { PlanService, PlanView } from './plan.service';

@ApiTags('plan')
@ApiBearerAuth()
@Controller('plan')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get('me')
  @Roles(UserRole.BRAND)
  mine(@GetCurrentUser('sub') userId: string): Promise<PlanView> {
    return this.planService.forUser(userId);
  }
}
