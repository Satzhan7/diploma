import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...userData } = createUserDto;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
    });
    
    return this.usersRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    
    // If password is provided, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    
    // Update user
    Object.assign(user, updateUserDto);
    
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    const user = await this.findById(userId);
    
    // Hash refresh token if provided, otherwise set to null
    user.refreshToken = refreshToken ? await bcrypt.hash(refreshToken, 10) : null;
    
    await this.usersRepository.save(user);
  }

  async verifyEmail(userId: string): Promise<User> {
    const user = await this.findById(userId);
    
    user.isEmailVerified = true;
    
    return this.usersRepository.save(user);
  }

  async findBrands(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: UserRole.BRAND },
    });
  }

  async findInfluencers(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: UserRole.INFLUENCER },
    });
  }
}