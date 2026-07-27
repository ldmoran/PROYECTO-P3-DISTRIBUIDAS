import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

/**
 * Traduce cualquier excepción (HttpException, error normal, etc.) a un
 * objeto plano que el cliente TCP (Gateway u otro microservicio) puede leer,
 * en lugar de tumbar la conexión del microservicio.
 */
@Catch()
export class AllExceptionsToRpcFilter implements ExceptionFilter {
  catch(exception: unknown, _host: ArgumentsHost): Observable<any> {
    // Capturar el error en Sentry
    Sentry.captureException(exception);

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
      message: (exception as Error)?.message ?? 'Error interno del microservicio Libros',
    }));
  }
}
