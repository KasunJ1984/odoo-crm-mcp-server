import xmlrpc from 'xmlrpc';
const { createClient, createSecureClient } = xmlrpc;
import { withTimeout, TIMEOUTS, TimeoutError } from '../utils/timeout.js';
import { EXPORT_CONFIG } from '../constants.js';
// Odoo XML-RPC API client with timeout protection
export class OdooClient {
    config;
    uid = null;
    commonClient;
    objectClient;
    constructor(config) {
        this.config = config;
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
    // Execute Odoo model method with timeout protection
    async execute(model, method, args = [], kwargs = {}) {
        const uid = await this.authenticate();
        try {
            return await withTimeout(this._doExecute(uid, model, method, args, kwargs), TIMEOUTS.API, `Odoo API call timed out (${model}.${method})`);
        }
        catch (error) {
            if (error instanceof TimeoutError) {
                console.error('API timeout:', error.message);
            }
            throw error;
        }
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
        return withTimeout(this._doExecute(uid, model, 'search_read', [domain], {
            fields,
            offset: options.offset,
            limit: options.limit,
            order: options.order,
        }), TIMEOUTS.EXPORT_BATCH, `Export batch timed out (offset: ${options.offset}, limit: ${options.limit})`);
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
//# sourceMappingURL=odoo-client.js.map