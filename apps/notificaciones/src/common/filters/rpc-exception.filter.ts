import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

/**
 * Traduce cualquier excepción a un objeto plano y la registra en el logger.
 * Notificaciones consume eventos (@EventPattern) sin canal de respuesta, así
 * que sin este filtro un error en el handler se pierde en silencio.
 */
@Catch()
export class AllExceptionsToRpcFilter implements ExceptionFilter {
  private readonly logger = new Logger('NotificacionesExceptionFilter');

  catch(exception: unknown, _host: ArgumentsHost): Observable<any> {
    this.logger.error((exception as Error)?.message ?? exception, (exception as Error)?.stack);

    if (exception instanceof RpcException) {
      return throwError(() => exception.getError());
    }
    if (exception instanceof HttpException) {
      return throwError(() => ({
        statusCode: exception.getStatus(),
        message: exception.message,
      }));
    }
    return throwError(() => ({
      statusCode: 500,
      message: (exception as Error)?.message ?? 'Error interno del microservicio Notificaciones',
    }));
  }
}
