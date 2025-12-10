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
export enum CircuitState {
  CLOSED = 'CLOSED',       // Normal operation
  OPEN = 'OPEN',           // Failing fast (Odoo is down)
  HALF_OPEN = 'HALF_OPEN'  // Testing if Odoo is back
}

/**
 * Error thrown when circuit is OPEN (failing fast)
 */
export class CircuitBreakerError extends Error {
  public readonly secondsUntilRetry: number;

  constructor(message: string, secondsUntilRetry: number = 0) {
    super(message);
    this.name = 'CircuitBreakerError';
    this.secondsUntilRetry = secondsUntilRetry;
  }
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
  secondsUntilHalfOpen: number | null;  // Only when OPEN
}

/**
 * Circuit Breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number | null = null;
  private lastStateChange: number | null = null;
  private halfOpenAttempts: number = 0;

  /**
   * Create a new Circuit Breaker
   * @param failureThreshold - Number of failures before opening circuit (default: 5)
   * @param resetTimeoutMs - Time to wait before testing recovery (default: 60000ms)
   * @param halfOpenMaxAttempts - Test requests allowed in HALF_OPEN (default: 1)
   */
  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeoutMs: number = 60000,
    private readonly halfOpenMaxAttempts: number = 1
  ) {}

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get metrics for monitoring and debugging
   */
  getMetrics(): CircuitBreakerMetrics {
    let secondsUntilHalfOpen: number | null = null;

    if (this.state === CircuitState.OPEN && this.lastFailureTime !== null) {
      const elapsed = Date.now() - this.lastFailureTime;
      const remaining = this.resetTimeoutMs - elapsed;
      secondsUntilHalfOpen = remaining > 0 ? Math.ceil(remaining / 1000) : 0;
    }

    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
      secondsUntilHalfOpen
    };
  }

  /**
   * Execute a function with circuit breaker protection
   *
   * @param fn - The async function to execute (e.g., Odoo API call)
   * @returns The result of fn if successful
   * @throws CircuitBreakerError if circuit is OPEN
   * @throws Original error from fn if it fails
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if we should transition from OPEN to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      if (this.shouldTransitionToHalfOpen()) {
        this.transitionTo(CircuitState.HALF_OPEN);
        this.halfOpenAttempts = 0;
      } else {
        // Still OPEN - fail fast
        const secondsUntilRetry = this.getSecondsUntilHalfOpen();
        throw new CircuitBreakerError(
          `Odoo service temporarily unavailable. Connection will be retried in ${secondsUntilRetry} seconds.`,
          secondsUntilRetry
        );
      }
    }

    // HALF_OPEN: Check if we've exceeded test attempts
    if (this.state === CircuitState.HALF_OPEN) {
      if (this.halfOpenAttempts >= this.halfOpenMaxAttempts) {
        // Already testing, fail fast for other requests
        throw new CircuitBreakerError(
          'Odoo service recovery test in progress. Please wait.',
          5  // Short wait during test
        );
      }
      this.halfOpenAttempts++;
    }

    // CLOSED or HALF_OPEN (with available attempts): Execute the function
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Manually reset the circuit breaker to CLOSED state
   * Useful for health check recovery or admin intervention
   */
  reset(): void {
    console.error(`[CircuitBreaker] Manual reset from ${this.state} to CLOSED`);
    this.transitionTo(CircuitState.CLOSED);
    this.failureCount = 0;
    this.halfOpenAttempts = 0;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    this.successCount++;

    if (this.state === CircuitState.HALF_OPEN) {
      // Recovery confirmed! Close the circuit
      console.error('[CircuitBreaker] Recovery successful! Closing circuit.');
      this.transitionTo(CircuitState.CLOSED);
      this.failureCount = 0;
      this.halfOpenAttempts = 0;
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in normal operation
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed request
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Recovery test failed - reopen circuit
      console.error('[CircuitBreaker] Recovery test failed. Reopening circuit.');
      this.transitionTo(CircuitState.OPEN);
      this.halfOpenAttempts = 0;
    } else if (this.state === CircuitState.CLOSED) {
      // Check if we've hit the failure threshold
      if (this.failureCount >= this.failureThreshold) {
        console.error(
          `[CircuitBreaker] Failure threshold reached (${this.failureCount}/${this.failureThreshold}). Opening circuit.`
        );
        this.transitionTo(CircuitState.OPEN);
      } else {
        console.error(
          `[CircuitBreaker] Failure ${this.failureCount}/${this.failureThreshold}`
        );
      }
    }
  }

  /**
   * Check if enough time has passed to transition from OPEN to HALF_OPEN
   */
  private shouldTransitionToHalfOpen(): boolean {
    if (this.lastFailureTime === null) return true;
    const elapsed = Date.now() - this.lastFailureTime;
    return elapsed >= this.resetTimeoutMs;
  }

  /**
   * Calculate seconds until HALF_OPEN transition
   */
  private getSecondsUntilHalfOpen(): number {
    if (this.lastFailureTime === null) return 0;
    const elapsed = Date.now() - this.lastFailureTime;
    const remaining = this.resetTimeoutMs - elapsed;
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  /**
   * Transition to a new state with logging
   */
  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      console.error(`[CircuitBreaker] State: ${this.state} → ${newState}`);
      this.state = newState;
      this.lastStateChange = Date.now();
    }
  }
}
