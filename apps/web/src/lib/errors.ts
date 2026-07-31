import { ZodError } from 'zod';

/** Extracts a human-readable message from a caught error, unwrapping ZodError. */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ZodError) {
    return err.errors[0]?.message ?? fallback;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}
