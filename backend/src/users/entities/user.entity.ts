import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Profile } from '../../profiles/entities/profile.entity';
import { Message } from '../../messages/entities/message.entity';
import { Exclude } from 'class-transformer';
import { Order } from '../../orders/entities/order.entity';
import { Match } from '../../matching/entities/match.entity';

export enum UserRole {
  ADMIN = 'admin',
  BRAND = 'brand',
  INFLUENCER = 'influencer',
}

@Entity('users')
export class User {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'The unique identifier of the user' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'John Doe', description: 'The full name of the user' })
  @Column()
  name: string;

  @ApiProperty({ example: 'John', description: 'The first name of the user' })
  @Column({ nullable: true })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'The last name of the user' })
  @Column({ nullable: true })
  lastName: string;

  @ApiProperty({ example: 'john@example.com', description: 'The email address of the user' })
  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.INFLUENCER, description: 'The role of the user' })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.INFLUENCER,
  })
  role: UserRole;

  @ApiProperty({ example: false, description: 'Whether the user email is verified' })
  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string | null;

  @ApiProperty({ type: () => Profile })
  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;

  @ApiProperty({ type: () => [Order] })
  @OneToMany(() => Order, (order) => order.brand)
  orders: Order[];

  @ApiProperty({ type: () => [Message] })
  @OneToMany(() => Message, message => message.sender)
  sentMessages: Message[];

  @ApiProperty({ type: () => [Message] })
  @OneToMany(() => Message, message => message.recipient)
  receivedMessages: Message[];

  @ApiProperty({ type: () => [Match] })
  @OneToMany(() => Match, (match) => match.brand)
  brandMatches: Match[];

  @ApiProperty({ type: () => [Match] })
  @OneToMany(() => Match, (match) => match.influencer)
  influencerMatches: Match[];

  @ApiProperty({ example: '2024-04-19T09:00:00.000Z', description: 'The creation date of the user' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-04-19T09:00:00.000Z', description: 'The last update date of the user' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  @Column({ nullable: true })
  avatarUrl: string;

  @ApiProperty({ example: 'Travel and lifestyle content creator' })
  @Column({ nullable: true })
  bio: string;

  @ApiProperty({ example: 100000 })
  @Column({ nullable: true })
  followers: number;

  @ApiProperty({ example: 0.045 })
  @Column('decimal', { precision: 4, scale: 4, nullable: true })
  engagementRate: number;

  @ApiProperty({ example: ['Travel', 'Lifestyle'] })
  @Column('text', { array: true, nullable: true })
  categories: string[];

  @ApiProperty({ example: ['English', 'Spanish'] })
  @Column('text', { array: true, nullable: true })
  languages: string[];

  @ApiProperty({ example: 'Leading technology company' })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ example: 'Technology' })
  @Column({ nullable: true })
  industry: string;

  @ApiProperty({ example: 'San Francisco, CA' })
  @Column({ nullable: true })
  location: string;

  @ApiProperty({ example: 5 })
  @Column({ nullable: true })
  activeOrders: number;

  @ApiProperty({ example: 25000 })
  @Column({ nullable: true })
  totalSpent: number;
}