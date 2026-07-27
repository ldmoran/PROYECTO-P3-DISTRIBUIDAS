import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { RevokedTokenService } from './revoked-token.service';

@Injectable()
export class AuthService {
  constructor(
  private readonly jwtService: JwtService,
  private readonly revokedTokenService: RevokedTokenService,
) {}

  async login(username: string, password: string) {
    if (username === 'admin' && password === 'admin123') {
      const payload = {
  sub: username,
  username,
  roles: ['admin'],
  jti: randomUUID(),
};
      return {
        access_token: this.jwtService.sign(payload),
        user: { username, roles: ['admin'] },
      };
    }

    if (username === 'guest' && password === 'guest123') {
      const payload = {
  sub: username,
  username,
  roles: ['user'],
  jti: randomUUID(),
};
      return {
        access_token: this.jwtService.sign(payload),
        user: { username, roles: ['user'] },
      };
    }

    return null;
  }
  async logout(token: string) {
  const payload: any = this.jwtService.decode(token);

  if (!payload?.jti || !payload?.exp) {
    return;
  }

  const ttl = Math.max(payload.exp - Math.floor(Date.now() / 1000), 1);

  await this.revokedTokenService.revokeToken(payload.jti, ttl);
}
}
