import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { EstadoPrestamo, Prestamo } from './entities/prestamo.entity';
import { CreatePrestamoDto } from './dto/create-prestamo.dto';

@Injectable()
export class PrestamosService {
  private readonly logger = new Logger(PrestamosService.name);

  constructor(
    @InjectRepository(Prestamo)
    private readonly prestamoRepository: Repository<Prestamo>,
    @Inject('LIBROS_SERVICE') private readonly librosClient: ClientProxy,
    @Inject('REDIS_SERVICE') private readonly redisClient: ClientProxy,
  ) {}

  /**
   * Flujo completo de negocio:
   * 1) Camino SÍNCRONO (TCP): pregunta a Libros si el libro está disponible y ESPERA la respuesta.
   * 2) Si está disponible, guarda el préstamo y marca el libro como prestado (otra llamada TCP).
   * 3) Camino ASÍNCRONO (Redis): publica el evento 'prestamo.registrado' y NO espera a Notificaciones.
   */
  async create(dto: CreatePrestamoDto) {
    const disponibilidad = await firstValueFrom(
      this.librosClient.send<{ id: string; disponible: boolean }>(
        'libros.verificarDisponibilidad',
        dto.libroId,
      ),
    );

    if (!disponibilidad?.disponible) {
      throw new RpcException({
        statusCode: 409,
        message: `El libro ${dto.libroId} no está disponible para préstamo`,
      });
    }

    const prestamo = this.prestamoRepository.create({
      libroId: dto.libroId,
      usuario: dto.usuario,
      estado: EstadoPrestamo.ACTIVO,
    });
    const guardado = await this.prestamoRepository.save(prestamo);

    await firstValueFrom(
      this.librosClient.send('libros.marcarComoPrestado', dto.libroId),
    );

    this.redisClient.emit('prestamo.registrado', {
      prestamoId: guardado.id,
      libroId: guardado.libroId,
      usuario: guardado.usuario,
      fecha: guardado.fechaPrestamo,
    });
    this.logger.log(`Evento 'prestamo.registrado' publicado para préstamo ${guardado.id}`);

    return guardado;
  }

  findAll() {
    return this.prestamoRepository.find();
  }

  async findOne(id: string) {
    const prestamo = await this.prestamoRepository.findOneBy({ id });
    if (!prestamo) {
      throw new RpcException({ statusCode: 404, message: `Préstamo ${id} no encontrado` });
    }
    return prestamo;
  }

  async devolver(id: string) {
    const prestamo = await this.findOne(id);
    prestamo.estado = EstadoPrestamo.DEVUELTO;
    await firstValueFrom(
      this.librosClient.send('libros.marcarComoDisponible', prestamo.libroId),
    );
    return this.prestamoRepository.save(prestamo);
  }

  /**
   * SOLO para benchmark.js: repite el hop síncrono TCP Gateway->Préstamos->Libros
   * (verificarDisponibilidad) sin escribir en la base de datos, para poder
   * medir la cadena síncrona muchas veces seguidas sin agotar libros.
   */
  testSync(libroId: string) {
    return firstValueFrom(
      this.librosClient.send('libros.verificarDisponibilidad', libroId),
    );
  }

  /**
   * SOLO para benchmark.js: mide el costo puro de publicar un evento en Redis,
   * sin tocar la base de datos ni al microservicio Libros. Sirve para comparar
   * contra testSync() y evidenciar que el camino asíncrono no acumula latencia.
   */
  testAsync() {
    this.redisClient.emit('prestamo.test', { test: true, fecha: new Date() });
    return { publicado: true };
  }
}
