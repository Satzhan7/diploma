import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In, DataSource } from 'typeorm';
import {
  OrderApplication,
  ApplicationStatus,
} from './entities/order-application.entity';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderApplicationDto } from './dto/create-order-application.dto';
import { UpdateOrderApplicationDto } from './dto/update-order-application.dto';
import { ProfilesService } from '../profiles/profiles.service';
import { UserRole } from '../users/entities/user.entity';
import { toPublicUser } from '../users/public-user';
import { ChatsService } from '../chats/chats.service';
import { DealsService } from '../deals/deals.service';
import { apiError, ErrorCode } from '../common/errors/error-codes';

// Allowed application status changes. Every role, admin included, goes
// through this table. An accepted application becomes a Deal, which has its
// own transition table (src/deals/deal-transitions.ts).
export const APPLICATION_TRANSITIONS: Record<
  ApplicationStatus,
  readonly ApplicationStatus[]
> = {
  [ApplicationStatus.PENDING]: [
    ApplicationStatus.ACCEPTED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  [ApplicationStatus.ACCEPTED]: [],
  [ApplicationStatus.REJECTED]: [],
  [ApplicationStatus.WITHDRAWN]: [],
};

export function assertApplicationTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
): void {
  if (!APPLICATION_TRANSITIONS[from].includes(to)) {
    throw new BadRequestException(
      apiError(
        ErrorCode.APPLICATION_INVALID_TRANSITION,
        `Application cannot move from ${from} to ${to}`,
      ),
    );
  }
}

// Statuses from which `to` is reachable, for compare-and-set updates.
function sourcesOf(to: ApplicationStatus): ApplicationStatus[] {
  return (Object.keys(APPLICATION_TRANSITIONS) as ApplicationStatus[]).filter(
    (from) => APPLICATION_TRANSITIONS[from].includes(to),
  );
}

// Applications reach the applicant, the brand and admins. None of them gets
// the other side's email (decision D5): users become public users.
export function withPublicUsers(
  application: OrderApplication,
): OrderApplication {
  if (application.applicant) {
    Object.assign(application, {
      applicant: toPublicUser(application.applicant),
    });
  }
  const brand = application.order?.brand;
  if (brand?.user) {
    Object.assign(brand, { user: toPublicUser(brand.user) });
  }
  return application;
}

@Injectable()
export class OrderApplicationsService {
  private readonly logger = new Logger(OrderApplicationsService.name);

