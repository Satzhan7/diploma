import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match, MatchStatus } from './entities/match.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { UsersService } from '../users/users.service';
import { MessagesService } from '../messages/messages.service';
import { ProfilesService } from '../profiles/profiles.service';
import { ProfileType } from '../profiles/entities/profile.entity';

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService,
    private readonly messagesService: MessagesService,
  ) {}

  async create(createMatchDto: CreateMatchDto): Promise<Match> {
    const match = this.matchRepository.create(createMatchDto);
    return await this.matchRepository.save(match);
  }

  async findAll(): Promise<Match[]> {
    return await this.matchRepository.find({
      relations: ['brand', 'influencer'],
    });
  }

  async findOne(id: string): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { id },
      relations: ['brand', 'influencer'],
    });

    if (!match) {
      throw new NotFoundException(`Match with ID "${id}" not found`);
    }

    return match;
  }

  async update(id: string, updateMatchDto: UpdateMatchDto): Promise<Match> {
    const match = await this.findOne(id);
    Object.assign(match, updateMatchDto);
    return await this.matchRepository.save(match);
  }

  async remove(id: string): Promise<void> {
    const result = await this.matchRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Match with ID "${id}" not found`);
    }
  }

  async createMatch(brandId: string, influencerId: string): Promise<Match> {
    const brandProfile = await this.profilesService.findByUserId(brandId);
    const influencerProfile = await this.profilesService.findByUserId(influencerId);

    if (brandProfile.type !== ProfileType.BRAND) {
      throw new NotFoundException('First user must be a brand');
    }

    if (influencerProfile.type !== ProfileType.INFLUENCER) {
      throw new NotFoundException('Second user must be an influencer');
    }

    const existingMatch = await this.matchRepository.findOne({
      where: [
        { brand: { id: brandId }, influencer: { id: influencerId } },
        { brand: { id: influencerId }, influencer: { id: brandId } },
      ],
    });

    if (existingMatch) {
      throw new NotFoundException('Match already exists');
    }

    const match = this.matchRepository.create({
      brand: brandProfile,
      influencer: influencerProfile,
      status: MatchStatus.PENDING,
    });

    return this.matchRepository.save(match);
  }

  async acceptMatch(matchId: string): Promise<Match> {
    const match = await this.findOne(matchId);
    match.status = MatchStatus.ACCEPTED;
    const updatedMatch = await this.matchRepository.save(match);

    // Create a conversation between the matched users
    const existingConversation = await this.messagesService.findConversationBetweenUsers(
      match.brand.user.id,
      match.influencer.user.id,
    );

    if (!existingConversation) {
      await this.messagesService.createConversation(match.brand.user.id, {
        recipientId: match.influencer.user.id,
        initialMessage: 'Match accepted! Let\'s start collaborating.',
      });
    }

    return updatedMatch;
  }

  async rejectMatch(matchId: string): Promise<Match> {
    const match = await this.findOne(matchId);
    match.status = MatchStatus.REJECTED;
    return this.matchRepository.save(match);
  }

  async getMatchesForUser(userId: string): Promise<Match[]> {
    const profile = await this.profilesService.findByUserId(userId);

    if (profile.type === ProfileType.BRAND) {
      return this.matchRepository.find({
        where: { brand: { id: profile.id } },
        relations: ['brand', 'influencer'],
      });
    } else {
      return this.matchRepository.find({
        where: { influencer: { id: profile.id } },
        relations: ['brand', 'influencer'],
      });
    }
  }
}