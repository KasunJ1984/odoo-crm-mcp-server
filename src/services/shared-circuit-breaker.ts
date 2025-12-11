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
import { CIRCUIT_BREAKER_CONFIG } from '../constants.js';

// Singleton shared circuit breaker instance
let sharedBreaker: CircuitBreaker | null = null;

/**
 * Get the shared circuit breaker instance.
 * Creates one if it doesn't exist (singleton pattern).
 *
 * @returns The shared CircuitBreaker instance
 */
export function getSharedCircuitBreaker(): CircuitBreaker {
  if (!sharedBreaker) {
    sharedBreaker = new CircuitBreaker(
      CIRCUIT_BREAKER_CONFIG.FAILURE_THRESHOLD,
      CIRCUIT_BREAKER_CONFIG.RESET_TIMEOUT_MS,
      CIRCUIT_BREAKER_CONFIG.HALF_OPEN_MAX_ATTEMPTS
    );
    console.error('[SharedCircuitBreaker] Created shared circuit breaker instance');
  }
  return sharedBreaker;
}

/**
 * Reset the shared circuit breaker to CLOSED state.
 * Useful for:
 * - Manual recovery after Odoo comes back online
 * - Testing and development
 * - Admin intervention
 */
export function resetSharedCircuitBreaker(): void {
  if (sharedBreaker) {
    sharedBreaker.reset();
    console.error('[SharedCircuitBreaker] Reset to CLOSED state');
  }
}

/**
 * Get the current state of the shared circuit breaker.
 * Shortcut for getSharedCircuitBreaker().getState()
 *
 * @returns Current circuit state (CLOSED, OPEN, or HALF_OPEN)
 */
export function getSharedCircuitBreakerState(): CircuitState {
  return getSharedCircuitBreaker().getState();
}

/**
 * Get metrics from the shared circuit breaker.
 * Shortcut for getSharedCircuitBreaker().getMetrics()
 *
 * @returns Circuit breaker metrics including state, failure count, etc.
 */
export function getSharedCircuitBreakerMetrics(): CircuitBreakerMetrics {
  return getSharedCircuitBreaker().getMetrics();
}
