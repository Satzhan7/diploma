import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { EmailVerification } from './entities/email-verification.entity';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { MailLanguage, verificationCodeMail } from '../mail/templates';
import { apiError, ErrorCode } from '../common/errors/error-codes';

export const CODE_TTL_MS = 10 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_ATTEMPTS = 5;
/** Codes per account per 24 h: at most 50 guesses a day against 10^6 codes. */
export const MAX_SENDS_PER_DAY = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

const hashCode = (code: string) =>
  createHash('sha256').update(code).digest('hex');

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    @InjectRepository(EmailVerification)
    private readonly codes: Repository<EmailVerification>,
    private readonly mail: MailService,
  ) {}

  /**
   * Emails a new code that replaces the previous one. Within the 60 s
   * cooldown or over the daily cap it sends nothing; callers answer the same
   * either way, so the response never shows whether an account exists.
   * The email goes out in the background: the request does not wait for
   * SMTP (no timing difference), and a failure is logged.
   */
  async send(user: User, lang: MailLanguage): Promise<void> {
    const now = Date.now();
    const current = await this.codes.findOneBy({ userId: user.id });
    if (current && now - current.sentAt.getTime() < RESEND_COOLDOWN_MS) return;

    const newWindow =
      !current || now - current.windowStartedAt.getTime() >= DAY_MS;
    const sendCount = newWindow ? 1 : current.sendCount + 1;
    if (sendCount > MAX_SENDS_PER_DAY) return;

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.codes.upsert(
      {
        userId: user.id,
        codeHash: hashCode(code),
        expiresAt: new Date(now + CODE_TTL_MS),
        attempts: 0,
        sentAt: new Date(now),
        sendCount,
        windowStartedAt: newWindow ? new Date(now) : current.windowStartedAt,
      },
      ['userId'],
    );
    this.mail
      .send(verificationCodeMail(user.email, user.name, code, lang))
      .catch((error: Error) =>
        // The account and code exist; the user can ask for a resend.
        this.logger.error(
          `Verification email to user ${user.id} failed: ${error.message}`,
        ),
      );
  }

  /**
   * Checks the code without using it up (see `consume`). Every failure is the
   * same AUTH_CODE_INVALID: distinct "expired" or "too many attempts" answers
   * would show which emails have a pending sign-up.
   */
  async verify(userId: string, code: string): Promise<void> {
    const current = await this.codes.findOneBy({ userId });
    if (!current || current.expiresAt.getTime() <= Date.now()) {
      throw this.invalid();
    }

    // Count the attempt atomically before comparing, so parallel guesses
    // cannot exceed the limit.
    const { affected } = await this.codes.increment(
      { id: current.id, attempts: LessThan(MAX_ATTEMPTS) },
      'attempts',
      1,
    );
    const given = Buffer.from(hashCode(code));
    const expected = Buffer.from(current.codeHash);
    if (!affected || !timingSafeEqual(given, expected)) {
      throw this.invalid();
    }
  }

  /** Deletes the code once the user is verified. */
  async consume(userId: string): Promise<void> {
    await this.codes.delete({ userId });
  }

  invalid() {
    return new BadRequestException(
      apiError(
        ErrorCode.AUTH_CODE_INVALID,
        'Wrong or expired verification code',
      ),
    );
  }
}
