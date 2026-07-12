import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

@Catch()
export class AllExceptionsToRpcFilter implements ExceptionFilter {
  catch(exception: unknown, _host: ArgumentsHost): Observable<any> {
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
      message: (exception as Error)?.message ?? 'Error interno del microservicio Préstamos',
    }));
  }
}
