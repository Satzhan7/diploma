import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    // Minimal claim object only — never the full entity. Spreading the entity
    // here strips class-transformer metadata, which previously leaked the
    // password/refreshToken hashes through serialization (SECURITY_AUDIT C3).
    return {
      id: user.id,
      sub: payload.sub,
      email: user.email,
      role: user.role,
      name: user.name,
    };
  }
} 