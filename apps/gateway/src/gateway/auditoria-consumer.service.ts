import { Injectable, Logger } from '@nestjs/common';
import { GatewayService } from './gateway.service';

@Injectable()
export class AuditoriaConsumerService {
  private readonly logger = new Logger(AuditoriaConsumerService.name);

  constructor(private readonly gatewayService: GatewayService) {}

  async handlePrestamoAuditoria(payload: any) {
    this.logger.log(`Evento RabbitMQ 'prestamo.auditoria' recibido: ${JSON.stringify(payload)}`);
    this.gatewayService.registrarPrestamoAuditoria(payload);
  }
}
