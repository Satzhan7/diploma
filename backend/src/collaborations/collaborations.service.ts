import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCollaborationDto } from './dto/create-collaboration.dto';
import { UpdateCollaborationDto } from './dto/update-collaboration.dto';
import { Collaboration } from './entities/collaboration.entity';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class CollaborationsService {
  constructor(
    @InjectRepository(Collaboration)
    private collaborationsRepository: Repository<Collaboration>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private usersService: UsersService,
  ) {}

  async create(
    createCollaborationDto: CreateCollaborationDto,
  ): Promise<Collaboration> {
    const brand = await this.usersService.findById(
      createCollaborationDto.brandId,
    );
    const influencer = await this.usersService.findById(
      createCollaborationDto.influencerId,
    );
    if (!brand || brand.role !== UserRole.BRAND) {
      throw new BadRequestException('brandId must identify a brand user');
    }
    if (!influencer || influencer.role !== UserRole.INFLUENCER) {
      throw new BadRequestException(
        'influencerId must identify an influencer user',
      );
    }

    if (createCollaborationDto.orderId) {
      const order = await this.ordersRepository.findOne({
        where: { id: createCollaborationDto.orderId },
        relations: ['brand', 'brand.user', 'influencer', 'influencer.user'],
      });
      if (!order) {
        throw new NotFoundException(
          `Order with ID ${createCollaborationDto.orderId} not found`,
        );
      }
      if (
        order.brand?.user?.id !== brand.id ||
        order.influencer?.user?.id !== influencer.id
      ) {
        throw new BadRequestException(
          'The order does not belong to the supplied brand and influencer',
        );
      }
    }

    const collaboration = this.collaborationsRepository.create(
      createCollaborationDto,
    );
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

  async update(
    id: string,
    updateCollaborationDto: UpdateCollaborationDto,
  ): Promise<Collaboration> {
    const collaboration = await this.findOne(id);

    // The DTO permits only mutable fields; IDs and order links cannot change.
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
