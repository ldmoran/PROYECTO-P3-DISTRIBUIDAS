import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(username: string, password: string) {
    if (username !== 'admin' || password !== 'admin123') {
      return null;
    }

    const payload = { sub: username, username };
    return {
      access_token: this.jwtService.sign(payload),
      user: { username },
    };
  }
}
