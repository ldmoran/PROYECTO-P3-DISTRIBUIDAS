import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'LIBROS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('LIBROS_TCP_HOST'),
            port: +config.get<string>('LIBROS_TCP_PORT', '4001'),
          },
        }),
      },
      {
        name: 'PRESTAMOS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('PRESTAMOS_TCP_HOST'),
            port: +config.get<string>('PRESTAMOS_TCP_PORT', '4002'),
          },
        }),
      },
      {
        name: 'LIBROS_GRPC_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: () => ({
          transport: Transport.GRPC,
          options: {
            package: 'biblioteca',
            protoPath: join(process.cwd(), 'proto', 'libros.proto'),
          },
        }),
      },
    ]),
  ],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
