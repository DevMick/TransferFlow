import type { Context, Next } from 'hono';

export interface ErrorResponse {
  error: string;
  details?: unknown;
  timestamp: string;
}

/**
 * Global error handling middleware
 * Catches all errors and returns consistent error responses
 */
export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    console.error('Error:', error);

    // Handle different error types
    if (error instanceof Error) {
      const status = (error as unknown as Record<string, unknown>).status || 500;
      const message = error.message || 'Internal server error';

      return c.json<ErrorResponse>(
        {
          error: message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        },
        status,
      );
    }

    // Handle unknown errors
    return c.json<ErrorResponse>(
      {
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      500,
    );
  }
};
