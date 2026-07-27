import { HttpException } from '@nestjs/common';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { GatewayService } from './gateway.service';

/**
 * verificarDisponibilidadGrpc no tiene lógica propia más allá de traducir
 * el `code` gRPC a un HttpException controlado: por eso se prueba
 * instanciando GatewayService directamente, con un ClientGrpc simulado,
 * sin levantar TypeORM ni un TestingModule completo de Nest.
 */
describe('GatewayService.verificarDisponibilidadGrpc', () => {
  function buildService(verificarDisponibilidad: jest.Mock) {
    const mockGrpcService = {
      obtenerLibro: jest.fn(),
      verificarDisponibilidad,
    };
    const mockGrpcClient: Partial<ClientGrpc> = {
      getService: jest.fn().mockReturnValue(mockGrpcService),
    };

    const service = new GatewayService(
      {} as ClientProxy, // LIBROS_SERVICE (TCP): no lo usa este método
      {} as ClientProxy, // PRESTAMOS_SERVICE: no lo usa este método
      mockGrpcClient as ClientGrpc,
    );
    service.onModuleInit();
    return service;
  }

  it('traduce NOT_FOUND (gRPC code 5) a HttpException 404', async () => {
    const service = buildService(
      jest.fn().mockReturnValue(throwError(() => ({ code: 5, details: 'no encontrado' }))),
    );

    expect.assertions(2);
    try {
      await service.verificarDisponibilidadGrpc('inexistente');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(404);
    }
  });

  it('traduce INVALID_ARGUMENT (gRPC code 3) a HttpException 400', async () => {
    const service = buildService(
      jest.fn().mockReturnValue(throwError(() => ({ code: 3, details: 'id invalido' }))),
    );

    expect.assertions(2);
    try {
      await service.verificarDisponibilidadGrpc('');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(400);
    }
  });

  it('resuelve la disponibilidad cuando el libro existe', async () => {
    const service = buildService(jest.fn().mockReturnValue(of({ id: '1', disponible: true })));

    await expect(service.verificarDisponibilidadGrpc('1')).resolves.toEqual({
      id: '1',
      disponible: true,
    });
  });
});
