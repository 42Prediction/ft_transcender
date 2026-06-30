import { HttpException, HttpStatus } from '@nestjs/common';

export interface ApiResponse<T = null> {
  success: boolean;
  statusCode: HttpStatus;
  data: T | null;
  error: string | null;
}

export const unauthorizedResponse = () => {
    return {
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        data: null,
        error: 'Unauthorized',
    }
}

export const errorResponse = (
  error: any
): ApiResponse => {
    const statusCode =
        error instanceof HttpException
            ? error.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
    return {
        success: false,
        statusCode,
        data: null,
        error,
    }

};

export const successResponse = <T>(
  statusCode: HttpStatus,
  data: T
): ApiResponse<T> => ({
  success: true,
  statusCode,
  data,
  error: null,
});