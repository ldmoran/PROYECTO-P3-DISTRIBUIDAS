import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RevokedTokenService } from './revoked-token.service';



@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'biblioteca-secret'),
        // @nestjs/jwt tipa expiresIn como number | StringValue (paquete `ms`),
        // no como string genérico; la variable de entorno solo puede tipar string.
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '1h') as any },
      }),
    }),
  ],
  controllers: [AuthController],
providers: [
  AuthService,
  JwtStrategy,
  JwtAuthGuard,
  RevokedTokenService,
],
exports: [
  AuthService,
  JwtAuthGuard,
  RevokedTokenService,
],
})
export class AuthModule {}
