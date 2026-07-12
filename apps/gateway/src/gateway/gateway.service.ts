import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';

@Injectable()
export class GatewayService {
  constructor(
    @Inject('LIBROS_SERVICE') private readonly librosClient: ClientProxy,
    @Inject('PRESTAMOS_SERVICE') private readonly prestamosClient: ClientProxy,
  ) {}

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
}
