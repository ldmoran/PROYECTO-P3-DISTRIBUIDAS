import { HttpException, HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';

interface LibroGrpcResponse {
  id: string;
  titulo: string;
  autor: string;
  isbn: string;
  disponible: boolean;
}

interface LibroGrpcService {
  obtenerLibro(data: { id: string }): import('rxjs').Observable<LibroGrpcResponse>;
}

@Injectable()
export class GatewayService implements OnModuleInit {
  private readonly logger = new Logger(GatewayService.name);
  private librosGrpcService!: LibroGrpcService;

  constructor(
    @Inject('LIBROS_SERVICE') private readonly librosClient: ClientProxy,
    @Inject('PRESTAMOS_SERVICE') private readonly prestamosClient: ClientProxy,
    @Inject('LIBROS_GRPC_SERVICE') private readonly librosGrpcClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.librosGrpcService = this.librosGrpcClient.getService<LibroGrpcService>('LibrosService');
  }

  private forward<T>(client: ClientProxy, pattern: string, data: any): Promise<T> {
    return firstValueFrom(
      client.send<T>(pattern, data).pipe(
        catchError((err) => {
          // Si el microservicio está caído, aquí es donde se ve el
          // acoplamiento temporal: la promesa se rechaza y el Gateway
          // responde con un error al cliente en vez de colgarse.
          const status = err?.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
          const message = err?.message ?? 'Error de comunicación con el microservicio';
          return throwError(() => new HttpException(message, status));
        }),
      ),
    );
  }

  // ---- Libros ----
  crearLibro(dto: any) {
    return this.forward(this.librosClient, 'libros.create', dto);
  }
  listarLibros() {
    return this.forward(this.librosClient, 'libros.findAll', {});
  }
  obtenerLibro(id: string) {
    return this.forward(this.librosClient, 'libros.findOne', id);
  }

  async obtenerLibroGrpc(id: string) {
    try {
      return await firstValueFrom(this.librosGrpcService.obtenerLibro({ id }));
    } catch (error) {
      const status = error?.code === 5 ? HttpStatus.NOT_FOUND : HttpStatus.BAD_GATEWAY;
      const message = error?.details ?? error?.message ?? 'Error de comunicación con el microservicio gRPC';
      throw new HttpException(message, status);
    }
  }
  actualizarLibro(id: string, dto: any) {
    return this.forward(this.librosClient, 'libros.update', { id, dto });
  }
  eliminarLibro(id: string) {
    return this.forward(this.librosClient, 'libros.remove', id);
  }

  // ---- Préstamos ----
  crearPrestamo(dto: any) {
    return this.forward(this.prestamosClient, 'prestamos.create', dto);
  }
  listarPrestamos() {
    return this.forward(this.prestamosClient, 'prestamos.findAll', {});
  }
  obtenerPrestamo(id: string) {
    return this.forward(this.prestamosClient, 'prestamos.findOne', id);
  }
  devolverPrestamo(id: string) {
    return this.forward(this.prestamosClient, 'prestamos.devolver', id);
  }

  // ---- Solo para benchmark.js ----
  testSync(libroId: string) {
    return this.forward(this.prestamosClient, 'prestamos.testSync', libroId);
  }
  testAsync() {
    return this.forward(this.prestamosClient, 'prestamos.testAsync', {});
  }

  registrarPrestamoAuditoria(payload: any) {
    this.logger.log(`Auditoría RabbitMQ recibida: ${JSON.stringify(payload)}`);
    return { recibido: true };
  }
}
