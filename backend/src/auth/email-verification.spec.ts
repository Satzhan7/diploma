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
  MAX_SENDS_PER_DAY,
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
  async delete({ userId }: { userId: string }) {
    this.rows = this.rows.filter((r) => r.userId !== userId);
  }
}

class FakeUsers {
  users: User[] = [];
  async findByEmail(email: string) {
    const wanted = email.trim().toLowerCase();
    return this.users.find((u) => u.email.toLowerCase() === wanted) ?? null;
  }
  async update(id: string, data: Partial<User>) {
    Object.assign(await this.findById(id), data);
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
  async completeEmailVerification(id: string, password: string) {
    const bcrypt = await import('bcrypt');
    Object.assign(await this.findById(id), {
      password: await bcrypt.hash(password, 4),
      emailVerifiedAt: new Date(),
      refreshToken: null,
    });
  }
  async updateRefreshToken() {}
}

const codeIn = (body: string) => body.match(/\b(\d{6})\b/)[1];
const errorCode = (e: unknown) => (e as any).getResponse().code;

describe('Email verification on sign-up', () => {
  const T0 = new Date('2026-10-04T10:00:00Z').getTime();
  const email = 'new@example.test';
  const password = 'password123';
  const signUp = { name: 'Aru', email, password, role: UserRole.BRAND };

  let mail: InMemoryMailService;
  let codes: FakeCodeRepo;
  let users: FakeUsers;
  let profiles: { createProfile: jest.Mock; setType: jest.Mock };
  let auth: AuthService;

  const at = (ms: number) => jest.setSystemTime(T0 + ms);
  const lastCode = () => codeIn(mail.lastTo(email).text);
  const wrongFor = (code: string) => (code === '000000' ? '111111' : '000000');
  const verify = (code: string, pw = password, address = email) =>
    auth.verifyEmail({ email: address, code, password: pw });
  const fail = (p: Promise<unknown>) =>
    p.then(
      () => {
        throw new Error('expected a rejection');
      },
      (e) => e,
    );
  const failCode = async (p: Promise<unknown>) => errorCode(await fail(p));

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
    profiles = { createProfile: jest.fn(), setType: jest.fn() };
    const verification = new EmailVerificationService(codes as any, mail);
    const config = {
      get: (key: string, fallback?: string) =>
        key.endsWith('Expiration') ? fallback : 'secret',
    };
    auth = new AuthService(
      users as any,
      new JwtService({}),
      profiles as any,
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

    const e = await fail(auth.login({ email, password }));
    expect(e).toBeInstanceOf(ForbiddenException);
    expect(errorCode(e)).toBe('AUTH_EMAIL_NOT_VERIFIED');
    await expect(
      auth.login({ email, password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('the right code verifies the email, issues tokens and is used up', async () => {
    await auth.register(signUp);
    const code = lastCode();

    const session = await verify(code);
    expect(session).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
    expect(users.users[0].emailVerifiedAt).toBeInstanceOf(Date);
    expect(codes.rows).toHaveLength(0);
    await expect(auth.login({ email, password })).resolves.toHaveProperty(
      'accessToken',
    );
    expect(await failCode(verify(code))).toBe('AUTH_CODE_INVALID');
  });

  it('a wrong code is AUTH_CODE_INVALID and counts as an attempt', async () => {
    await auth.register(signUp);

    const e = await fail(verify(wrongFor(lastCode())));
    expect(e).toBeInstanceOf(BadRequestException);
    expect(errorCode(e)).toBe('AUTH_CODE_INVALID');
    expect(codes.rows[0].attempts).toBe(1);
  });

  it(`after ${MAX_ATTEMPTS} wrong codes even the right one is refused, with the same error`, async () => {
    await auth.register(signUp);
    const code = lastCode();
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      expect(await failCode(verify(wrongFor(code)))).toBe('AUTH_CODE_INVALID');
    }

    // A distinct "too many attempts" code would reveal pending sign-ups.
    expect(await failCode(verify(code))).toBe('AUTH_CODE_INVALID');
    expect(users.users[0].emailVerifiedAt).toBeNull();
  });

  it('a code expires after 10 minutes, with the same error', async () => {
    await auth.register(signUp);
    const code = lastCode();

    at(10 * 60 * 1000);
    expect(await failCode(verify(code))).toBe('AUTH_CODE_INVALID');
    at(10 * 60 * 1000 - 1);
    await expect(verify(code)).resolves.toHaveProperty('accessToken');
  });

  it('resend waits 60 s, then replaces the code and resets the attempts', async () => {
    await auth.register(signUp);
    const first = lastCode();
    await fail(verify(wrongFor(first)));

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
      expect(await failCode(verify(first))).toBe('AUTH_CODE_INVALID');
    }
    await expect(verify(second)).resolves.toHaveProperty('accessToken');
  });

  it(`sends at most ${MAX_SENDS_PER_DAY} codes per account a day, so resends cannot buy unlimited guesses`, async () => {
    await auth.register(signUp);
    for (let i = 1; i <= MAX_SENDS_PER_DAY + 2; i++) {
      at(i * 60 * 1000);
      await auth.resendCode({ email });
    }
    expect(mail.sent).toHaveLength(MAX_SENDS_PER_DAY);

    at(24 * 60 * 60 * 1000);
    await auth.resendCode({ email });
    expect(mail.sent).toHaveLength(MAX_SENDS_PER_DAY + 1);
  });

  it('answers the same for registered, verified and unknown emails', async () => {
    await auth.register(signUp);
    await verify(lastCode());
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
    await expect(
      auth.login({ email, password: 'another-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(
      await failCode(verify('123456', password, 'nobody@example.test')),
    ).toBe('AUTH_CODE_INVALID');
    expect(await failCode(verify('123456'))).toBe('AUTH_CODE_INVALID');
  });

  it('a stranger who registered the email first cannot keep access', async () => {
    // The attacker signs up with the victim's address and their own password.
    await auth.register({
      ...signUp,
      name: 'Attacker',
      password: 'attacker-pass',
      role: UserRole.INFLUENCER,
    });
    // Later the victim signs up (in Kazakh) and gets a fresh code in their inbox.
    at(60 * 1000);
    await auth.register({
      ...signUp,
      name: 'Victim',
      password: 'victim-pass1',
      language: 'kk',
    });
    expect(mail.sent).toHaveLength(2);
    expect(mail.lastTo(email).subject).toBe('AdPartners растау коды');
    expect(users.users).toHaveLength(1);
    expect(users.users[0]).toMatchObject({
      name: 'Victim',
      role: UserRole.BRAND,
    });
    expect(profiles.setType).toHaveBeenCalledWith(users.users[0].id, 'brand');

    await verify(lastCode(), 'victim-pass1');

    await expect(
      auth.login({ email, password: 'attacker-pass' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      auth.login({ email, password: 'victim-pass1' }),
    ).resolves.toHaveProperty('accessToken');
  });

  it('matches the email case-insensitively', async () => {
    await auth.register(signUp);
    await expect(
      verify(lastCode(), password, ' NEW@Example.test '),
    ).resolves.toHaveProperty('accessToken');
  });

  it('marks the user verified before using up the code', async () => {
    await auth.register(signUp);
    jest.spyOn(codes, 'delete').mockRejectedValueOnce(new Error('db down'));

    await expect(verify(lastCode())).rejects.toThrow('db down');
    expect(users.users[0].emailVerifiedAt).toBeInstanceOf(Date);
    await expect(auth.login({ email, password })).resolves.toHaveProperty(
      'accessToken',
    );
  });

  it('a mail failure does not lose the account; resend works later', async () => {
    jest.spyOn(mail, 'send').mockRejectedValueOnce(new Error('SMTP down'));

    expect(await auth.register(signUp)).toEqual(VERIFICATION_REQUIRED);
    expect(users.users).toHaveLength(1);
    at(60 * 1000);
    await auth.resendCode({ email });
    await expect(verify(lastCode())).resolves.toHaveProperty('accessToken');
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
