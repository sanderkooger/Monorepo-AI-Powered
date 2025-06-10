/**
 * Type guard to check if an unknown error is a NodeJS.ErrnoException.
 * @param error The unknown error to check.
 * @returns True if the error is a NodeJS.ErrnoException, false otherwise.
 */
export function isNodeJS_ErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as NodeJS.ErrnoException).code === 'string'
  );
}