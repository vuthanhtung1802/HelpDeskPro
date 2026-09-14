import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorBody {
  success: false;
  statusCode: number;
  message: string | string[];
  errors: unknown[];
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;
    const message = this.getMessage(exceptionResponse, statusCode);

    const body: ErrorBody = {
      success: false,
      statusCode,
      message,
      errors: [],
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(body);
  }

  private getMessage(
    exceptionResponse: string | object | null,
    statusCode: number,
  ): string | string[] {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (
      exceptionResponse &&
      'message' in exceptionResponse &&
      (typeof exceptionResponse.message === 'string' ||
        Array.isArray(exceptionResponse.message))
    ) {
      return exceptionResponse.message as string | string[];
    }

    return statusCode === 500 ? 'Internal server error' : 'Request failed';
  }
}
