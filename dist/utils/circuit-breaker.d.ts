/**
 * Circuit Breaker Pattern for graceful degradation when Odoo is unavailable.
 *
 * How it works (like an electrical circuit breaker):
 *
 * CLOSED (Normal):
 *   - Requests flow through to Odoo normally
 *   - If a request fails, increment failure counter
 *   - If failures reach threshold (5), trip the circuit → OPEN
 *
 * OPEN (Tripped - Failing Fast):
 *   - All requests immediately fail with CircuitBreakerError
 *   - No actual calls to Odoo (saves time waiting for timeouts)
 *   - After reset timeout (60s), transition to HALF_OPEN
 *
 * HALF_OPEN (Testing Recovery):
 *   - Allow ONE test request through to Odoo
 *   - If it succeeds → CLOSED (Odoo is back!)
 *   - If it fails → OPEN (Odoo still down, wait another 60s)
 */
/**
 * The three states of the circuit breaker
 */
export declare enum CircuitState {
    CLOSED = "CLOSED",// Normal operation
    OPEN = "OPEN",// Failing fast (Odoo is down)
    HALF_OPEN = "HALF_OPEN"
}
/**
 * Error thrown when circuit is OPEN (failing fast)
 */
export declare class CircuitBreakerError extends Error {
    readonly secondsUntilRetry: number;
    constructor(message: string, secondsUntilRetry?: number);
}
/**
 * Metrics returned by getMetrics() for monitoring
 */
export interface CircuitBreakerMetrics {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureTime: number | null;
    lastStateChange: number | null;
    secondsUntilHalfOpen: number | null;
}
/**
 * Circuit Breaker implementation
 */
export declare class CircuitBreaker {
    private readonly failureThreshold;
    private readonly resetTimeoutMs;
    private readonly halfOpenMaxAttempts;
    private state;
    private failureCount;
    private successCount;
    private lastFailureTime;
    private lastStateChange;
    private halfOpenAttempts;
    /**
     * Create a new Circuit Breaker
     * @param failureThreshold - Number of failures before opening circuit (default: 5)
     * @param resetTimeoutMs - Time to wait before testing recovery (default: 60000ms)
     * @param halfOpenMaxAttempts - Test requests allowed in HALF_OPEN (default: 1)
     */
    constructor(failureThreshold?: number, resetTimeoutMs?: number, halfOpenMaxAttempts?: number);
    /**
     * Get current circuit state
     */
    getState(): CircuitState;
    /**
     * Get metrics for monitoring and debugging
     */
    getMetrics(): CircuitBreakerMetrics;
    /**
     * Execute a function with circuit breaker protection
     *
     * @param fn - The async function to execute (e.g., Odoo API call)
     * @returns The result of fn if successful
     * @throws CircuitBreakerError if circuit is OPEN
     * @throws Original error from fn if it fails
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * Manually reset the circuit breaker to CLOSED state
     * Useful for health check recovery or admin intervention
     */
    reset(): void;
    /**
     * Handle successful request
     */
    private onSuccess;
    /**
     * Handle failed request
     */
    private onFailure;
    /**
     * Check if enough time has passed to transition from OPEN to HALF_OPEN
     */
    private shouldTransitionToHalfOpen;
    /**
     * Calculate seconds until HALF_OPEN transition
     */
    private getSecondsUntilHalfOpen;
    /**
     * Transition to a new state with logging
     */
    private transitionTo;
}
//# sourceMappingURL=circuit-breaker.d.ts.map