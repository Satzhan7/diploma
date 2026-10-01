import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    ProfilesModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // JwtModule is intentionally configured for access tokens only. Refresh
        // tokens are signed and verified explicitly in AuthService.
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.accessTokenExpiration', '15m'),
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  // JwtModule exported so other modules (chats gateway) verify tokens with
  // the same secret/options instead of registering their own copy.
  exports: [AuthService, JwtModule],
  controllers: [AuthController],
})
export class AuthModule {}
