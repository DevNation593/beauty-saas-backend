import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from '../../domain/errors/DomainErrors';

interface HttpExceptionResponse {
  message?: string;
  details?: unknown;
  statusCode?: number;
  error?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: unknown = null;

    if (exception instanceof DomainError) {
      // Handle domain-specific errors
      status = exception.statusCode;
      message = exception.message;
      code = exception.code;
    } else if (exception instanceof HttpException) {
      // Handle HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as
        | HttpExceptionResponse
        | string;

      if (typeof exceptionResponse === 'object') {
        message = exceptionResponse.message || message;
        details = exceptionResponse.details || null;
      } else {
        message = exceptionResponse;
      }

      code = exception.constructor.name.replace('Exception', '').toUpperCase();
    } else if (exception instanceof Error) {
      // Handle generic errors
      message = exception.message;
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
      );
    }

    const errorResponse = {
      success: false,
      error: {
        code,
        message,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        ...(details !== null &&
        typeof details === 'object' &&
        details !== undefined
          ? { details }
          : {}),
      },
    };

    // Log error for monitoring
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${message}`,
        exception,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${message}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
