import { Controller } from '@nestjs/common';
import { GrpcMethod, MessagePattern, Payload } from '@nestjs/microservices';
import { LibrosService } from './libros.service';
import { CreateLibroDto } from './dto/create-libro.dto';
import { UpdateLibroDto } from './dto/update-libro.dto';

@Controller()
export class LibrosController {
  constructor(private readonly librosService: LibrosService) {}

  @MessagePattern('libros.create')
  create(@Payload() dto: CreateLibroDto) {
    return this.librosService.create(dto);
  }

  @MessagePattern('libros.findAll')
  findAll() {
    return this.librosService.findAll();
  }

  @MessagePattern('libros.findOne')
  findOne(@Payload() id: string) {
    return this.librosService.findOne(id);
  }

  @GrpcMethod('LibrosService', 'ObtenerLibro')
  obtenerLibroGrpc(@Payload() data: { id: string }) {
    return this.librosService.obtenerLibroGrpc(data.id);
  }

  @MessagePattern('libros.update')
  update(@Payload() payload: { id: string; dto: UpdateLibroDto }) {
    return this.librosService.update(payload.id, payload.dto);
  }

  @MessagePattern('libros.remove')
  remove(@Payload() id: string) {
    return this.librosService.remove(id);
  }

  @MessagePattern('libros.verificarDisponibilidad')
  verificarDisponibilidad(@Payload() id: string) {
    return this.librosService.verificarDisponibilidad(id);
  }

  @MessagePattern('libros.marcarComoPrestado')
  marcarComoPrestado(@Payload() id: string) {
    return this.librosService.marcarComoPrestado(id);
  }

  @MessagePattern('libros.marcarComoDisponible')
  marcarComoDisponible(@Payload() id: string) {
    return this.librosService.marcarComoDisponible(id);
  }
}
