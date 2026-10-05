/**
 * Demo seed script.
 *
 * Usage (against the dev docker-compose database):
 *   docker-compose up -d postgres && npm run seed
 *
 * Boots the real AppModule in a standalone context and drives the same
 * services the API uses, so every side effect (profile creation, deal +
 * chat seeding on acceptance, application auto-rejection) follows the
 * production code path. Safe to re-run: existing users are reused, but each
 * run creates a fresh set of orders/applications.
 */
import { NestFactory } from '@nestjs/core';

// Defaults for running from the host against the dev docker-compose stack.
// Real env vars always win (inside Docker, CI, etc).
process.env.DB_PORT = process.env.DB_PORT || '5435';
process.env.DB_NAME = process.env.DB_NAME || 'influencer_platform';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-key-change-in-production';

import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { ProfilesService } from '../profiles/profiles.service';
import { OrdersService } from '../orders/orders.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { BriefGoal, BriefPlatform } from '../orders/brief-options';
import { OrderApplicationsService } from '../orders/order-applications.service';
import { UserRole } from '../users/entities/user.entity';
import { ApplicationStatus } from '../orders/entities/order-application.entity';

const PASSWORD = 'demo1234';

const BRANDS = [
  {
    name: 'Aruzhan Cosmetics',
    email: 'brand1@demo.kz',
    categories: ['Beauty', 'Fashion'],
  },
  {
    name: 'SteppeFit Nutrition',
    email: 'brand2@demo.kz',
    categories: ['Fitness', 'Health'],
  },
];

const INFLUENCERS = [
  {
    name: 'Dana Beauty',
    email: 'inf1@demo.kz',
    categories: ['Beauty', 'Lifestyle'],
  },
  {
    name: 'Almaty Foodie',
    email: 'inf2@demo.kz',
    categories: ['Food', 'Travel'],
  },
  {
    name: 'FitWithAidar',
    email: 'inf3@demo.kz',
    categories: ['Fitness', 'Health'],
  },
  {
    name: 'TechSana',
    email: 'inf4@demo.kz',
    categories: ['Technology', 'Education'],
  },
];

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const auth = app.get(AuthService);
  const users = app.get(UsersService);
  const profiles = app.get(ProfilesService);
  const orders = app.get(OrdersService);
  const applications = app.get(OrderApplicationsService);

  const summary: Record<string, string> = {};

  const ensureUser = async (
    name: string,
    email: string,
    role: UserRole,
    categories: string[],
  ): Promise<string> => {
    let user = await users.findByEmail(email);
    if (!user) {
      await auth.register({ name, email, password: PASSWORD, role });
      user = await users.findByEmail(email);
      console.log(`created ${role}: ${email}`);
    } else {
      console.log(`exists  ${role}: ${email}`);
    }
    // Demo accounts skip the emailed code so they can log in at once.
    if (!user.emailVerifiedAt) await users.markEmailVerified(user.id);
    await profiles.updateProfile(user.id, { categories });
    return user.id;
  };

  // 1. Brands and influencers (+profiles via the registration path)
  const brandIds: string[] = [];
  for (const b of BRANDS) {
    brandIds.push(
      await ensureUser(b.name, b.email, UserRole.BRAND, b.categories),
    );
  }
  const influencerIds: string[] = [];
  for (const i of INFLUENCERS) {
    influencerIds.push(
      await ensureUser(i.name, i.email, UserRole.INFLUENCER, i.categories),
    );
  }
  summary.brand1 = brandIds[0];
  summary.influencer1 = influencerIds[0];

  // 2. Briefs from brand1: saved as drafts, then published (open).
  const inDays = (days: number) =>
    new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
  const orderSpecs: CreateOrderDto[] = [
    {
      title: 'Spring lipstick line launch',
      description:
        'Instagram campaign for our new spring lipstick collection across KZ.',
      goal: BriefGoal.LAUNCH,
      platform: BriefPlatform.INSTAGRAM,
      formats: ['reel', 'stories'],
      city: 'almaty',
      languages: ['ru', 'kk'],
      category: 'Beauty',
      budgetMin: 100000,
      budgetMax: 150000,
      deliverables: '1 Reel + 3 Stories',
      requirements: 'Min 10k followers, KZ audience.',
      postBy: inDays(14),
    },
    {
      title: 'Protein bar taste test',
      description:
        'Honest review format for the new SteppeFit protein bar range.',
      goal: BriefGoal.TRAFFIC,
      platform: BriefPlatform.YOUTUBE,
      formats: ['short'],
      city: 'any',
      languages: ['ru'],
      category: 'Fitness',
      budgetMin: 60000,
      budgetMax: 80000,
      deliverables: '1 YouTube Short',
      requirements: 'Fitness niche.',
      postBy: inDays(21),
    },
    {
      title: 'Summer skincare routine collab',
      description: 'Educational series about SPF with our dermatologist.',
      goal: BriefGoal.FOLLOWERS,
      platform: BriefPlatform.INSTAGRAM,
      formats: ['post', 'stories'],
      city: 'astana',
      languages: ['kk', 'ru'],
      category: 'Beauty',
      budgetMin: 150000,
      budgetMax: 200000,
      deliverables: '1 carousel post + 2 Stories',
      requirements: null,
      postBy: inDays(30),
    },
  ];
  const orderIds: string[] = [];
  for (const spec of orderSpecs) {
    const draft = await orders.create(brandIds[0], spec);
    const order = await orders.publish(draft.id, brandIds[0]);
    orderIds.push(order.id);
    console.log(`brief   "${spec.title}" -> ${order.id}`);
  }
  summary.order1 = orderIds[0];

  // 3. Applications from influencers to order1 (+ one to order2)
  const app1 = await applications.create(orderIds[0], influencerIds[0], {
    message:
      'Beauty is my core niche — my audience is 80% KZ women 18-34. Would love to collaborate!',
    proposedPrice: 140000,
  });
  await applications.create(orderIds[0], influencerIds[1], {
    message:
      'I can give the campaign a lifestyle angle with food/beauty crossover content.',
    proposedPrice: 120000,
  });
  await applications.create(orderIds[1], influencerIds[2], {
    message:
      'Fitness content is my specialty, happy to do an honest taste test.',
    proposedPrice: 75000,
  });
  console.log(`applications created: 3`);
  summary.application1 = app1.id;

  // 4. Accept influencer1's application — triggers the full chain:
  //    order -> in-progress, deal created, other applications rejected,
  //    chat created and seeded with a welcome message.
  await applications.update(app1.id, brandIds[0], UserRole.BRAND, {
    status: ApplicationStatus.ACCEPTED,
  });
  console.log(`accepted application ${app1.id} (deal + chat auto-created)`);

  console.log('\n=== Seed summary ===');
  console.log(`login password for all demo users: ${PASSWORD}`);
  console.table(summary);
  console.log('Brand logins:      ', BRANDS.map((b) => b.email).join(', '));
  console.log(
    'Influencer logins: ',
    INFLUENCERS.map((i) => i.email).join(', '),
  );

  await app.close();
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
