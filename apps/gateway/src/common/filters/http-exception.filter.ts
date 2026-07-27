import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Response } from 'express';

/**
 * Convierte cualquier error (incluidos los que llegan desde un microservicio
 * vía TCP, ya normalizados como HttpException en gateway.service.ts) en una
 * respuesta HTTP consistente para el cliente REST.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Capturar el error en Sentry
    Sentry.captureException(exception);

    if (exception instanceof HttpException) {
      const rawStatus = exception.getStatus();
      const status =
        typeof rawStatus === 'number' && Number.isInteger(rawStatus)
          ? rawStatus
          : typeof rawStatus === 'string' && /^\d+$/.test(rawStatus)
          ? Number.parseInt(rawStatus, 10)
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const body = exception.getResponse();
      const responseBody = typeof body === 'string'
        ? { statusCode: status, message: body }
        : { ...body, statusCode: status };
      return response.status(status).json(responseBody);
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: (exception as Error)?.message ?? 'Error interno del Gateway',
    });
  }
}
