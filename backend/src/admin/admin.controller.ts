import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AdminService } from './admin.service';
import {
  ListBrandsQueryDto,
  ListVerificationsQueryDto,
  RejectVerificationDto,
  ReviewVerificationDto,
  SetPlanDto,
} from './dto/admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('verifications')
  listVerifications(@Query() query: ListVerificationsQueryDto) {
    return this.adminService.listVerifications(query);
  }

  @Post('verifications/:id/approve')
  approve(
    @GetCurrentUser('sub') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewVerificationDto,
  ) {
    return this.adminService.approveVerification(adminId, id, dto.submittedAt);
  }

  @Post('verifications/:id/reject')
  reject(
    @GetCurrentUser('sub') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectVerificationDto,
  ) {
    return this.adminService.rejectVerification(
      adminId,
      id,
      dto.submittedAt,
      dto.reason,
    );
  }

  @Get('brands')
  listBrands(@Query() query: ListBrandsQueryDto) {
    return this.adminService.listBrands(query);
  }

  @Patch('brands/:profileId/plan')
  setPlan(
    @GetCurrentUser('sub') adminId: string,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Body() dto: SetPlanDto,
  ) {
    return this.adminService.setPlan(adminId, profileId, dto);
  }

  @Get('audit')
  listAudit(@Query() query: PaginationQueryDto) {
    return this.adminService.listAudit(query);
  }
}
