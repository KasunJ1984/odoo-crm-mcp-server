export declare const CONTEXT_LIMITS: {
    readonly MAX_RESPONSE_CHARS: 8000;
    readonly DEFAULT_PAGE_SIZE: 10;
    readonly MAX_PAGE_SIZE: 50;
    readonly SUMMARY_THRESHOLD: 20;
    readonly MAX_FIELDS_DETAIL: 15;
    readonly MAX_FIELDS_LIST: 8;
};
export declare const EXPORT_CONFIG: {
    readonly DEFAULT_OUTPUT_DIR: "/mnt/user-data/outputs";
    readonly OUTPUT_DIR_ENV_VAR: "MCP_EXPORT_DIR";
    readonly MAX_SIZE_WARNING_BYTES: number;
    readonly MAX_SIZE_ENV_VAR: "MCP_EXPORT_MAX_SIZE_MB";
    readonly BATCH_SIZE: 500;
    readonly MAX_EXPORT_RECORDS: 10000;
    readonly DEFAULT_EXPORT_RECORDS: 1000;
};
export declare const CRM_FIELDS: {
    LEAD_LIST: string[];
    LEAD_LIST_EXTENDED: string[];
    LEAD_DETAIL: string[];
    PIPELINE_SUMMARY: string[];
    CONTACT_LIST: string[];
    ACTIVITY: string[];
    LOST_OPPORTUNITY_LIST: string[];
    LOST_OPPORTUNITY_DETAIL: string[];
    LOST_REASON: string[];
    WON_OPPORTUNITY_LIST: string[];
    WON_OPPORTUNITY_DETAIL: string[];
    ACTIVITY_DETAIL: string[];
    USER_LIST: string[];
    TEAM_LIST: string[];
    STATE_LIST: string[];
};
export declare enum ResponseFormat {
    JSON = "json",
    MARKDOWN = "markdown"
}
export declare const CIRCUIT_BREAKER_CONFIG: {
    readonly FAILURE_THRESHOLD: 5;
    readonly RESET_TIMEOUT_MS: 60000;
    readonly HALF_OPEN_MAX_ATTEMPTS: 1;
};
export declare const REDIS_CONFIG: {
    readonly CACHE_TYPE: "memory" | "redis";
    readonly REDIS_URL: string;
    readonly KEY_PREFIX: string;
};
export declare const POOL_CONFIG: {
    readonly MIN: number;
    readonly MAX: number;
    readonly ACQUIRE_TIMEOUT_MS: number;
    readonly IDLE_TIMEOUT_MS: number;
    readonly EVICTION_RUN_INTERVAL_MS: number;
    readonly TEST_ON_BORROW: boolean;
    readonly FIFO: true;
};
//# sourceMappingURL=constants.d.ts.map