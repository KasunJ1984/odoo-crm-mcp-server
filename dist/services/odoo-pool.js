/**
 * Connection Pool Manager for OdooClient instances
 *
 * What is Connection Pooling?
 * ---------------------------
 * Think of it like a taxi stand at an airport:
 * - Instead of calling a new taxi for each passenger (creating new client each time),
 *   there's a pool of taxis waiting (pool of pre-created clients)
 * - When you need a ride (API call), you get an available taxi (acquire client)
 * - When done, the taxi returns to the stand (release client back to pool)
 * - This is MUCH faster than waiting for a new taxi each time!
 *
 * Why We Need It:
 * - Creating OdooClient is expensive (TCP connection setup, authentication)
 * - With 50+ concurrent users, creating clients on-demand causes delays
 * - Pool keeps clients ready and pre-authenticated
 * - Better resource management (maximum clients = maximum concurrent Odoo connections)
 *
 * How to Use:
 * -----------
 * RECOMMENDED: Use useClient() for automatic acquire/release
 *
 *   const leads = await useClient(async (client) => {
 *     return client.searchRead<CrmLead>('crm.lead', [], ['name']);
 *   });
 *
 * MANUAL: Acquire and release yourself (use try-finally!)
 *
 *   const client = await acquireClient();
 *   try {
 *     const leads = await client.searchRead(...);
 *   } finally {
 *     await releaseClient(client);  // ALWAYS release!
 *   }
 */
import { createPool } from 'generic-pool';
import { OdooClient } from './odoo-client.js';
import { getSharedCircuitBreaker, getSharedCircuitBreakerState } from './shared-circuit-breaker.js';
import { POOL_CONFIG } from '../constants.js';
// ============================================================================
// POOL SINGLETON
// ============================================================================
// The pool instance (created on first use)
let pool = null;
/**
 * Get Odoo configuration from environment variables.
 * This is the same config used by the singleton client.
 */
function getOdooConfig() {
    const config = {
        url: process.env.ODOO_URL || 'http://localhost:8069',
        db: process.env.ODOO_DB || 'odoo',
        username: process.env.ODOO_USERNAME || 'admin',
        password: process.env.ODOO_PASSWORD || 'admin'
    };
    if (!config.url || !config.db || !config.username || !config.password) {
        throw new Error('Missing Odoo configuration. Set ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD environment variables.');
    }
    return config;
}
/**
 * Factory for creating, validating, and destroying OdooClient instances.
 * This tells the pool HOW to manage clients.
 */
function createClientFactory(config) {
    // Get the shared circuit breaker (all pooled clients use the same one)
    const sharedBreaker = getSharedCircuitBreaker();
    return {
        /**
         * Called when pool needs a NEW client.
         * Creates and authenticates the client before adding to pool.
         */
        create: async () => {
            console.error('[Pool] Creating new OdooClient...');
            // Create client with SHARED circuit breaker
            const client = new OdooClient(config, sharedBreaker);
            // Pre-authenticate so the client is ready to use immediately
            try {
                await client.authenticate();
                console.error('[Pool] OdooClient created and authenticated');
            }
            catch (error) {
                console.error('[Pool] OdooClient authentication failed:', error instanceof Error ? error.message : error);
                throw error; // Pool will retry or fail acquisition
            }
            return client;
        },
        /**
         * Called when pool wants to DESTROY a client (eviction, shutdown).
         * Cleanup any resources held by the client.
         */
        destroy: async (client) => {
            console.error('[Pool] Destroying OdooClient');
            // Reset auth cache (XML-RPC is stateless, no connection to close)
            client.resetAuthCache();
        },
        /**
         * Called before returning a client from the pool (if testOnBorrow is true).
         * Returns true if client is healthy, false if it should be destroyed.
         */
        validate: async (_client) => {
            // Check if circuit breaker is open (Odoo is known to be down)
            const cbState = getSharedCircuitBreakerState();
            if (cbState === 'OPEN') {
                console.error('[Pool] Validation failed: Circuit breaker is OPEN');
                return false; // Don't give out clients when Odoo is down
            }
            // Client is healthy
            return true;
        }
    };
}
/**
 * Get or create the connection pool.
 * The pool is created on first call and reused thereafter (singleton).
 */
export function getPool() {
    if (!pool) {
        const config = getOdooConfig();
        const factory = createClientFactory(config);
        const poolOptions = {
            min: POOL_CONFIG.MIN,
            max: POOL_CONFIG.MAX,
            acquireTimeoutMillis: POOL_CONFIG.ACQUIRE_TIMEOUT_MS,
            idleTimeoutMillis: POOL_CONFIG.IDLE_TIMEOUT_MS,
            evictionRunIntervalMillis: POOL_CONFIG.EVICTION_RUN_INTERVAL_MS,
            testOnBorrow: POOL_CONFIG.TEST_ON_BORROW,
            fifo: POOL_CONFIG.FIFO,
        };
        pool = createPool(factory, poolOptions);
        console.error(`[Pool] Initialized (min=${POOL_CONFIG.MIN}, max=${POOL_CONFIG.MAX})`);
        // Log pool errors
        pool.on('factoryCreateError', (err) => {
            console.error('[Pool] Factory create error:', err instanceof Error ? err.message : err);
        });
        pool.on('factoryDestroyError', (err) => {
            console.error('[Pool] Factory destroy error:', err instanceof Error ? err.message : err);
        });
    }
    return pool;
}
// ============================================================================
// PUBLIC API - Main functions for using the pool
// ============================================================================
/**
 * Acquire a client from the pool.
 *
 * IMPORTANT: You MUST call releaseClient() when done!
 * Better yet, use useClient() which handles this automatically.
 *
 * @returns A ready-to-use OdooClient
 * @throws Error if pool is exhausted and timeout expires
 */
