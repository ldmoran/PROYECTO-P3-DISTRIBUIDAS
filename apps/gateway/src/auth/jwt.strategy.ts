import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RevokedTokenService } from './revoked-token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
  private readonly configService: ConfigService,
  private readonly revokedTokenService: RevokedTokenService,
) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'biblioteca-secret'),
    });
  }

async validate(payload: any) {
  const revoked = await this.revokedTokenService.isRevoked(payload.jti);

  if (revoked) {
    throw new UnauthorizedException('Token revocado');
  }

  return {
    userId: payload.sub,
    username: payload.username,
    roles: payload.roles ?? [],
    jti: payload.jti,
  };
}
}
