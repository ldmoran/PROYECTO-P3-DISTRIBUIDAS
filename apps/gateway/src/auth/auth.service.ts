import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(username: string, password: string) {
    if (username === 'admin' && password === 'admin123') {
      const payload = { sub: username, username, roles: ['admin'] };
      return {
        access_token: this.jwtService.sign(payload),
        user: { username, roles: ['admin'] },
      };
    }

    if (username === 'guest' && password === 'guest123') {
      const payload = { sub: username, username, roles: ['user'] };
      return {
        access_token: this.jwtService.sign(payload),
        user: { username, roles: ['user'] },
      };
    }

    return null;
  }
}
