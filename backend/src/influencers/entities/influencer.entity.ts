import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Influencer {
  @ApiProperty({ example: '1' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'John Doe' })
  @Column()
  name: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  @Column()
  avatarUrl: string;

  @ApiProperty({ example: 'Travel and lifestyle content creator' })
  @Column()
  bio: string;

  @ApiProperty({ example: 100000 })
  @Column()
  followers: number;

  @ApiProperty({ example: 0.045 })
  @Column('decimal', { precision: 4, scale: 4 })
  engagementRate: number;

  @ApiProperty({ example: ['Travel', 'Lifestyle'] })
  @Column('text', { array: true })
  categories: string[];

  @ApiProperty({ example: ['English', 'Spanish'] })
  @Column('text', { array: true })
  languages: string[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
} 