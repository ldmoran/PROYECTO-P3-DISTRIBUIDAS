import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
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
  @UseGuards(JwtAuthGuard)
@Post('logout')
async logout(@Req() req: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
  throw new UnauthorizedException('Token requerido');
}
  await this.authService.logout(token);

  return {
    message: 'Sesión cerrada correctamente',
  };
}
}
