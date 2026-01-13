/**
 * Memory Tools - Unified memory MCP tool
 *
 * Single tool with 5 actions for conversational memory management:
 * - start: Begin recording (auto-captures all tool interactions)
 * - save: End recording and save to vector database
 * - retrieve: Search/get messages from saved sessions
 * - list: Show all your saved sessions
 * - status: Health check and current recording status
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Register the unified memory tool with the MCP server.
 * Skips registration if memory features are disabled.
 */
export declare function registerMemoryTools(server: McpServer): void;
//# sourceMappingURL=memory-tools.d.ts.map