export async function acquireClient() {
    const p = getPool();
    return p.acquire();
}
/**
 * Release a client back to the pool.
 * The client becomes available for other requests to use.
 *
 * @param client - The client to release (must have been acquired from pool)
 */
export async function releaseClient(client) {
    const p = getPool();
    await p.release(client);
}
/**
 * Destroy a client (remove from pool permanently).
 * Use when a client is known to be in a bad state.
 *
 * @param client - The client to destroy
 */
export async function destroyClient(client) {
    const p = getPool();
    await p.destroy(client);
}
/**
 * Use a client with automatic acquire/release.
 *
 * This is the RECOMMENDED way to use pooled clients!
 * It ensures the client is ALWAYS released, even if an error occurs.
 *
 * @param callback - Function to execute with the client
 * @returns Whatever the callback returns
 *
 * @example
 * // Simple usage - client is automatically acquired and released
 * const leads = await useClient(async (client) => {
 *   return client.searchRead<CrmLead>('crm.lead', [], ['name', 'email_from']);
 * });
 *
 * @example
 * // Multiple operations with same client
 * const { leads, count } = await useClient(async (client) => {
 *   const leads = await client.searchRead<CrmLead>('crm.lead', [], ['name']);
 *   const count = await client.searchCount('crm.lead', []);
 *   return { leads, count };
 * });
 */
export async function useClient(callback) {
    const client = await acquireClient();
    try {
        return await callback(client);
    }
    finally {
        await releaseClient(client);
    }
}
// ============================================================================
// MONITORING & MANAGEMENT
// ============================================================================
/**
 * Get pool metrics for monitoring and health checks.
 *
 * @returns Current pool statistics
 *
 * @example
 * const metrics = getPoolMetrics();
 * console.log(`Pool: ${metrics.borrowed}/${metrics.size} clients in use`);
 */
export function getPoolMetrics() {
    const p = getPool();
    return {
        size: p.size,
        available: p.available,
        borrowed: p.borrowed,
        pending: p.pending,
        min: p.min,
        max: p.max,
    };
}
/**
 * Drain and clear the pool.
 * Waits for all clients to be released, then destroys them.
 *
 * Use during:
 * - Server shutdown
 * - Configuration changes requiring reconnection
 * - Testing cleanup
 */
export async function drainPool() {
    if (pool) {
        console.error('[Pool] Draining pool...');
        await pool.drain();
        await pool.clear();
        pool = null;
        console.error('[Pool] Pool drained and cleared');
    }
}
/**
 * Reset the pool (drain and allow recreation).
 * Also resets the shared circuit breaker.
 *
 * Use when you need a fresh start (e.g., after config changes).
 */
export async function resetPool() {
    await drainPool();
    // Pool will be recreated on next getPool() call
}
/**
 * Warm the pool by pre-creating minimum clients.
 * Called on server startup for faster first requests.
 *
 * NOTE: This is now completely non-blocking and won't crash on failures.
 * If Odoo is unavailable, the server will still start and retry on first request.
 *
 * @returns Success/failure counts for monitoring
 *
 * @example
 * // In server startup
 * const result = await warmPool();
 * console.log(`Pool warmed: ${result.success} clients ready`);
 */
export async function warmPool() {
    console.error('[Pool] Warming pool...');
    const startTime = Date.now();
    let success = 0;
    let failed = 0;
    try {
        // Acquire and release MIN clients to trigger creation
        const promises = [];
        for (let i = 0; i < POOL_CONFIG.MIN; i++) {
            promises.push(acquireClient()
                .then(async (client) => {
                await releaseClient(client);
                success++;
            })
                .catch((err) => {
                console.error(`[Pool] Warm-up client ${i + 1} failed:`, err instanceof Error ? err.message : err);
                failed++;
            }));
        }
        await Promise.all(promises);
    }
    catch (err) {
        // Catch any unexpected errors during warmup
        console.error('[Pool] Warm-up encountered error (non-fatal):', err instanceof Error ? err.message : err);
        failed = POOL_CONFIG.MIN;
    }
    const elapsed = Date.now() - startTime;
    console.error(`[Pool] Warm-up complete: ${success} ready, ${failed} failed (${elapsed}ms)`);
    return { success, failed };
}
//# sourceMappingURL=odoo-pool.js.map