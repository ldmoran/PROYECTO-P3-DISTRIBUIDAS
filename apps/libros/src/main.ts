import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsToRpcFilter } from './common/filters/rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsToRpcFilter());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: +(process.env.TCP_PORT ?? 4001),
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'biblioteca',
      protoPath: join(process.cwd(), 'proto', 'libros.proto'),
    },
  });

  await app.startAllMicroservices();
  console.log(`📚 Microservicio Libros escuchando por TCP en el puerto ${process.env.TCP_PORT ?? 4001}`);
}
bootstrap();
