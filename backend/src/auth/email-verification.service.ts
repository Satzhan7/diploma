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
   * Emails a new code that replaces the previous one. Within the cooldown it
   * sends nothing; callers answer the same either way, so the response never
   * shows whether an account exists. Returns whether a code was sent.
   */
  async send(user: User, lang: MailLanguage): Promise<boolean> {
    const now = new Date();
    const current = await this.codes.findOneBy({ userId: user.id });
    if (
      current &&
      now.getTime() - current.sentAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      return false;
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.codes.upsert(
      {
        userId: user.id,
        codeHash: hashCode(code),
        expiresAt: new Date(now.getTime() + CODE_TTL_MS),
        attempts: 0,
        sentAt: now,
      },
      ['userId'],
    );
    try {
      await this.mail.send(
        verificationCodeMail(user.email, user.name, code, lang),
      );
    } catch (error) {
      // The account and code exist; the user can ask for a resend.
      this.logger.error(
        `Verification email to user ${user.id} failed: ${(error as Error).message}`,
      );
      return false;
    }
    return true;
  }

  /** Checks the code; on success the code is consumed. Throws a coded 400 otherwise. */
  async verify(userId: string, code: string): Promise<void> {
    const current = await this.codes.findOneBy({ userId });
    if (!current) throw this.invalid();
    if (current.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        apiError(ErrorCode.AUTH_CODE_EXPIRED, 'Verification code expired'),
      );
    }

    // Count the attempt atomically before comparing, so parallel guesses
    // cannot exceed the limit.
    const { affected } = await this.codes.increment(
      { id: current.id, attempts: LessThan(MAX_ATTEMPTS) },
      'attempts',
      1,
    );
    if (!affected) {
      throw new BadRequestException(
        apiError(
          ErrorCode.AUTH_CODE_TOO_MANY_ATTEMPTS,
          'Too many wrong codes; request a new one',
        ),
      );
    }

    const given = Buffer.from(hashCode(code));
    const expected = Buffer.from(current.codeHash);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      throw this.invalid();
    }
    await this.codes.delete({ id: current.id });
  }

  invalid() {
    return new BadRequestException(
      apiError(ErrorCode.AUTH_CODE_INVALID, 'Wrong verification code'),
    );
  }
}
