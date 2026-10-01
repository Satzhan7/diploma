import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Static category list used by the brand and influencer dashboards.
// Kept deliberately small and stable so it can be cited in the diploma defense.
const CATEGORIES: string[] = [
  'Fashion',
  'Beauty',
  'Lifestyle',
  'Technology',
  'Fitness',
  'Food',
  'Travel',
  'Gaming',
  'Education',
  'Music',
  'Business',
  'Health',
];

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  @Get()
  @ApiOperation({ summary: 'List the platform-wide content categories' })
  @ApiResponse({ status: 200, description: 'Static array of category labels.' })
  findAll(): string[] {
    return CATEGORIES;
  }
}
