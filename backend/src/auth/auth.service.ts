import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { refreshTokenMatches } from './refresh-token-hash';
import { ProfilesService } from '../profiles/profiles.service';
import { ProfileType } from '../profiles/entities/profile.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { TokenPayload } from './types/token-payload';
import { apiError, ErrorCode } from '../common/errors/error-codes';
import { EmailVerificationService } from './email-verification.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendCodeDto } from './dto/resend-code.dto';

/**
 * Register and resend always answer with this, whether or not the email
 * belongs to an account, so the API never reveals registered emails.
 */
export const VERIFICATION_REQUIRED = { verificationRequired: true } as const;

const profileTypeOf = (role: UserRole) =>
  role === UserRole.BRAND ? ProfileType.BRAND : ProfileType.INFLUENCER;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly profilesService: ProfilesService,
    private readonly configService: ConfigService,
    private readonly emailVerification: EmailVerificationService,
  ) {}

  /** Creates the account and emails a code. No tokens until the code is entered. */
  async register(registerDto: RegisterDto) {
    const { name, email, password, role, language = 'ru' } = registerDto;
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      if (existingUser.emailVerifiedAt) {
        // Nothing to do, but cost the same bcrypt work as a new account so
        // response time does not reveal the email.
        await bcrypt.hash(password, 10);
      } else {
        // Unconfirmed sign-up: the latest name and role win, a fresh code
        // goes out (cooldown applies). The password is set at verification.
        await this.usersService.update(existingUser.id, { name, role });
        await this.profilesService.setType(
          existingUser.id,
          profileTypeOf(role),
        );
        await this.emailVerification.send(existingUser, language);
      }
      return VERIFICATION_REQUIRED;
    }

    const user = await this.usersService.create({
      name,
      email,
      password,
      role,
    });

    await this.profilesService.createProfile(user.id, profileTypeOf(role));

    await this.emailVerification.send(user, language);
    return VERIFICATION_REQUIRED;
  }

  /**
   * Checks the emailed code, then marks the email verified with the password
   * sent here and signs the user in. Whoever registered the email first
   * cannot keep access: only the inbox owner gets this far.
   */
  async verifyEmail({ email, code, password }: VerifyEmailDto) {
    const user = await this.usersService.findByEmail(email);
    // Unknown and already-verified emails look like a wrong code.
    if (!user || user.emailVerifiedAt) {
      throw this.emailVerification.invalid();
    }
    await this.emailVerification.verify(user.id, code);
    // Verified first, then the code is used up: if the second step fails the
    // user is already in, never locked out.
    await this.usersService.completeEmailVerification(user.id, password);
    await this.emailVerification.consume(user.id);
    return this.startSession(await this.usersService.findById(user.id));
  }

  async resendCode({ email, language = 'ru' }: ResendCodeDto) {
    const user = await this.usersService.findByEmail(email);
    if (user && !user.emailVerifiedAt) {
      await this.emailVerification.send(user, language);
    }
    return VERIFICATION_REQUIRED;
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException(
        apiError(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Invalid credentials'),
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        apiError(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Invalid credentials'),
      );
    }

    // Checked after the password, so it reveals nothing to a stranger.
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException(
        apiError(ErrorCode.AUTH_EMAIL_NOT_VERIFIED, 'Email is not verified'),
      );
    }

    return this.startSession(user);
  }

  private async startSession(user: User) {
    const tokens = await this.generateTokens(user.id, user.email);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
    return { user, ...tokens };
  }

  async refreshTokens(refreshToken: string) {
    // Only a bad token is a 401; database errors propagate as 500.
    const invalid = () =>
      new UnauthorizedException(
        apiError(ErrorCode.AUTH_INVALID_TOKEN, 'Invalid refresh token'),
      );

    let decoded: TokenPayload;
    try {
      decoded = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });
    } catch {
      throw invalid();
    }
    if (decoded.tokenType !== 'refresh') {
      throw invalid();
    }

    const user = await this.usersService.findById(decoded.sub);
    if (
      !user ||
      !user.refreshToken ||
      !refreshTokenMatches(refreshToken, user.refreshToken)
    ) {
      throw invalid();
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  private async generateTokens(userId: string, email: string) {
    // TTLs come from configuration (JWT_ACCESS_EXPIRATION / JWT_REFRESH_EXPIRATION)
    // — previously hardcoded in three different places (AUDIT §3).
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          tokenType: 'access',
        },
        {
          expiresIn: this.configService.get('jwt.accessTokenExpiration', '15m'),
          secret: this.configService.get('jwt.secret'),
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          tokenType: 'refresh',
        },
        {
          expiresIn: this.configService.get('jwt.refreshTokenExpiration', '7d'),
          secret: this.configService.get('jwt.refreshSecret'),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async deleteAccount(userId: string) {
    // First check if the user exists
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(
        apiError(ErrorCode.USER_NOT_FOUND, `User with ID ${userId} not found`),
      );
    }

    try {
      // Try to find and delete the profile if it exists
      try {
        const profile = await this.profilesService.findByUserId(userId);
        if (profile) {
          await this.profilesService.remove(profile.id);
        }
      } catch (profileError) {
        // Profile not found is okay, we can proceed with user deletion
        this.logger.warn(
          `Profile not found for user ${userId}, proceeding with user deletion`,
        );
      }

      // Then delete the user
      await this.usersService.remove(userId);

      return { message: 'Account successfully deleted' };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete account: ${error.message}`,
      );
    }
  }
}
