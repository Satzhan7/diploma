import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('brands')
@Controller('brands')
@UseGuards(JwtAuthGuard)
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiResponse({ status: 201, description: 'The brand has been successfully created.' })
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all brands' })
  @ApiResponse({ status: 200, description: 'Return all brands.' })
  findAll() {
    return this.brandsService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search brands' })
  @ApiResponse({ status: 200, description: 'Return matching brands.' })
  search(@Query('q') query: string) {
    return this.brandsService.search(query);
  }

  @Get('industry/:industry')
  @ApiOperation({ summary: 'Get brands by industry' })
  @ApiResponse({ status: 200, description: 'Return brands in the specified industry.' })
  findByIndustry(@Param('industry') industry: string) {
    return this.brandsService.findByIndustry(industry);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get brand by id' })
  @ApiResponse({ status: 200, description: 'Return the brand.' })
  findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update brand' })
  @ApiResponse({ status: 200, description: 'The brand has been successfully updated.' })
  update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    return this.brandsService.update(id, updateBrandDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete brand' })
  @ApiResponse({ status: 200, description: 'The brand has been successfully deleted.' })
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
} 