  constructor(
    @InjectRepository(OrderApplication)
    private readonly orderApplicationRepository: Repository<OrderApplication>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dealsService: DealsService,
    private readonly profilesService: ProfilesService,
    private readonly chatsService: ChatsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    orderId: string,
    userId: string,
    createOrderApplicationDto: CreateOrderApplicationDto,
  ): Promise<OrderApplication> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        // Lock the order before checking status and inserting. Acceptance uses
        // the same lock, so no application can be inserted after acceptance
        // has closed the order.
        const order = await manager.findOne(Order, {
          where: { id: orderId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!order) {
          throw new NotFoundException(
            apiError(
              ErrorCode.ORDER_NOT_FOUND,
              `Order with ID ${orderId} not found`,
            ),
          );
        }
        if (order.status !== OrderStatus.OPEN) {
          throw new BadRequestException(
            apiError(
              ErrorCode.ORDER_NOT_OPEN,
              'This order is not open for applications',
            ),
          );
        }

        const existingApplication = await manager.findOne(OrderApplication, {
          where: {
            order: { id: orderId },
            applicant: { id: userId },
          },
        });
        if (existingApplication) {
          throw new ConflictException(
            apiError(
              ErrorCode.APPLICATION_ALREADY_EXISTS,
              'You have already applied to this order',
            ),
          );
        }

        const application = manager.create(OrderApplication, {
          ...createOrderApplicationDto,
          order: { id: orderId },
          applicant: { id: userId },
          status: ApplicationStatus.PENDING,
        });
        return manager.save(OrderApplication, application);
      });
    } catch (error) {
      // PostgreSQL unique_violation closes the race between two concurrent
      // transactions after they both performed their read checks.
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException(
          apiError(
            ErrorCode.APPLICATION_ALREADY_EXISTS,
            'You have already applied to this order',
          ),
        );
      }
      throw error;
    }
  }

  async findAllByUser(userId: string): Promise<OrderApplication[]> {
    const applications = await this.orderApplicationRepository.find({
      where: { applicant: { id: userId } },
      relations: ['order', 'order.brand', 'order.brand.user'],
      order: {
        createdAt: 'DESC',
      },
    });
    return applications.map(withPublicUsers);
  }

  // `requester` is passed from the controller for direct reads; internal
  // callers (update/withdraw) omit it and apply their own ownership rules.
  async findOne(
    id: string,
    requester?: { id: string; role: UserRole },
  ): Promise<OrderApplication> {
    const application = await this.orderApplicationRepository.findOne({
      where: { id },
      relations: ['order', 'applicant', 'order.brand', 'order.brand.user'],
    });

    if (!application) {
      throw new NotFoundException(
        apiError(
          ErrorCode.APPLICATION_NOT_FOUND,
          `Application with ID ${id} not found`,
        ),
      );
    }

    // Read ownership (SECURITY_AUDIT H3): only the applicant, the brand that
    // owns the order, or an admin may view an application.
    if (
      requester &&
      requester.role !== UserRole.ADMIN &&
      application.applicant?.id !== requester.id &&
      application.order?.brand?.user?.id !== requester.id
    ) {
      throw new ForbiddenException(
        apiError(
          ErrorCode.APPLICATION_ACCESS_DENIED,
          'You do not have access to this application',
        ),
      );
    }

    // Direct reads leave without emails; internal callers need the full rows.
    return requester ? withPublicUsers(application) : application;
  }

  async update(
    id: string,
    userId: string,
    userRole: UserRole,
    updateOrderApplicationDto: UpdateOrderApplicationDto,
  ): Promise<OrderApplication> {
    const application = await this.findOne(id);

    // If user is an influencer, they can only update their own applications and only the message or proposedPrice
    if (userRole === UserRole.INFLUENCER) {
      if (application.applicant.id !== userId) {
        throw new ForbiddenException(
          apiError(
            ErrorCode.APPLICATION_ACCESS_DENIED,
            'You can only update your own applications',
          ),
        );
      }

      if (updateOrderApplicationDto.status) {
        throw new ForbiddenException(
          apiError(
            ErrorCode.APPLICATION_ACTION_FORBIDDEN,
            'Influencers cannot update application status',
          ),
        );
      }

      if (application.status !== ApplicationStatus.PENDING) {
        throw new BadRequestException(
          apiError(
            ErrorCode.APPLICATION_NOT_PENDING,
            'You can only update pending applications',
          ),
        );
      }
    }
    // Admins may move an application through the transition table, but the
    // applicant's own words and price are not theirs to change.
    else if (userRole === UserRole.ADMIN) {
      if (
        updateOrderApplicationDto.message !== undefined ||
        updateOrderApplicationDto.proposedPrice !== undefined
      ) {
        throw new ForbiddenException(
          apiError(
            ErrorCode.APPLICATION_ACTION_FORBIDDEN,
            'Admins can only change the application status',
          ),
        );
      }
    }
    // If user is a brand, they can only update the status of applications for their orders
    else if (userRole === UserRole.BRAND) {
      if (application.order.brand.user.id !== userId) {
        throw new ForbiddenException(
          apiError(
            ErrorCode.APPLICATION_ACCESS_DENIED,
            'You can only update applications for your own orders',
          ),
        );
      }

      if (
        updateOrderApplicationDto.message ||
        updateOrderApplicationDto.proposedPrice
      ) {
        throw new ForbiddenException(
          apiError(
            ErrorCode.APPLICATION_ACTION_FORBIDDEN,
            'Brands can only update application status',
          ),
        );
      }

      if (
        updateOrderApplicationDto.status &&
        updateOrderApplicationDto.status !== ApplicationStatus.ACCEPTED &&
        updateOrderApplicationDto.status !== ApplicationStatus.REJECTED
      ) {
        throw new ForbiddenException(
          apiError(
            ErrorCode.APPLICATION_ACTION_FORBIDDEN,
            'Brands can only accept or reject applications',
          ),
        );
      }
    }

    const nextStatus = updateOrderApplicationDto.status;
    if (nextStatus) {
      // Early, readable 400. The authoritative check runs again against the
      // locked or compare-and-set row below.
      assertApplicationTransition(application.status, nextStatus);
    }

    // Acceptance (owning brand or admin): order assignment, application save,
    // deal creation and reject-others are one atomic transaction with a row
    // lock on the order (SECURITY_AUDIT M2). The chat seed stays outside the
    // transaction — it is best-effort and must not roll back an acceptance.
    if (nextStatus === ApplicationStatus.ACCEPTED) {
      const applicantProfile = await this.profilesService.findByUserId(
        application.applicant.id,
      );
      if (!applicantProfile) {
        throw new NotFoundException(
          apiError(
            ErrorCode.PROFILE_NOT_FOUND,
            `Profile for applicant with ID ${application.applicant.id} not found`,
          ),
        );
      }

      const { brandUserId, influencerUserId, orderTitle } =
        await this.dataSource.transaction(async (manager) => {
          const order = await manager.findOne(Order, {
            where: { id: application.order.id },
            lock: { mode: 'pessimistic_write' },
          });

          if (!order) {
            throw new NotFoundException(
              apiError(
                ErrorCode.ORDER_NOT_FOUND,
                `Order with ID ${application.order.id} not found`,
              ),
            );
          }
          if (order.status !== OrderStatus.OPEN) {
            throw new BadRequestException(
              apiError(
                ErrorCode.ORDER_NOT_OPEN,
                'This order is not open for applications',
              ),
            );
          }

          // Re-read the application under a row lock (after the order lock,
          // same order as create) so a concurrent withdraw or reject cannot
          // be overwritten by this acceptance.
          const current = await manager.findOne(OrderApplication, {
            where: { id: application.id },
            lock: { mode: 'pessimistic_write' },
          });
          if (!current) {
            throw new NotFoundException(
              apiError(
                ErrorCode.APPLICATION_NOT_FOUND,
                `Application with ID ${application.id} not found`,
              ),
            );
          }
          assertApplicationTransition(
            current.status,
            ApplicationStatus.ACCEPTED,
          );

          order.status = OrderStatus.IN_PROGRESS;
          order.influencerId = applicantProfile.id;
          await manager.save(Order, order);

          current.status = ApplicationStatus.ACCEPTED;
          await manager.save(OrderApplication, current);

          // Reject the other applications that are still pending.
          await manager.update(
            OrderApplication,
            {
              order: { id: order.id },
              id: Not(application.id),
              status: ApplicationStatus.PENDING,
            },
            { status: ApplicationStatus.REJECTED },
          );

          // One deal per accepted application, created under the same
          // order lock (docs/adr/0001-deal-pipeline.md).
          await this.dealsService.createForAcceptedApplication(
            manager,
            order,
            current,
            applicantProfile.id,
          );

          return {
            brandUserId: application.order.brand.user.id,
            influencerUserId: application.applicant.id,
            orderTitle: order.title,
          };
        });

      // Best-effort chat seed (non-transactional by design).
      try {
        const chat = await this.chatsService.create(
          brandUserId,
          influencerUserId,
        );
        const welcomeMessage = `Your application for "${orderTitle}" has been accepted. Let's discuss the details!`;
        await this.chatsService.addMessage(
          chat.id,
          brandUserId,
          welcomeMessage,
        );
      } catch (error) {
        this.logger.error(
          `Chat seed after acceptance failed: ${(error as Error).message}`,
        );
      }

      application.status = ApplicationStatus.ACCEPTED;
      return withPublicUsers(application);
    }

    if (nextStatus) {
      await this.setStatusIfAllowed(application.id, nextStatus);
    }
    Object.assign(application, updateOrderApplicationDto);
    return withPublicUsers(
      await this.orderApplicationRepository.save(application),
    );
  }

  // Compare-and-set: the row changes only if its current status may move to
  // `to`, so a concurrent transition is never silently overwritten.
  private async setStatusIfAllowed(
    id: string,
    to: ApplicationStatus,
  ): Promise<void> {
    const result = await this.orderApplicationRepository.update(
      { id, status: In(sourcesOf(to)) },
      { status: to },
    );
    if (!result.affected) {
      throw new ConflictException(
        apiError(
          ErrorCode.APPLICATION_STALE,
          'Application status changed; reload and try again',
        ),
      );
    }
  }

  async withdraw(id: string, userId: string): Promise<OrderApplication> {
    const application = await this.findOne(id);

    if (application.applicant.id !== userId) {
      throw new ForbiddenException(
        apiError(
          ErrorCode.APPLICATION_ACCESS_DENIED,
          'You can only withdraw your own applications',
        ),
      );
    }

    assertApplicationTransition(
      application.status,
      ApplicationStatus.WITHDRAWN,
    );
    await this.setStatusIfAllowed(application.id, ApplicationStatus.WITHDRAWN);

    application.status = ApplicationStatus.WITHDRAWN;
    return withPublicUsers(application);
  }

  async findByOrder(
    orderId: string,
    userId: string,
  ): Promise<OrderApplication[]> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['brand', 'brand.user'],
    });

    if (!order) {
      throw new NotFoundException(
        apiError(
          ErrorCode.ORDER_NOT_FOUND,
          `Order with ID ${orderId} not found`,
        ),
      );
    }

    if (order.brand.user.id !== userId) {
      throw new ForbiddenException(
        apiError(
          ErrorCode.ORDER_ACCESS_DENIED,
          'You can only view applications for your own orders',
        ),
      );
    }

    const applications = await this.orderApplicationRepository.find({
      where: { order: { id: orderId } },
      relations: ['applicant', 'order'],
    });
    return applications.map(withPublicUsers);
  }
}
