import { join } from 'path';

/** A `true`/`false` env flag; empty or unset gives `fallback`, anything else throws. */
export function parseBooleanEnv(
  name: string,
  value: string | undefined,
  fallback: boolean,
): boolean {
  const normalised = value?.trim().toLowerCase();
  if (normalised === 'true') return true;
  if (normalised === 'false') return false;
  if (normalised) {
    throw new Error(`${name} must be "true" or "false", got "${value}"`);
  }
  return fallback;
}

export const PRO_PRICE_KZT = 19900;

export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'diploma',
    // Schema synchronization is never permitted in production. Development
    // retains the existing convenience default but can explicitly disable it.
    synchronize:
      process.env.NODE_ENV !== 'production' &&
      process.env.DB_SYNCHRONIZE !== 'false',
    // Production builds the schema from the reviewed migrations in
    // src/database/migrations, applied on boot. DB_MIGRATIONS_RUN=false turns
    // that off (e.g. to apply them by hand with migration:run:prod first);
    // =true turns it on elsewhere. Unset keeps the default.
    migrationsRun: parseBooleanEnv(
      'DB_MIGRATIONS_RUN',
      process.env.DB_MIGRATIONS_RUN,
      process.env.NODE_ENV === 'production',
    ),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret',
    // A separate secret provides cryptographic separation when configured. The
    // tokenType check remains mandatory so legacy/dev environments that use a
    // single secret cannot accidentally treat a refresh token as an access one.
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      process.env.JWT_SECRET ||
      'super-secret',
    accessTokenExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  // Test period (decision D3): every brand gets Pro at no cost while this is
  // on. Turning it off restores the paywall; nothing else changes.
  freeTestPeriod: parseBooleanEnv(
    'FREE_TEST_PERIOD',
    process.env.FREE_TEST_PERIOD,
    true,
  ),
  // Private uploads (decision D4): a local disk volume behind StorageService.
  uploadDir: process.env.UPLOAD_DIR || join(process.cwd(), 'uploads'),
  mail: {
    from: process.env.MAIL_FROM || 'AdPartners <no-reply@adpartners.kz>',
    smtp: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT, 10) || 1025,
      // true = TLS from the start (port 465); false = STARTTLS when offered.
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || undefined,
      pass: process.env.SMTP_PASS || undefined,
    },
  },
});
