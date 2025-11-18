/**
 * Unified error handling for API
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}

/**
 * Global error handler
 */
export function errorHandler(
  error: Error | FastifyError | ZodError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Invalid request data',
      statusCode: 400,
      details: error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    } as ErrorResponse);
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Record not found
    if (error.code === 'P2025') {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'The requested resource was not found',
        statusCode: 404,
      } as ErrorResponse);
    }

    // Unique constraint violation
    if (error.code === 'P2002') {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'A record with this value already exists',
        statusCode: 409,
        details: { field: error.meta?.target },
      } as ErrorResponse);
    }

    // Foreign key constraint violation
    if (error.code === 'P2003') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid reference to related resource',
        statusCode: 400,
      } as ErrorResponse);
    }
  }

  // Fastify errors (including custom ones)
  if ('statusCode' in error) {
    return reply.status((error as FastifyError).statusCode || 500).send({
      error: error.name || 'Error',
      message: error.message,
      statusCode: (error as FastifyError).statusCode || 500,
    } as ErrorResponse);
  }

  // Default internal server error
  request.log.error(error);
  return reply.status(500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message,
    statusCode: 500,
  } as ErrorResponse);
}

/**
 * Custom application errors
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, `${resource}${id ? ` with id ${id}` : ''} not found`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, details);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
    this.name = 'ConflictError';
  }
}
