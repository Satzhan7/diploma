/**
 * Creates an admin account. Sign-up never creates admins, so this is the only
 * way to get one.
 *
 *   npm run admin:create -- <email>                  (dev, ts-node)
 *   node dist/scripts/create-admin.js <email>        (production image)
 *
 * The password comes from ADMIN_PASSWORD (at least 12 characters) or is
 * generated and printed once. The account is created verified. An existing
 * email is refused: this script never changes the role of an existing user.
 * Database settings come from the same DB_* variables as the app.
 */
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import dataSource from '../database/data-source';
import { User, UserRole } from '../users/entities/user.entity';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_ADMIN_PASSWORD = 12;

export function resolveAdminPassword(fromEnv: string | undefined): {
  password: string;
  generated: boolean;
} {
  if (fromEnv !== undefined && fromEnv !== '') {
    if (fromEnv.length < MIN_ADMIN_PASSWORD) {
      throw new Error(
        `ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD} characters`,
      );
    }
    return { password: fromEnv, generated: false };
  }
  return { password: randomBytes(18).toString('base64url'), generated: true };
}

export function parseAdminEmail(arg: string | undefined): string {
  const email = arg?.trim().toLowerCase();
  if (!email || !EMAIL.test(email)) {
    throw new Error('Usage: admin:create -- <email>');
  }
  return email;
}

async function main() {
  const email = parseAdminEmail(process.argv[2]);
  const { password, generated } = resolveAdminPassword(
    process.env.ADMIN_PASSWORD,
  );

  await dataSource.initialize();
  try {
    const users = dataSource.getRepository(User);
    const taken = await users
      .createQueryBuilder('user')
      .where('LOWER(user.email) = :email', { email })
      .getExists();
    if (taken) {
      throw new Error(`A user with the email ${email} already exists`);
    }

    await users.save(
      users.create({
        email,
        name: 'Admin',
        role: UserRole.ADMIN,
        password: await bcrypt.hash(password, 10),
        emailVerifiedAt: new Date(),
      }),
    );
  } finally {
    await dataSource.destroy();
  }

  console.log(`Admin account created: ${email}`);
  if (generated) {
    console.log(`Generated password (shown once, change it): ${password}`);
  }
}

if (require.main === module) {
  main().catch((error: Error) => {
    console.error(`admin:create failed: ${error.message}`);
    process.exit(1);
  });
}
