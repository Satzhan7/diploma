import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { hashRefreshToken } from '../auth/refresh-token-hash';
import { apiError, ErrorCode } from '../common/errors/error-codes';
import { Page, PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll({ take, skip }: PaginationQueryDto): Promise<Page<User>> {
    const [items, total] = await this.usersRepository.findAndCount({
      order: { createdAt: 'DESC', id: 'DESC' },
      take,
      skip,
    });
    return { items, total, take, skip };
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(
        apiError(ErrorCode.USER_NOT_FOUND, `User with ID ${id} not found`),
      );
    }

    return user;
  }

  /** Case-insensitive exact match (LOWER, not ILIKE: `_` is a LIKE wildcard). */
  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({
      where: {
        email: Raw((column) => `LOWER(${column}) = LOWER(:email)`, {
          email: email.trim(),
        }),
      },
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const saltRounds = 10; // Standard salt rounds
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

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

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    const user = await this.findById(userId);

    // Hash refresh token if provided, otherwise set to null
    user.refreshToken = refreshToken ? hashRefreshToken(refreshToken) : null;

    await this.usersRepository.save(user);
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.usersRepository.update(userId, { emailVerifiedAt: new Date() });
  }

  /**
   * Ends sign-up: whoever proved the inbox sets the password, so a stranger
   * who registered the email first never keeps access.
   */
  async completeEmailVerification(
    userId: string,
    password: string,
  ): Promise<void> {
    await this.usersRepository.update(userId, {
      password: await bcrypt.hash(password, 10),
      emailVerifiedAt: new Date(),
      refreshToken: null,
    });
  }
}
