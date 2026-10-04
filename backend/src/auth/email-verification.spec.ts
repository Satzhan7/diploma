import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { FindOperator } from 'typeorm';
import { AuthService, VERIFICATION_REQUIRED } from './auth.service';
import {
  EmailVerificationService,
  MAX_ATTEMPTS,
} from './email-verification.service';
import { EmailVerification } from './entities/email-verification.entity';
import { InMemoryMailService } from '../mail/in-memory-mail.service';
import { verificationCodeMail } from '../mail/templates';
import { User, UserRole } from '../users/entities/user.entity';

/** Just enough of Repository<EmailVerification> for the service. */
class FakeCodeRepo {
  rows: EmailVerification[] = [];
  async findOneBy({ userId }: { userId: string }) {
    const row = this.rows.find((r) => r.userId === userId);
    return row ? { ...row } : null;
  }
  async upsert(values: Partial<EmailVerification>) {
    this.rows = this.rows.filter((r) => r.userId !== values.userId);
    this.rows.push({
      id: `code-${this.rows.length + 1}`,
      ...values,
    } as EmailVerification);
  }
  async increment(
    where: { id: string; attempts: FindOperator<number> },
    _column: 'attempts',
    by: number,
  ) {
    const row = this.rows.find(
      (r) => r.id === where.id && r.attempts < where.attempts.value,
    );
    if (row) row.attempts += by;
    return { affected: row ? 1 : 0 };
  }
  async delete({ id }: { id: string }) {
    this.rows = this.rows.filter((r) => r.id !== id);
  }
}

class FakeUsers {
  users: User[] = [];
  async findByEmail(email: string) {
    return this.users.find((u) => u.email === email) ?? null;
  }
  async findById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }
  async create(data: Partial<User>) {
    const bcrypt = await import('bcrypt');
    const user = {
      ...data,
      id: `user-${this.users.length + 1}`,
      password: await bcrypt.hash(data.password, 4),
      emailVerifiedAt: null,
      refreshToken: null,
    } as User;
    this.users.push(user);
    return user;
  }
  async markEmailVerified(id: string) {
    (await this.findById(id)).emailVerifiedAt = new Date();
  }
  async updateRefreshToken() {}
}

const codeIn = (body: string) => body.match(/\b(\d{6})\b/)[1];
const errorCode = (e: unknown) => (e as any).getResponse().code;

