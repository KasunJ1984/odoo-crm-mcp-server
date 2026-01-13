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
import { MemorySchema } from '../schemas/index.js';
import { MEMORY_CONFIG, ResponseFormat } from '../constants.js';
import { startSession, saveSession, getActiveSession, isMemoryRecording, retrieveSession, cancelSession, } from '../services/memory-service.js';
import { memoryHealthCheck, searchMemory, getSessionList, } from '../services/memory-client.js';
import { embed } from '../services/embedding-service.js';
import { formatMemorySession, formatMemorySearch, formatSessionList, formatMemoryStatus, } from '../services/formatters.js';
// ============================================
// TOOL REGISTRATION
// ============================================
/**
 * Register the unified memory tool with the MCP server.
 * Skips registration if memory features are disabled.
 */
export function registerMemoryTools(server) {
    if (!MEMORY_CONFIG.ENABLED) {
        console.error('[MemoryTools] Memory features disabled - skipping registration');
        return;
    }
    server.tool('memory', `Manage conversational memory - record, save, and retrieve conversations.

Actions:
- start: Begin recording (auto-captures all tool interactions)
- save: End recording and save to vector database
- retrieve: Search/get messages from saved sessions (use session_id or query)
- list: Show all your saved sessions
- status: Health check and current recording status

When recording is active, ALL tool calls are automatically captured.

Examples:
- memory action:start description:"CRM analysis session"
- memory action:save
- memory action:retrieve session_id:20241215_103045
- memory action:retrieve query:"lost opportunities in education"
- memory action:list
- memory action:status`, MemorySchema.shape, async (args) => {
        try {
            const input = MemorySchema.parse(args);
            const userId = 'default_user'; // TODO: Get from auth context when multi-user
            switch (input.action) {
                case 'start':
                    return handleStart(userId, input);
                case 'save':
                    return handleSave(input);
                case 'retrieve':
                    return handleRetrieve(userId, input);
                case 'list':
                    return handleList(userId, input);
                case 'status':
                    return handleStatus(input);
                default:
                    return {
                        isError: true,
                        content: [{ type: 'text', text: `Unknown action: ${input.action}` }],
                    };
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('[MemoryTools] Error:', message);
            return {
                isError: true,
                content: [{ type: 'text', text: `Memory error: ${message}` }],
            };
        }
    });
    console.error('[MemoryTools] Registered memory tool with 5 actions');
}
// ============================================
// ACTION HANDLERS
// ============================================
/**
 * Handle start action - begin recording session.
 */
async function handleStart(userId, input) {
    // Check if already recording
    if (isMemoryRecording()) {
        const active = getActiveSession();
        return {
            isError: true,
            content: [{
                    type: 'text',
                    text: `Recording already active!\n\n**Session:** ${active?.sessionId}\n**Messages:** ${active?.messages.length}\n\nUse \`memory action:save\` to save or \`memory action:status\` to check.`,
                }],
        };
    }
    const session = startSession(userId, {
        description: input.description,
        tags: input.tags,
    });
    const output = `## Memory Recording Started

**Session ID:** ${session.sessionId}
**Prefix:** ${session.sessionPrefix}
**Started:** ${session.startTime.toISOString()}
${session.description ? `**Description:** ${session.description}` : ''}
${session.tags?.length ? `**Tags:** ${session.tags.join(', ')}` : ''}

Recording is now **active**. All tool interactions will be automatically captured.

### To Save
Use \`memory action:save\` when you're done.

### To Check Status
Use \`memory action:status\` to see captured messages.`;
    return {
        content: [{ type: 'text', text: output }],
    };
}
/**
 * Handle save action - end recording and save to Qdrant.
 */
async function handleSave(input) {
    if (!isMemoryRecording()) {
        return {
            isError: true,
            content: [{
                    type: 'text',
                    text: 'No active recording to save.\n\nUse `memory action:start` to begin recording first.',
                }],
        };
    }
    const active = getActiveSession();
    if (active && active.messages.length === 0) {
        // Cancel empty session instead of failing
        cancelSession();
        return {
            content: [{
                    type: 'text',
                    text: `Session ${active.sessionId} had no messages to save. Session cancelled.`,
                }],
        };
    }
    const result = await saveSession({ generateSummary: true });
    const output = `## Memory Session Saved

**Session ID:** ${result.sessionId}
**Messages:** ${result.messageCount}
**Saved:** ${result.savedAt}

Your conversation has been saved to the vector database.

### To Retrieve Later
- By session: \`memory action:retrieve session_id:${result.sessionId}\`
- By search: \`memory action:retrieve query:"your search terms"\`

### To List All Sessions
\`memory action:list\``;
    return {
        content: [{ type: 'text', text: output }],
    };
}
/**
 * Handle retrieve action - get session or search.
 */
async function handleRetrieve(userId, input) {
    const format = input.response_format || ResponseFormat.MARKDOWN;
    // Option 1: Retrieve specific session by ID
    if (input.session_id) {
        const messages = await retrieveSession(input.session_id, userId);
        if (messages.length === 0) {
            return {
                content: [{
                        type: 'text',
                        text: `No messages found for session: ${input.session_id}\n\nCheck the session ID or use \`memory action:list\` to see available sessions.`,
                    }],
            };
        }
        const output = formatMemorySession(messages, format);
        return { content: [{ type: 'text', text: output }] };
    }
    // Option 2: Semantic search across all sessions
    if (input.query) {
        const queryVector = await embed(input.query, 'query');
        const results = await searchMemory({
            vector: queryVector,
            userId,
            limit: input.limit,
        });
        const output = formatMemorySearch(results, input.query, format);
        return { content: [{ type: 'text', text: output }] };
    }
    // Neither provided
    return {
        isError: true,
        content: [{
                type: 'text',
                text: 'Please provide either:\n- `session_id` to retrieve a specific session\n- `query` to search across all sessions\n\nExample: `memory action:retrieve query:"lost opportunities"`',
            }],
    };
}
/**
 * Handle list action - show saved sessions.
 */
async function handleList(userId, input) {
    const format = input.response_format || ResponseFormat.MARKDOWN;
    const sessions = await getSessionList(userId, 'saved', input.limit);
    const output = formatSessionList(sessions, format);
    return { content: [{ type: 'text', text: output }] };
}
/**
 * Handle status action - health check and recording status.
 */
async function handleStatus(input) {
    const format = input.response_format || ResponseFormat.MARKDOWN;
    const health = await memoryHealthCheck();
    const output = formatMemoryStatus(health, format);
    return { content: [{ type: 'text', text: output }] };
}
//# sourceMappingURL=memory-tools.js.map