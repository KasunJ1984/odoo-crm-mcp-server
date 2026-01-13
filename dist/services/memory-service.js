/**
 * Memory Service - Session state management and auto-capture
 *
 * Manages active recording sessions and provides capture functions
 * that other tools call automatically.
 *
 * Key Features:
 * - Session lifecycle management (start, save, cancel)
 * - Auto-capture of tool interactions when recording
 * - Batch embedding generation on save
 * - Multi-user session isolation
 */
import { v4 as uuidv4 } from 'uuid';
import { embedBatch } from './embedding-service.js';
import { upsertMemoryPoints, scrollMemoryBySession } from './memory-client.js';
// ============================================
// SESSION STATE
// ============================================
let activeSession = null;
// ============================================
// SESSION MANAGEMENT
// ============================================
/**
 * Generate a session ID in YYYYMMDD_HHMMSS format.
 * This format is human-readable and sortable.
 */
export function generateSessionId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hour}${minute}${second}`;
}
/**
 * Start a new recording session.
 * Only one session can be active at a time per server instance.
 *
 * @param userId - User identifier for isolation
 * @param options - Optional description and tags
 * @returns The newly created session
 * @throws Error if a session is already active
 */
export function startSession(userId, options) {
    if (activeSession) {
        throw new Error(`Session already active: ${activeSession.sessionId}. Save or cancel it first.`);
    }
    const sessionId = generateSessionId();
    const sessionPrefix = `memory_${sessionId}`;
    activeSession = {
        sessionId,
        sessionPrefix,
        userId,
        description: options?.description,
        tags: options?.tags,
        status: 'recording',
        startTime: new Date(),
        messages: [],
    };
    console.error(`[MemoryService] Session started: ${sessionId}`);
    return activeSession;
}
/**
 * Get the currently active session.
 * Returns null if no session is recording.
 */
export function getActiveSession() {
    return activeSession;
}
/**
 * Check if memory recording is currently active.
 * Used by other tools to decide whether to capture interactions.
 */
export function isMemoryRecording() {
    return activeSession !== null;
}
// ============================================
// AUTO-CAPTURE (Called by other tools)
// ============================================
/**
 * Capture a tool interaction during active recording.
 * This function is called automatically by CRM and vector tools.
 *
 * @param toolName - Name of the tool that was called
 * @param input - The tool's input arguments
 * @param output - The tool's output text
 */
export function captureInteraction(toolName, input, output) {
    if (!activeSession) {
        return; // Not recording, silently skip
    }
    const timestamp = new Date();
    // Capture user input (the tool call)
    activeSession.messages.push({
        role: 'user',
        content: `[Tool: ${toolName}]\n${JSON.stringify(input, null, 2)}`,
        toolName,
        toolInput: input,
        timestamp,
    });
    // Capture assistant output (the response)
    activeSession.messages.push({
        role: 'assistant',
        content: output,
        toolName,
        timestamp: new Date(),
    });
    console.error(`[MemoryService] Captured: ${toolName} (${activeSession.messages.length} messages)`);
}
// ============================================
// SAVE SESSION
// ============================================
/**
 * Save the active session to Qdrant.
 * Generates embeddings for all messages and stores them.
 *
 * @param options - Optional settings (future: summary generation)
 * @returns Session save result with message count
 * @throws Error if no active session or empty session
 */
export async function saveSession(options) {
    if (!activeSession) {
        throw new Error('No active session to save');
    }
    if (activeSession.messages.length === 0) {
        throw new Error('Session has no messages to save');
    }
    const session = activeSession;
    const savedAt = new Date().toISOString();
    console.error(`[MemoryService] Saving session: ${session.sessionId} (${session.messages.length} messages)`);
    // Build embedding texts for each message
    const embeddingTexts = session.messages.map((msg, idx) => buildMemoryEmbeddingText(msg, idx, session.messages));
    // Generate embeddings in batch (more efficient than one-by-one)
    const embeddings = await embedBatch(embeddingTexts, 'document');
    // Build records for Qdrant upsert
    const records = session.messages.map((msg, idx) => ({
        id: `${session.sessionId}_${idx + 1}`,
        vector: embeddings[idx],
        metadata: {
            message_id: uuidv4(),
            session_id: session.sessionId,
            session_prefix: session.sessionPrefix,
            user_id: session.userId,
            role: msg.role,
            sequence_number: idx + 1,
            message_timestamp: msg.timestamp.toISOString(),
            content: msg.content,
            tool_name: msg.toolName,
            embedding_text: embeddingTexts[idx],
            session_status: 'saved',
            session_created: session.startTime.toISOString(),
            session_saved: savedAt,
            session_description: session.description,
            tags: session.tags,
            sync_version: 1,
            last_synced: savedAt,
        },
    }));
    // Upsert to Qdrant
    await upsertMemoryPoints(records);
    // Clear active session
    const result = {
        sessionId: session.sessionId,
        messageCount: session.messages.length,
        savedAt,
    };
    activeSession = null;
    console.error(`[MemoryService] Session saved: ${result.sessionId}`);
    return result;
}
// ============================================
// EMBEDDING TEXT BUILDER
// ============================================
/**
 * Build the text that will be embedded for a memory message.
 * Includes role, tool context, content, and brief previous message context.
 *
 * @param message - The message to build text for
 * @param index - Position in the conversation
 * @param allMessages - All messages for context
 * @returns Text string optimized for vector embedding
 */
function buildMemoryEmbeddingText(message, index, allMessages) {
    const parts = [];
    // Role prefix for context
    parts.push(`[${message.role.toUpperCase()}]`);
    // Tool context if this message is from a tool call
    if (message.toolName) {
        parts.push(`Tool: ${message.toolName}`);
    }
    // Main content
    parts.push(message.content);
    // Add brief context from previous message if available
    // This helps embeddings understand the conversational flow
    if (index > 0) {
        const prev = allMessages[index - 1];
        const prevSnippet = prev.content.slice(0, 100);
        parts.push(`Context: ${prevSnippet}...`);
    }
    return parts.join('\n');
}
// ============================================
// RETRIEVE SESSION
// ============================================
/**
 * Retrieve all messages from a saved session.
 * Returns messages in sequence order.
 *
 * @param sessionId - The session ID to retrieve
 * @param userId - User ID for isolation check
 * @returns Array of message metadata
 */
export async function retrieveSession(sessionId, userId) {
    return scrollMemoryBySession(sessionId, userId);
}
// ============================================
// CANCEL SESSION
// ============================================
/**
 * Cancel the active session without saving.
 * Discards all captured messages.
 *
 * @returns Info about cancelled session, or null if no active session
 */
export function cancelSession() {
    if (!activeSession) {
        return null;
    }
    const result = {
        sessionId: activeSession.sessionId,
        messageCount: activeSession.messages.length,
    };
    activeSession = null;
    console.error(`[MemoryService] Session cancelled: ${result.sessionId}`);
    return result;
}
// ============================================
// UTILITY FUNCTIONS
// ============================================
/**
 * Get session status summary for health checks.
 */
export function getSessionStatus() {
    if (!activeSession) {
        return {
            isRecording: false,
            sessionId: null,
            messageCount: 0,
            startTime: null,
            userId: null,
        };
    }
    return {
        isRecording: true,
        sessionId: activeSession.sessionId,
        messageCount: activeSession.messages.length,
        startTime: activeSession.startTime.toISOString(),
        userId: activeSession.userId,
    };
}
//# sourceMappingURL=memory-service.js.map