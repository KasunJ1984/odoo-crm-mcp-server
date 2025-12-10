/**
 * Retry utility with exponential backoff for transient failures.
 * Provides resilience against temporary network issues and server errors.
 */
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
export declare function executeWithRetry<T>(fn: () => Promise<T>, maxRetries?: number, baseDelayMs?: number): Promise<T>;
//# sourceMappingURL=retry.d.ts.map