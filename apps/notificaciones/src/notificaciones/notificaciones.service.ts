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
    return this.notificacionRepository.save(notificacion);
  }
}
