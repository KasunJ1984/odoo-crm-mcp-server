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
import { MemorySession, MemoryMetadata } from '../types.js';
/**
 * Generate a session ID in YYYYMMDD_HHMMSS format.
 * This format is human-readable and sortable.
 */
export declare function generateSessionId(): string;
/**
 * Start a new recording session.
 * Only one session can be active at a time per server instance.
 *
 * @param userId - User identifier for isolation
 * @param options - Optional description and tags
 * @returns The newly created session
 * @throws Error if a session is already active
 */
export declare function startSession(userId: string, options?: {
    description?: string;
    tags?: string[];
}): MemorySession;
/**
 * Get the currently active session.
 * Returns null if no session is recording.
 */
export declare function getActiveSession(): MemorySession | null;
/**
 * Check if memory recording is currently active.
 * Used by other tools to decide whether to capture interactions.
 */
export declare function isMemoryRecording(): boolean;
/**
 * Capture a tool interaction during active recording.
 * This function is called automatically by CRM and vector tools.
 *
 * @param toolName - Name of the tool that was called
 * @param input - The tool's input arguments
 * @param output - The tool's output text
 */
export declare function captureInteraction(toolName: string, input: unknown, output: string): void;
/**
 * Save the active session to Qdrant.
 * Generates embeddings for all messages and stores them.
 *
 * @param options - Optional settings (future: summary generation)
 * @returns Session save result with message count
 * @throws Error if no active session or empty session
 */
export declare function saveSession(options?: {
    generateSummary?: boolean;
}): Promise<{
    sessionId: string;
    messageCount: number;
    savedAt: string;
}>;
/**
 * Retrieve all messages from a saved session.
 * Returns messages in sequence order.
 *
 * @param sessionId - The session ID to retrieve
 * @param userId - User ID for isolation check
 * @returns Array of message metadata
 */
export declare function retrieveSession(sessionId: string, userId: string): Promise<MemoryMetadata[]>;
/**
 * Cancel the active session without saving.
 * Discards all captured messages.
 *
 * @returns Info about cancelled session, or null if no active session
 */
export declare function cancelSession(): {
    sessionId: string;
    messageCount: number;
} | null;
/**
 * Get session status summary for health checks.
 */
export declare function getSessionStatus(): {
    isRecording: boolean;
    sessionId: string | null;
    messageCount: number;
    startTime: string | null;
    userId: string | null;
};
//# sourceMappingURL=memory-service.d.ts.map