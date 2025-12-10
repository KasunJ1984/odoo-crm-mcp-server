# Odoo CRM MCP Server - Improvement Roadmap

> Deep Research Analysis conducted: 2025-12-10
> Focus: Functionality, Scalability, Efficiency (over Security)
> Current Overall Score: **8.2/10**

---

## Current State Summary

| Dimension | Score | Notes |
|-----------|-------|-------|
| API Call Efficiency | 9/10 | `search_read`, `read_group`, field selection |
| Context Window Efficiency | 10/10 | Pagination, response limits, dual formats |
| Memory Efficiency | 7/10 | Good, but no LRU/max size limits |
| Network Efficiency | 7/10 | Good batching, no parallel requests |
| Cache Efficiency | 8/10 | Appropriate TTLs, lazy expiration |

---

## Phase 1: High Impact, Low Effort

Estimated total: ~6 hours | Test after each item

### [x] 1.1 Add Cache Hit/Miss Metrics
**Impact:** Monitor and optimize cache performance
**Effort:** ~1 hour
**File:** `src/utils/cache.ts`

```typescript
// Add to MemoryCache class:
private hits = 0;
private misses = 0;

// Update get() method to track hits/misses
// Add getMetrics() method returning { hits, misses, hitRate }
```

**Testing:** Call cached methods multiple times, verify metrics in `odoo_crm_cache_status`

---

### [x] 1.2 Add Health Check Tool
**Impact:** Debugging, monitoring, verify Odoo connectivity
**Effort:** ~2 hours
**Files:** `src/schemas/index.ts`, `src/tools/crm-tools.ts`

```typescript
// New tool: odoo_crm_health_check
// Returns: { status, odoo_connected, latency_ms, cache_entries, cache_hit_rate }
```

**Testing:** Call tool when Odoo is up/down, verify correct status

---

### [x] 1.3 Implement Retry Logic with Exponential Backoff
**Impact:** Resilience against transient Odoo failures
**Effort:** ~2 hours
**File:** `src/services/odoo-client.ts`

```typescript
// Add executeWithRetry<T>(fn, maxRetries=3) method
// Retry on 5xx errors with exponential backoff: 1s, 2s, 4s
// Don't retry on 4xx (client errors)
```

**Testing:** Simulate network issues, verify retries in logs

---

### [x] 1.4 Parallel Cache Warming on Startup
**Impact:** Faster first requests after server start
**Effort:** ~1 hour
**File:** `src/services/odoo-client.ts`

```typescript
// Add warmCache() method:
async warmCache(): Promise<void> {
  await Promise.all([
    this.getStagesCached(),
    this.getTeamsCached(),
    this.getLostReasonsCached(false)
  ]);
}

// Call in index.ts after server starts
```

**Testing:** Restart server, verify cache populated before first request

---

## Phase 2: Medium Impact, Medium Effort

Estimated total: ~11 hours | Test after each item

### [x] 2.1 Stale-While-Revalidate Pattern
**Impact:** Zero-latency cache hits even when refreshing
**Effort:** ~4 hours
**File:** `src/utils/cache.ts`

```typescript
// Add getWithRefresh<T>(key, refreshFn, ttlMs, refreshThreshold) method
// If entry exists but close to expiry (80% of TTL), return stale data
// AND trigger background refresh
```

**Testing:** Set short TTL, verify data returned immediately while refresh happens

---

### [x] 2.2 Add LRU Eviction with Max Size
**Impact:** Bounded memory usage, prevents unbounded growth
**Effort:** ~3 hours
**Options:**
- A) Replace with `lru-cache` package (simpler)
- B) Implement LRU in current MemoryCache (no dependencies)

```typescript
// Option A: npm install lru-cache
import { LRUCache } from 'lru-cache';
const cache = new LRUCache({ max: 500, ttl: 1000 * 60 * 30 });
```

**Testing:** Fill cache beyond max, verify oldest entries evicted

---

