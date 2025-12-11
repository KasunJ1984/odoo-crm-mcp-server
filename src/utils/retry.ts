/**
 * Retry utility with exponential backoff for transient failures.
 * Provides resilience against temporary network issues and server errors.
 */

// Network/server errors that should trigger retry
const RETRYABLE_PATTERNS = [
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EHOSTUNREACH',
  'socket hang up', 'ENOTFOUND',
  '500', '502', '503', '504',  // HTTP 5xx server errors
  'Traceback',                  // Odoo Python errors (indicates server crash)
];

// Client errors that should NOT be retried (4xx-like errors)
const NON_RETRYABLE_PATTERNS = [
  'Invalid credentials', 'Access Denied', 'Forbidden',
  'unknown field', 'does not have attribute',
  'invalid literal',
];

/**
 * Determines if an error is retryable based on error message patterns.
 * @param error - The error to check
 * @returns true if the error is transient and should be retried
 */
function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  // Check if it's a non-retryable error first (client errors)
  for (const pattern of NON_RETRYABLE_PATTERNS) {
    if (message.includes(pattern)) return false;
  }

  // Check if it matches retryable patterns (network/server errors)
  for (const pattern of RETRYABLE_PATTERNS) {
    if (message.includes(pattern)) return true;
  }

  return false;  // Unknown errors: don't retry by default
}

/**
 * Executes a function with automatic retry and exponential backoff.
 *
 * @param fn - The async function to execute
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelayMs - Base delay in milliseconds (default: 1000)
 * @returns The result of the function
 * @throws The last error if all retries fail or error is non-retryable
 *
 * @example
 * const result = await executeWithRetry(
 *   () => fetchFromOdoo(),
 *   3,    // max 3 retries
 *   1000  // 1s base delay (1s, 2s, 4s backoff)
 * );
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry non-retryable errors or on last attempt
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.error(
        `[Retry ${attempt}/${maxRetries}] ${error instanceof Error ? error.message : error}. Waiting ${delay}ms...`
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
