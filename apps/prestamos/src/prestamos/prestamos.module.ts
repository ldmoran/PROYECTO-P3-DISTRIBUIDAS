import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrestamosController } from './prestamos.controller';
import { PrestamosService } from './prestamos.service';
import { Prestamo } from './entities/prestamo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prestamo]),
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
        name: 'REDIS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.REDIS,
          options: {
            host: config.get<string>('REDIS_HOST'),
            port: +config.get<string>('REDIS_PORT', '6379'),
          },
        }),
      },
    ]),
  ],
  controllers: [PrestamosController],
  providers: [PrestamosService],
})
export class PrestamosModule {}