describe('Email verification on sign-up', () => {
  const T0 = new Date('2026-10-04T10:00:00Z').getTime();
  const email = 'new@example.test';
  const signUp = {
    name: 'Aru',
    email,
    password: 'password123',
    role: UserRole.BRAND,
  };

  let mail: InMemoryMailService;
  let codes: FakeCodeRepo;
  let users: FakeUsers;
  let auth: AuthService;

  const at = (ms: number) => jest.setSystemTime(T0 + ms);
  const lastCode = () => codeIn(mail.lastTo(email).text);
  const fail = (p: Promise<unknown>) =>
    p.then(
      () => {
        throw new Error('expected a rejection');
      },
      (e) => e,
    );

  beforeEach(() => {
    jest.useFakeTimers({
      now: T0,
      doNotFake: [
        'nextTick',
        'setImmediate',
        'setTimeout',
        'setInterval',
        'queueMicrotask',
      ],
    });
    mail = new InMemoryMailService();
    codes = new FakeCodeRepo();
    users = new FakeUsers();
    const verification = new EmailVerificationService(codes as any, mail);
    const config = {
      get: (key: string, fallback?: string) =>
        key.endsWith('Expiration') ? fallback : 'secret',
    };
    auth = new AuthService(
      users as any,
      new JwtService({}),
      { createProfile: jest.fn() } as any,
      config as any,
      verification,
    );
  });

  afterEach(() => jest.useRealTimers());

  it('register emails a 6-digit code, stores only its hash and returns no tokens', async () => {
    const res = await auth.register(signUp);

    expect(res).toEqual(VERIFICATION_REQUIRED);
    expect(res).not.toHaveProperty('accessToken');
    expect(mail.sent).toHaveLength(1);
    const code = lastCode();
    expect(code).toMatch(/^\d{6}$/);
    expect(codes.rows[0].codeHash).toBe(
      createHash('sha256').update(code).digest('hex'),
    );
    expect(JSON.stringify(codes.rows)).not.toContain(code);
    expect(users.users[0].emailVerifiedAt).toBeNull();
  });

  it('login of an unverified user is 403 AUTH_EMAIL_NOT_VERIFIED, but only with the right password', async () => {
    await auth.register(signUp);

    const e = await fail(auth.login({ email, password: 'password123' }));
    expect(e).toBeInstanceOf(ForbiddenException);
    expect(errorCode(e)).toBe('AUTH_EMAIL_NOT_VERIFIED');
    await expect(
      auth.login({ email, password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('the right code verifies the email, issues tokens and is used up', async () => {
    await auth.register(signUp);
    const code = lastCode();

    const session = await auth.verifyEmail({ email, code });
    expect(session).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
    expect(users.users[0].emailVerifiedAt).toBeInstanceOf(Date);
    expect(codes.rows).toHaveLength(0);
    await expect(
      auth.login({ email, password: 'password123' }),
    ).resolves.toHaveProperty('accessToken');
    expect(errorCode(await fail(auth.verifyEmail({ email, code })))).toBe(
      'AUTH_CODE_INVALID',
    );
  });

  it('a wrong code is AUTH_CODE_INVALID and counts as an attempt', async () => {
    await auth.register(signUp);
    const wrong = lastCode() === '000000' ? '111111' : '000000';

    const e = await fail(auth.verifyEmail({ email, code: wrong }));
    expect(e).toBeInstanceOf(BadRequestException);
    expect(errorCode(e)).toBe('AUTH_CODE_INVALID');
    expect(codes.rows[0].attempts).toBe(1);
  });

  it(`after ${MAX_ATTEMPTS} wrong codes even the right one is refused`, async () => {
    await auth.register(signUp);
    const code = lastCode();
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      expect(
        errorCode(await fail(auth.verifyEmail({ email, code: wrong }))),
      ).toBe('AUTH_CODE_INVALID');
    }

    expect(errorCode(await fail(auth.verifyEmail({ email, code })))).toBe(
      'AUTH_CODE_TOO_MANY_ATTEMPTS',
    );
    expect(users.users[0].emailVerifiedAt).toBeNull();
  });

  it('a code expires after 10 minutes', async () => {
    await auth.register(signUp);
    const code = lastCode();

    at(10 * 60 * 1000);
    expect(errorCode(await fail(auth.verifyEmail({ email, code })))).toBe(
      'AUTH_CODE_EXPIRED',
    );
    at(10 * 60 * 1000 - 1);
    await expect(auth.verifyEmail({ email, code })).resolves.toHaveProperty(
      'accessToken',
    );
  });

  it('resend waits 60 s, then replaces the code and resets the attempts', async () => {
    await auth.register(signUp);
    const first = lastCode();
    await fail(
      auth.verifyEmail({
        email,
        code: first === '000000' ? '111111' : '000000',
      }),
    );

    at(59 * 1000);
    expect(await auth.resendCode({ email })).toEqual(VERIFICATION_REQUIRED);
    expect(mail.sent).toHaveLength(1);

    at(60 * 1000);
    expect(await auth.resendCode({ email, language: 'en' })).toEqual(
      VERIFICATION_REQUIRED,
    );
    expect(mail.sent).toHaveLength(2);
    expect(mail.lastTo(email).subject).toBe(
      'Your AdPartners verification code',
    );
    expect(codes.rows).toHaveLength(1);
    expect(codes.rows[0].attempts).toBe(0);
    const second = lastCode();
    if (second !== first) {
      expect(
        errorCode(await fail(auth.verifyEmail({ email, code: first }))),
      ).toBe('AUTH_CODE_INVALID');
    }
    await expect(
      auth.verifyEmail({ email, code: second }),
    ).resolves.toHaveProperty('accessToken');
  });

  it('answers the same for registered, verified and unknown emails', async () => {
    await auth.register(signUp);
    await auth.verifyEmail({ email, code: lastCode() });
    const sentBefore = mail.sent.length;

    expect(
      await auth.register({ ...signUp, password: 'another-password' }),
    ).toEqual(VERIFICATION_REQUIRED);
    expect(await auth.resendCode({ email })).toEqual(VERIFICATION_REQUIRED);
    expect(await auth.resendCode({ email: 'nobody@example.test' })).toEqual(
      VERIFICATION_REQUIRED,
    );
    expect(mail.sent).toHaveLength(sentBefore);
    expect(users.users).toHaveLength(1);
    expect(
      errorCode(
        await fail(
          auth.verifyEmail({ email: 'nobody@example.test', code: '123456' }),
        ),
      ),
    ).toBe('AUTH_CODE_INVALID');
    expect(
      errorCode(await fail(auth.verifyEmail({ email, code: '123456' }))),
    ).toBe('AUTH_CODE_INVALID');
  });

  it('registering again while unverified re-sends a code (after the cooldown) without changing the account', async () => {
    await auth.register(signUp);
    const password = users.users[0].password;

    at(60 * 1000);
    await auth.register({
      ...signUp,
      name: 'Someone else',
      password: 'another-password',
      language: 'kk',
    });
    expect(mail.sent).toHaveLength(2);
    expect(mail.lastTo(email).subject).toBe('AdPartners растау коды');
    expect(users.users).toHaveLength(1);
    expect(users.users[0].password).toBe(password);
  });

  it('a mail failure does not lose the account; resend works later', async () => {
    jest.spyOn(mail, 'send').mockRejectedValueOnce(new Error('SMTP down'));

    expect(await auth.register(signUp)).toEqual(VERIFICATION_REQUIRED);
    expect(users.users).toHaveLength(1);
    at(60 * 1000);
    await auth.resendCode({ email });
    await expect(
      auth.verifyEmail({ email, code: lastCode() }),
    ).resolves.toHaveProperty('accessToken');
  });
});

describe('verification email', () => {
  it('escapes the name in HTML and never expands placeholders inside it', () => {
    const msg = verificationCodeMail('a@b.kz', '<b>{code}</b>', '042917', 'ru');
    expect(msg.subject).toBe('Код подтверждения AdPartners');
    expect(msg.html).toContain('&lt;b&gt;{code}&lt;/b&gt;');
    expect(msg.html).toContain('042917</strong>');
    expect(msg.text).toContain('Здравствуйте, <b>{code}</b>!');
    expect(msg.text).toContain('Ваш код подтверждения: 042917');
  });
});
