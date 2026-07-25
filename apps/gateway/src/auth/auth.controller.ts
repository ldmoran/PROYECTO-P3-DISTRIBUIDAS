import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: Record<string, any>) {
    const username = body?.username;
    const password = body?.password;

    const result = await this.authService.login(username, password);
    if (!result) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return result;
  }
}
