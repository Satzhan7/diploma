import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async findInfluencers(searchQuery?: string, category?: string): Promise<User[]> {
    const where: any = { role: UserRole.INFLUENCER };
    
    if (searchQuery) {
      where.name = ILike(`%${searchQuery}%`);
    }
    
    if (category) {
      where.categories = ILike(`%${category}%`);
    }
    
    return await this.usersRepository.find({ 
      where, 
      relations: ['profile'] 
    });
  }

  async findBrands(searchQuery?: string): Promise<User[]> {
    const where: any = { role: UserRole.BRAND };
    
    if (searchQuery) {
      where.name = ILike(`%${searchQuery}%`);
    }
    
    return await this.usersRepository.find({ 
      where, 
      relations: ['profile'] 
    });
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
    const saltRounds = 10; // Standard salt rounds
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword, // Use the hashed password
    });
    return await this.usersRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.usersRepository.update(id, updateUserDto);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
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
}