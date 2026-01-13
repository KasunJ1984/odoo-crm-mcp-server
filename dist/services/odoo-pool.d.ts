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
import { Pool } from 'generic-pool';
import { OdooClient } from './odoo-client.js';
/**
 * Pool metrics for monitoring and health checks
 */
export interface PoolMetrics {
    /** Current total number of clients (in use + available) */
    size: number;
    /** Number of clients ready to be acquired */
    available: number;
    /** Number of clients currently in use */
    borrowed: number;
    /** Number of requests waiting for a client */
    pending: number;
    /** Minimum pool size (from configuration) */
    min: number;
    /** Maximum pool size (from configuration) */
    max: number;
}
/**
 * Get or create the connection pool.
 * The pool is created on first call and reused thereafter (singleton).
 */
export declare function getPool(): Pool<OdooClient>;
/**
 * Acquire a client from the pool.
 *
 * IMPORTANT: You MUST call releaseClient() when done!
 * Better yet, use useClient() which handles this automatically.
 *
 * @returns A ready-to-use OdooClient
 * @throws Error if pool is exhausted and timeout expires
 */
export declare function acquireClient(): Promise<OdooClient>;
/**
 * Release a client back to the pool.
 * The client becomes available for other requests to use.
 *
 * @param client - The client to release (must have been acquired from pool)
 */
export declare function releaseClient(client: OdooClient): Promise<void>;
/**
 * Destroy a client (remove from pool permanently).
 * Use when a client is known to be in a bad state.
 *
 * @param client - The client to destroy
 */
export declare function destroyClient(client: OdooClient): Promise<void>;
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
export declare function useClient<T>(callback: (client: OdooClient) => Promise<T>): Promise<T>;
/**
 * Get pool metrics for monitoring and health checks.
 *
 * @returns Current pool statistics
 *
 * @example
 * const metrics = getPoolMetrics();
 * console.log(`Pool: ${metrics.borrowed}/${metrics.size} clients in use`);
 */
export declare function getPoolMetrics(): PoolMetrics;
/**
 * Drain and clear the pool.
 * Waits for all clients to be released, then destroys them.
 *
 * Use during:
 * - Server shutdown
 * - Configuration changes requiring reconnection
 * - Testing cleanup
 */
export declare function drainPool(): Promise<void>;
/**
 * Reset the pool (drain and allow recreation).
 * Also resets the shared circuit breaker.
 *
 * Use when you need a fresh start (e.g., after config changes).
 */
export declare function resetPool(): Promise<void>;
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
export declare function warmPool(): Promise<{
    success: number;
    failed: number;
}>;
//# sourceMappingURL=odoo-pool.d.ts.map