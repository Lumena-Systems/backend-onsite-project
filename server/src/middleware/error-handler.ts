import { Request, Response, NextFunction } from 'express';
import { APIError } from '@mock-crm/shared';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  if (err instanceof AppError) {
    const errorResponse: APIError = {
      error: err.name,
      message: err.message,
      status_code: err.statusCode,
      timestamp: new Date().toISOString(),
    };

    return res.status(err.statusCode).json(errorResponse);
  }

  // Default error
  const errorResponse: APIError = {
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
    status_code: 500,
    timestamp: new Date().toISOString(),
  };

  res.status(500).json(errorResponse);
}

export function notFoundHandler(req: Request, res: Response) {
  const errorResponse: APIError = {
    error: 'NotFound',
    message: `Endpoint ${req.method} ${req.path} not found`,
    status_code: 404,
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(errorResponse);
}

