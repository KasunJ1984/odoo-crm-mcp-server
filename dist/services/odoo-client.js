import xmlrpc from 'xmlrpc';
const { createClient, createSecureClient } = xmlrpc;
import { withTimeout, TIMEOUTS, TimeoutError } from '../utils/timeout.js';
import { executeWithRetry } from '../utils/retry.js';
import { EXPORT_CONFIG, CIRCUIT_BREAKER_CONFIG } from '../constants.js';
import { cache, CACHE_TTL, CACHE_KEYS } from '../utils/cache.js';
import { CircuitBreaker } from '../utils/circuit-breaker.js';
// Odoo XML-RPC API client with timeout protection and circuit breaker
export class OdooClient {
    config;
    uid = null;
    commonClient;
    objectClient;
    circuitBreaker;
    /**
     * Create a new OdooClient instance
     * @param config - Odoo connection configuration (url, db, username, password)
     * @param circuitBreaker - Optional external circuit breaker to use.
     *                         If not provided, creates a new one.
     *                         Pass a shared breaker when using connection pooling.
     */
    constructor(config, circuitBreaker) {
        this.config = config;
        // Use provided circuit breaker or create a new one
        // Connection pooling uses a shared breaker for consistent behavior
        this.circuitBreaker = circuitBreaker || new CircuitBreaker(CIRCUIT_BREAKER_CONFIG.FAILURE_THRESHOLD, CIRCUIT_BREAKER_CONFIG.RESET_TIMEOUT_MS, CIRCUIT_BREAKER_CONFIG.HALF_OPEN_MAX_ATTEMPTS);
        // XML-RPC endpoints
        const commonUrl = new URL('/xmlrpc/2/common', config.url);
        const objectUrl = new URL('/xmlrpc/2/object', config.url);
        // Use secure client for HTTPS, regular client for HTTP
        const isSecure = config.url.startsWith('https');
        const clientFactory = isSecure ? createSecureClient : createClient;
        this.commonClient = clientFactory({
            host: commonUrl.hostname,
            port: isSecure ? 443 : (parseInt(commonUrl.port) || 80),
            path: commonUrl.pathname,
            headers: { 'Content-Type': 'text/xml' }
        });
        this.objectClient = clientFactory({
            host: objectUrl.hostname,
            port: isSecure ? 443 : (parseInt(objectUrl.port) || 80),
            path: objectUrl.pathname,
            headers: { 'Content-Type': 'text/xml' }
        });
    }
    // Authenticate and get user ID with timeout protection
    async authenticate() {
        if (this.uid !== null) {
            return this.uid;
        }
        try {
            const uid = await withTimeout(this._doAuthenticate(), TIMEOUTS.AUTH, 'Odoo authentication timed out');
            this.uid = uid;
            return uid;
        }
        catch (error) {
            if (error instanceof TimeoutError) {
                console.error('Authentication timeout:', error.message);
            }
            throw error;
        }
    }
    _doAuthenticate() {
        return new Promise((resolve, reject) => {
            this.commonClient.methodCall('authenticate', [this.config.db, this.config.username, this.config.password, {}], (error, value) => {
                if (error) {
                    const errMsg = error instanceof Error ? error.message : String(error);
                    reject(new Error(`Authentication failed: ${errMsg}`));
                }
                else if (value === false) {
                    reject(new Error('Authentication failed: Invalid credentials'));
                }
                else {
                    resolve(value);
                }
            });
        });
    }
    // Execute Odoo model method with timeout protection and circuit breaker
    async execute(model, method, args = [], kwargs = {}) {
        const uid = await this.authenticate();
        // Wrap with circuit breaker for graceful degradation
        return this.circuitBreaker.execute(async () => {
            try {
                return await withTimeout(executeWithRetry(() => this._doExecute(uid, model, method, args, kwargs)), TIMEOUTS.API, `Odoo API call timed out (${model}.${method})`);
            }
            catch (error) {
                if (error instanceof TimeoutError) {
                    console.error('API timeout:', error.message);
                }
                throw error;
            }
        });
    }
    _doExecute(uid, model, method, args, kwargs) {
        return new Promise((resolve, reject) => {
            this.objectClient.methodCall('execute_kw', [
                this.config.db,
                uid,
                this.config.password,
                model,
                method,
                args,
                kwargs
            ], (error, value) => {
                if (error) {
                    const errMsg = error instanceof Error ? error.message : String(error);
                    reject(new Error(`Odoo API error: ${errMsg}`));
                }
                else {
                    resolve(value);
                }
            });
        });
    }
    // Search and read records with pagination
    async searchRead(model, domain = [], fields = [], options = {}) {
        const { offset = 0, limit = 10, order = 'id desc' } = options;
        return this.execute(model, 'search_read', [domain], {
            fields,
            offset,
            limit,
            order
        });
    }
    // Count records matching domain
    async searchCount(model, domain = []) {
        return this.execute(model, 'search_count', [domain]);
    }
    // Read specific records by IDs
    async read(model, ids, fields = []) {
        return this.execute(model, 'read', [ids], { fields });
    }
    // Read grouped data for aggregation
    async readGroup(model, domain = [], fields = [], groupby = [], options = {}) {
        return this.execute(model, 'read_group', [domain, fields, groupby], {
            offset: options.offset,
            limit: options.limit,
            orderby: options.orderby,
            lazy: options.lazy ?? true
        });
    }
    // Get model fields metadata
    async fieldsGet(model, attributes = ['string', 'type', 'required']) {
        return this.execute(model, 'fields_get', [], { attributes });
    }
    /**
     * Fetch records in batches with progress tracking
     * Designed for large exports to avoid timeout issues
     */
    async searchReadPaginated(model, domain = [], fields = [], options) {
        const batchSize = options.batchSize || EXPORT_CONFIG.BATCH_SIZE;
        const startTime = Date.now();
        // First, count total available records
        const totalAvailable = await this.searchCount(model, domain);
        // Cap at maxRecords
        const recordsToFetch = Math.min(totalAvailable, options.maxRecords);
        const totalBatches = Math.ceil(recordsToFetch / batchSize);
        const allRecords = [];
        let offset = 0;
        let batchNumber = 0;
        while (allRecords.length < recordsToFetch) {
            batchNumber++;
            // Calculate limit for this batch
            const remaining = recordsToFetch - allRecords.length;
            const limit = Math.min(batchSize, remaining);
            // Fetch batch with extended timeout
            const batchRecords = await this.searchReadWithTimeout(model, domain, fields, { offset, limit, order: options.order || 'id desc' });
            allRecords.push(...batchRecords);
            offset += limit;
            // Report progress
            if (options.onProgress) {
                const elapsed = Date.now() - startTime;
                const avgTimePerBatch = elapsed / batchNumber;
                const remainingBatches = totalBatches - batchNumber;
                options.onProgress({
                    current_batch: batchNumber,
                    total_batches: totalBatches,
                    records_exported: allRecords.length,
                    total_records: recordsToFetch,
                    percent_complete: recordsToFetch > 0 ? Math.round((allRecords.length / recordsToFetch) * 100) : 0,
                    elapsed_ms: elapsed,
                });
            }
            // Break if we got fewer records than requested (end of data)
            if (batchRecords.length < limit) {
                break;
            }
        }
        return {
            records: allRecords,
            totalFetched: allRecords.length,
            totalAvailable,
        };
    }
    /**
     * Search and read with export batch timeout (longer than regular API timeout)
     */
    async searchReadWithTimeout(model, domain, fields, options) {
        const uid = await this.authenticate();
        return withTimeout(executeWithRetry(() => this._doExecute(uid, model, 'search_read', [domain], {
            fields,
            offset: options.offset,
            limit: options.limit,
            order: options.order,
        })), TIMEOUTS.EXPORT_BATCH, `Export batch timed out (offset: ${options.offset}, limit: ${options.limit})`);
    }
    // ============================================================================
    // CACHED METHODS - For frequently accessed, rarely-changing data
    // ============================================================================
    /**
     * Get CRM stages with caching (30 minute TTL)
     * Uses stale-while-revalidate: returns stale data while refreshing in background
     */
    async getStagesCached() {
        return cache.getWithRefresh(CACHE_KEYS.stages(), () => this.searchRead('crm.stage', [], ['id', 'name', 'sequence', 'is_won', 'fold'], { order: 'sequence asc', limit: 100 }), CACHE_TTL.STAGES);
    }
    /**
     * Get lost reasons with caching (30 minute TTL)
     * Uses stale-while-revalidate: returns stale data while refreshing in background
     */
    async getLostReasonsCached(includeInactive = false) {
        const cacheKey = CACHE_KEYS.lostReasons(includeInactive);
        const domain = includeInactive ? [] : [['active', '=', true]];
        return cache.getWithRefresh(cacheKey, () => this.searchRead('crm.lost.reason', domain, ['id', 'name', 'active'], { order: 'name asc', limit: 100 }), CACHE_TTL.LOST_REASONS);
    }
    /**
     * Get sales teams with caching (15 minute TTL)
     * Uses stale-while-revalidate: returns stale data while refreshing in background
     */
    async getTeamsCached() {
        return cache.getWithRefresh(CACHE_KEYS.teams(), () => this.searchRead('crm.team', [['active', '=', true]], ['id', 'name', 'active', 'member_ids'], { order: 'name asc', limit: 100 }), CACHE_TTL.TEAMS);
    }
    /**
     * Get salespeople with caching (15 minute TTL)
     * Uses stale-while-revalidate: returns stale data while refreshing in background
     */
    async getSalespeopleCached(teamId) {
        const cacheKey = CACHE_KEYS.salespeople(teamId);
        const domain = [['share', '=', false]];
        if (teamId) {
            domain.push(['sale_team_id', '=', teamId]);
        }
        return cache.getWithRefresh(cacheKey, () => this.searchRead('res.users', domain, ['id', 'name', 'email', 'login', 'active'], { order: 'name asc', limit: 200 }), CACHE_TTL.SALESPEOPLE);
    }
    /**
     * Get states/territories with caching (1 hour TTL)
     * Uses stale-while-revalidate: returns stale data while refreshing in background
     * @param countryCode - Country code to filter states (default: AU for Australia)
     */
    async getStatesCached(countryCode = 'AU') {
        const cacheKey = CACHE_KEYS.states(countryCode);
        return cache.getWithRefresh(cacheKey, () => this.searchRead('res.country.state', [['country_id.code', '=', countryCode]], ['id', 'name', 'code', 'country_id'], { order: 'name asc', limit: 100 }), CACHE_TTL.STATES);
    }
    /**
     * Invalidate specific cache entries or all cache
     * @param keys - Specific cache keys to invalidate, or undefined to clear all
     */
    async invalidateCache(keys) {
        if (keys) {
            await Promise.all(keys.map(key => cache.delete(key)));
        }
        else {
            await cache.clear();
        }
    }
    /**
     * Get cache statistics for monitoring
     */
    async getCacheStats() {
        const stats = await cache.stats();
        const metrics = cache.getMetrics();
        return {
            ...stats,
            metrics
        };
    }
    /**
     * Reset the cached UID to force a fresh authentication test.
     * Used by health check to verify current connectivity.
     */
    resetAuthCache() {
        this.uid = null;
    }
    // ============================================================================
    // CIRCUIT BREAKER - For graceful degradation when Odoo is unavailable
    // ============================================================================
    /**
     * Get current circuit breaker state
     * @returns 'CLOSED' (normal), 'OPEN' (failing fast), or 'HALF_OPEN' (testing)
     */
    getCircuitBreakerState() {
        return this.circuitBreaker.getState();
    }
    /**
     * Get circuit breaker metrics for monitoring
     */
    getCircuitBreakerMetrics() {
        return this.circuitBreaker.getMetrics();
    }
    /**
     * Manually reset circuit breaker to CLOSED state
     * Use after confirming Odoo is back online
     */
    resetCircuitBreaker() {
        this.circuitBreaker.reset();
    }
    /**
     * Pre-populate cache with frequently accessed data.
     * Called on startup to eliminate cold-start latency.
     */
    async warmCache() {
        const startTime = Date.now();
        const success = [];
        const failed = [];
        const results = await Promise.allSettled([
            this.getStagesCached(),
            this.getTeamsCached(),
            this.getLostReasonsCached(false),
            this.getStatesCached('AU')
        ]);
        const names = ['stages', 'teams', 'lost_reasons', 'states'];
        results.forEach((result, i) => {
            if (result.status === 'fulfilled') {
                success.push(`${names[i]}(${result.value.length})`);
            }
            else {
                failed.push(names[i]);
            }
        });
        const elapsed = Date.now() - startTime;
        console.error(`Cache warmup: ${success.length}/4 loaded in ${elapsed}ms`);
        if (success.length > 0)
            console.error(`  Loaded: ${success.join(', ')}`);
        if (failed.length > 0)
            console.error(`  Failed: ${failed.join(', ')}`);
        return { success, failed };
    }
}
// Singleton instance - created from environment variables
let clientInstance = null;
export function getOdooClient() {
    if (!clientInstance) {
        const config = {
            url: process.env.ODOO_URL || 'http://localhost:8069',
            db: process.env.ODOO_DB || 'odoo',
            username: process.env.ODOO_USERNAME || 'admin',
            password: process.env.ODOO_PASSWORD || 'admin'
        };
        // Validate configuration
        if (!config.url || !config.db || !config.username || !config.password) {
            throw new Error('Missing Odoo configuration. Set ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD environment variables.');
        }
        clientInstance = new OdooClient(config);
    }
    return clientInstance;
}
// Reset client (useful for testing or reconnection)
export function resetOdooClient() {
    clientInstance = null;
}
// Warm cache on startup (non-blocking, graceful failure handling)
export async function warmCache() {
    try {
        const client = getOdooClient();
        await client.warmCache();
    }
    catch (error) {
        console.error('Cache warmup failed:', error instanceof Error ? error.message : error);
    }
}
//# sourceMappingURL=odoo-client.js.map