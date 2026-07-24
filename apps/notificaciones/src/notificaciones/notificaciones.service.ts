import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';

interface PrestamoRegistradoPayload {
  prestamoId: string;
  libroId: string;
  usuario: string;
}

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    @InjectRepository(Notificacion)
    private readonly notificacionRepository: Repository<Notificacion>,
  ) {}

  async procesarPrestamoRegistrado(payload: PrestamoRegistradoPayload) {
    // Aquí simulamos el envío de un correo electrónico (no se integra un
    // proveedor real porque no es objetivo del Avance 1).
    const mensaje = `Simulación de correo: se registró el préstamo ${payload.prestamoId} para ${payload.usuario}`;
    this.logger.log(mensaje);

    const notificacion = this.notificacionRepository.create({
      prestamoId: payload.prestamoId,
      mensaje,
    });

    try {
      return await this.notificacionRepository.save(notificacion);
    } catch (error) {
      // Este evento viene de Redis Pub/Sub sin canal de respuesta: si no lo
      // registramos aquí, un fallo al guardar la notificación se pierde en
      // silencio y nadie se entera de que el préstamo quedó sin notificar.
      this.logger.error(
        `No se pudo guardar la notificación del préstamo ${payload.prestamoId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
