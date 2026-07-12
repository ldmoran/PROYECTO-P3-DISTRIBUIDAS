import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificacionesService } from './notificaciones.service';

@Controller()
export class NotificacionesController {
  private readonly logger = new Logger(NotificacionesController.name);

  constructor(private readonly notificacionesService: NotificacionesService) {}

  // Se dispara cuando Préstamos publica el evento tras registrar un préstamo real.
  @EventPattern('prestamo.registrado')
  async handlePrestamoRegistrado(@Payload() payload: any) {
    await this.notificacionesService.procesarPrestamoRegistrado(payload);
  }

  // Evento liviano usado solo por benchmark.js para medir el camino asíncrono puro.
  @EventPattern('prestamo.test')
  handlePrestamoTest(@Payload() payload: any) {
    this.logger.log(`Evento de prueba recibido: ${JSON.stringify(payload)}`);
  }
}