### [x] 2.3 Circuit Breaker Pattern
**Impact:** Graceful degradation when Odoo is down
**Effort:** ~4 hours
**Files:** `src/utils/circuit-breaker.ts` (new), `src/services/odoo-client.ts`, `src/constants.ts`

```typescript
// States: CLOSED (normal), OPEN (failing fast), HALF_OPEN (testing)
// After 5 failures, open circuit for 60 seconds
// Fail fast with CircuitBreakerError when open
// Health check tool shows circuit breaker state
```

**Testing:** Take Odoo offline, verify fast failures and recovery

---

## Phase 3: Scale-Dependent (Implement When Needed)

### [ ] 3.1 Redis Cache for Multi-Instance
**When:** Deploying multiple server instances
**Effort:** ~8 hours
**Dependencies:** `ioredis` package

```typescript
// Replace MemoryCache with Redis-backed cache
// Enables shared cache across instances
// Add REDIS_URL environment variable
```

---

### [ ] 3.2 Connection Pooling
**When:** High concurrency (50+ simultaneous users)
**Effort:** ~4 hours
**Dependencies:** `generic-pool` package

```typescript
// Create pool of OdooClient instances
// Acquire/release from pool per request
// Config: { max: 10, min: 2 }
```

---

### [ ] 3.3 Tool Output Schemas (MCP June 2025 Spec)
**When:** MCP clients support output schemas
**Effort:** ~6 hours
**Reference:** https://auth0.com/blog/mcp-specs-update-all-about-auth/

```typescript
// Add outputSchema to each tool registration
// Enables more efficient context window usage
```

---

## Research Sources

- [MCP Best Practices Guide](https://modelcontextprotocol.info/docs/best-practices/)
- [MCP Server Best Practices 2025](https://www.marktechpost.com/2025/07/23/7-mcp-server-best-practices-for-scalable-ai-integrations-in-2025/)
- [Node.js Caching Best Practices](https://medium.com/@akhanriz/caching-in-node-js-best-practices-for-optimization-and-maximum-performance-58ac50174c93)
- [Node.js Caching Libraries Comparison](https://npm-compare.com/@isaacs/ttlcache,lru-cache,memory-cache,node-cache)
- [Odoo XML-RPC vs REST API 2025](https://arsalanyasin.com.au/odoo-rest-api-vs-xmlrpc-integration-2025/)
- [MCP Spec Updates June 2025](https://auth0.com/blog/mcp-specs-update-all-about-auth/)
- [Odoo Web Service API](https://www.odoo.com/documentation/saas-13/api_integration.html)

---

## Progress Log

| Date | Item | Status | Commit | Notes |
|------|------|--------|--------|-------|
| 2025-12-10 | Initial caching | Done | da12a75 | Stages, lost reasons, teams cached |
| 2025-12-10 | 1.1 Cache Hit/Miss Metrics | Done | bfbeffb | Added hits/misses counters, getMetrics(), updated cache_status tool |
| 2025-12-10 | 1.2 Health Check Tool | Done | 4d54129 | New odoo_crm_health_check tool with latency, cache stats |
| 2025-12-10 | 1.3 Retry Logic | Done | 5d29eb5 | executeWithRetry with exponential backoff (1s, 2s, 4s) |
| 2025-12-10 | 1.4 Cache Warming | Done | f32c83e | warmCache() preloads stages, teams, lost_reasons on startup |
| 2025-12-10 | 2.1 Stale-While-Revalidate | Done | 50a99af | getWithRefresh() returns stale data while refreshing in background |
| 2025-12-10 | 2.2 LRU Eviction | Done | a2a18ba | lru-cache package with max 500 entries, auto-eviction |
| 2025-12-11 | 2.3 Circuit Breaker | Done | be1fe0a | CircuitBreaker class with CLOSED/OPEN/HALF_OPEN states |

---

## How to Use This Document

1. Pick one item from the current phase
2. Implement following the code hints
3. Test thoroughly
4. Update the checkbox: `[ ]` → `[x]`
5. Add entry to Progress Log with commit hash
6. Commit this file with your changes
7. Move to next item

**Rule:** Never implement multiple items without testing between them.
