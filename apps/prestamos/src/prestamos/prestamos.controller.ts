import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PrestamosService } from './prestamos.service';
import { CreatePrestamoDto } from './dto/create-prestamo.dto';

@Controller()
export class PrestamosController {
  constructor(private readonly prestamosService: PrestamosService) {}

  @MessagePattern('prestamos.create')
  create(@Payload() dto: CreatePrestamoDto) {
    return this.prestamosService.create(dto);
  }

  @MessagePattern('prestamos.findAll')
  findAll() {
    return this.prestamosService.findAll();
  }

  @MessagePattern('prestamos.findOne')
  findOne(@Payload() id: string) {
    return this.prestamosService.findOne(id);
  }

  @MessagePattern('prestamos.devolver')
  devolver(@Payload() id: string) {
    return this.prestamosService.devolver(id);
  }

  @MessagePattern('prestamos.testSync')
  testSync(@Payload() libroId: string) {
    return this.prestamosService.testSync(libroId);
  }

  @MessagePattern('prestamos.testAsync')
  testAsync() {
    return this.prestamosService.testAsync();
  }
}
