import {  ArgumentsHost,  Catch,  ExceptionFilter,  HttpException,  HttpStatus,} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<{
      status(code: number): {
        json(body: unknown): void;
      };
    }>();

    const request = host.switchToHttp().getRequest<{
      url: string;
    }>();

    const isHttpException = exception instanceof HttpException;

    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = isHttpException
      ? exception.getResponse()
      : 'Internal server error';

    const message =
      typeof errorResponse === 'string'
        ? errorResponse
        : typeof errorResponse === 'object' &&
            errorResponse !== null &&
            'message' in errorResponse
          ? errorResponse.message
          : 'Internal server error';

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
