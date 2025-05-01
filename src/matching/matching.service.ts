import { Injectable } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { FindManyOptions, FindOptionsWhere, In } from 'typeorm';
import { Role } from 'src/auth/enums/role.enum';

@Injectable()
export class MatchingService {
  constructor(
    // ... existing code ...
  ) {}

  async getUserMatches(
    userId: number,
    userRole: Role,
  ): Promise<Match[]> {
    const whereCondition: FindOptionsWhere<Match> | FindOptionsWhere<Match>[] =
      userRole === Role.Brand
        ? { brandId: userId }
        : { influencerId: userId };

    return this.matchRepository.find({
      where: whereCondition,
      relations: ['brand', 'influencer'], // Add relations here
    });
  }

  async findMatchBetweenUsers(
    // ... existing code ...
  ) {}
} 