/**
 * Shared Circuit Breaker for Connection Pool
 *
 * Why share a single circuit breaker across all pooled clients?
 * -----------------------------------------------------------
 * Think of it like a traffic light for a highway:
 * - If the road is blocked (Odoo is down), ALL lanes should stop
 * - Having separate traffic lights per lane would be wasteful
 * - When one car discovers the road is blocked, all cars benefit
 *
 * Benefits:
 * - If Odoo is down for one client, it's down for all
 * - Prevents wasteful retry attempts across multiple clients
 * - Consistent behavior - all requests fail/succeed together
 * - Faster recovery detection (first success opens for all)
 */
import { CircuitBreaker, CircuitState, CircuitBreakerMetrics } from '../utils/circuit-breaker.js';
/**
 * Get the shared circuit breaker instance.
 * Creates one if it doesn't exist (singleton pattern).
 *
 * @returns The shared CircuitBreaker instance
 */
export declare function getSharedCircuitBreaker(): CircuitBreaker;
/**
 * Reset the shared circuit breaker to CLOSED state.
 * Useful for:
 * - Manual recovery after Odoo comes back online
 * - Testing and development
 * - Admin intervention
 */
export declare function resetSharedCircuitBreaker(): void;
/**
 * Get the current state of the shared circuit breaker.
 * Shortcut for getSharedCircuitBreaker().getState()
 *
 * @returns Current circuit state (CLOSED, OPEN, or HALF_OPEN)
 */
export declare function getSharedCircuitBreakerState(): CircuitState;
/**
 * Get metrics from the shared circuit breaker.
 * Shortcut for getSharedCircuitBreaker().getMetrics()
 *
 * @returns Circuit breaker metrics including state, failure count, etc.
 */
export declare function getSharedCircuitBreakerMetrics(): CircuitBreakerMetrics;
//# sourceMappingURL=shared-circuit-breaker.d.ts.map