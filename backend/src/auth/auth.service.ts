import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  ConflictException,
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
import { UserRole } from '../users/entities/user.entity';
import { TokenPayload } from './types/token-payload';
import { apiError, ErrorCode } from '../common/errors/error-codes';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly profilesService: ProfilesService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException(
        apiError(
          ErrorCode.AUTH_EMAIL_TAKEN,
          'User with this email already exists',
        ),
      );
    }

    const user = await this.usersService.create(registerDto);

    // Create a profile for the user based on their role
    const profileType =
      registerDto.role === UserRole.BRAND
        ? ProfileType.BRAND
        : ProfileType.INFLUENCER;
    await this.profilesService.createProfile(user.id, profileType);

    const tokens = await this.generateTokens(user.id, user.email);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user,
      ...tokens,
    };
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

    const tokens = await this.generateTokens(user.id, user.email);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user,
      ...tokens,
    };
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
