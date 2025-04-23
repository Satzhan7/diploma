import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCollaborationDto } from './dto/create-collaboration.dto';
import { UpdateCollaborationDto } from './dto/update-collaboration.dto';
import { Collaboration } from './entities/collaboration.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class CollaborationsService {
  constructor(
    @InjectRepository(Collaboration)
    private collaborationsRepository: Repository<Collaboration>,
    private usersService: UsersService,
  ) {}

  async create(createCollaborationDto: CreateCollaborationDto): Promise<Collaboration> {
    // Verify that brand and influencer exist
    await this.usersService.findById(createCollaborationDto.brandId);
    await this.usersService.findById(createCollaborationDto.influencerId);

    const collaboration = this.collaborationsRepository.create(createCollaborationDto);
    return this.collaborationsRepository.save(collaboration);
  }

  async findAll(): Promise<Collaboration[]> {
    return this.collaborationsRepository.find({
      relations: ['brand', 'influencer', 'order'],
    });
  }

  async findByBrandId(brandId: string): Promise<Collaboration[]> {
    return this.collaborationsRepository.find({
      where: { brandId },
      relations: ['brand', 'influencer', 'order'],
    });
  }

  async findByInfluencerId(influencerId: string): Promise<Collaboration[]> {
    return this.collaborationsRepository.find({
      where: { influencerId },
      relations: ['brand', 'influencer', 'order'],
    });
  }

  async findOne(id: string): Promise<Collaboration> {
    const collaboration = await this.collaborationsRepository.findOne({
      where: { id },
      relations: ['brand', 'influencer', 'order'],
    });

    if (!collaboration) {
      throw new NotFoundException(`Collaboration with ID ${id} not found`);
    }

    return collaboration;
  }

  async update(id: string, updateCollaborationDto: UpdateCollaborationDto): Promise<Collaboration> {
    const collaboration = await this.findOne(id);
    
    // Update only the fields that are provided
    Object.assign(collaboration, updateCollaborationDto);
    
    return this.collaborationsRepository.save(collaboration);
  }

  async remove(id: string): Promise<void> {
    const result = await this.collaborationsRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Collaboration with ID ${id} not found`);
    }
  }
} 