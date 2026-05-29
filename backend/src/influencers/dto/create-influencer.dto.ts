import { IsString, IsNumber, IsArray, IsUrl, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInfluencerDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  @IsUrl()
  avatarUrl: string;

  @ApiProperty({ example: 'Travel and lifestyle content creator' })
  @IsString()
  bio: string;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(0)
  followers: number;

  @ApiProperty({ example: 0.045 })
  @IsNumber()
  @Min(0)
  @Max(1)
  engagementRate: number;

  @ApiProperty({ example: ['Travel', 'Lifestyle'] })
  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @ApiProperty({ example: ['English', 'Spanish'] })
  @IsArray()
  @IsString({ each: true })
  languages: string[];
} 