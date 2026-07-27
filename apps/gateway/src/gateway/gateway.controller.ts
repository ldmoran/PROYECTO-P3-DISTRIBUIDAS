import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GatewayService } from './gateway.service';
import { AuditoriaConsumerService } from './auditoria-consumer.service';
import { CreateLibroDto } from '../common/dto/create-libro.dto';
import { UpdateLibroDto } from '../common/dto/update-libro.dto';
import { CreatePrestamoDto } from '../common/dto/create-prestamo.dto';
import { TestSyncDto } from '../common/dto/test-sync.dto';

@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GatewayController {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly auditoriaConsumerService: AuditoriaConsumerService,
  ) {}

  // ---- Libros ----
  @Post('libros')
  @Roles('admin')
  crearLibro(@Body() dto: CreateLibroDto) {
    return this.gatewayService.crearLibro(dto);
  }

  @Get('libros')
  listarLibros() {
    return this.gatewayService.listarLibros();
  }

  @Get('libros/:id')
  obtenerLibro(@Param('id') id: string) {
    return this.gatewayService.obtenerLibro(id);
  }

  @Get('libros/grpc/:id')
  obtenerLibroGrpc(@Param('id') id: string) {
    return this.gatewayService.obtenerLibroGrpc(id);
  }

  @Get('libros/grpc/:id/disponibilidad')
  verificarDisponibilidadGrpc(@Param('id') id: string) {
    return this.gatewayService.verificarDisponibilidadGrpc(id);
  }

  @Patch('libros/:id')
  actualizarLibro(@Param('id') id: string, @Body() dto: UpdateLibroDto) {
    return this.gatewayService.actualizarLibro(id, dto);
  }

  @Delete('libros/:id')
  eliminarLibro(@Param('id') id: string) {
    return this.gatewayService.eliminarLibro(id);
  }

  // ---- Préstamos ----
  @Post('prestamos')
  crearPrestamo(@Body() dto: CreatePrestamoDto) {
    return this.gatewayService.crearPrestamo(dto);
  }

  @Get('prestamos')
  listarPrestamos() {
    return this.gatewayService.listarPrestamos();
  }

  @Get('prestamos/:id')
  obtenerPrestamo(@Param('id') id: string) {
    return this.gatewayService.obtenerPrestamo(id);
  }

  @Patch('prestamos/:id/devolver')
  devolverPrestamo(@Param('id') id: string) {
    return this.gatewayService.devolverPrestamo(id);
  }

  // ---- Endpoints SOLO para benchmark.js (Paso 16) y prueba de caída (Paso 17) ----
  @Post('prestamos/test-sync')
  testSync(@Body() dto: TestSyncDto) {
    return this.gatewayService.testSync(dto.libroId);
  }

  @Post('prestamos/test-async')
  testAsync() {
    return this.gatewayService.testAsync();
  }

  @EventPattern('prestamo.auditoria')
  handlePrestamoAuditoria(@Payload() payload: any) {
    void this.auditoriaConsumerService.handlePrestamoAuditoria(payload);
  }
}
