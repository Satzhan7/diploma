import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Brand {
  @ApiProperty({ example: '1' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'TechCorp' })
  @Column()
  name: string;

  @ApiProperty({ example: 'https://example.com/logo.jpg' })
  @Column()
  avatarUrl: string;

  @ApiProperty({ example: 'Leading technology company' })
  @Column()
  description: string;

  @ApiProperty({ example: 'Technology' })
  @Column()
  industry: string;

  @ApiProperty({ example: 'San Francisco, CA' })
  @Column()
  location: string;

  @ApiProperty({ example: 5 })
  @Column()
  activeOrders: number;

  @ApiProperty({ example: 25000 })
  @Column()
  totalSpent: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
} 