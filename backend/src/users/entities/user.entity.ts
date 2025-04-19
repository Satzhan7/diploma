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

export enum UserRole {
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

  @ApiProperty({ type: () => [Message] })
  @OneToMany(() => Message, message => message.sender)
  sentMessages: Message[];

  @ApiProperty({ type: () => [Message] })
  @OneToMany(() => Message, message => message.recipient)
  receivedMessages: Message[];

  @ApiProperty({ example: '2024-04-19T09:00:00.000Z', description: 'The creation date of the user' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2024-04-19T09:00:00.000Z', description: 'The last update date of the user' })
  @UpdateDateColumn()
  updatedAt: Date;
}