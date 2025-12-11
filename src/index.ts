import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { registerCrmTools } from './tools/crm-tools.js';
import { registerVectorTools } from './tools/vector-tools.js';
import { warmCache } from './services/odoo-client.js';
import { warmPool } from './services/odoo-pool.js';
import { warmVectorClient } from './services/vector-client.js';
import { initializeEmbeddingService } from './services/embedding-service.js';

// Create MCP server instance
const server = new McpServer({
  name: 'odoo-crm-mcp-server',
  version: '1.0.0'
});

// Register all CRM tools
registerCrmTools(server);

// Register vector tools (semantic search, pattern discovery, etc.)
// These will only be active if VECTOR_ENABLED=true in environment
registerVectorTools(server);

// ============================================
// STDIO Transport (for desktop Claude, Claude Code)
// ============================================
async function runStdio(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Odoo CRM MCP Server running on stdio');

  // Warm cache, connection pool, and vector services asynchronously (non-blocking)
  Promise.all([
    warmCache(),
    warmPool(),
    // Initialize vector services (embedding + vector DB)
    (async () => {
      initializeEmbeddingService();
      await warmVectorClient();
    })()
  ])
    .then(() => console.error('Cache, pool, and vector services warmed successfully'))
    .catch(err => console.error('Warm-up error:', err instanceof Error ? err.message : err));
}

// ============================================
// HTTP Transport (for browser Claude.ai via remote MCP)
// ============================================
async function runHTTP(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  
  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', server: 'odoo-crm-mcp-server' });
  });
  
  // MCP endpoint - stateless, creates new transport per request
  app.post('/mcp', async (req, res) => {
    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // Stateless mode
        enableJsonResponse: true
      });
      
      res.on('close', () => {
        transport.close();
      });
      
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('MCP request error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // CORS headers for browser access
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });
  
  app.options('/mcp', (_req, res) => {
    res.sendStatus(204);
  });
  
  const port = parseInt(process.env.PORT || '3000');
  const host = process.env.HOST || '0.0.0.0';
  
  app.listen(port, host, () => {
    console.error(`Odoo CRM MCP Server running on http://${host}:${port}/mcp`);
    console.error('Environment variables required:');
    console.error('  ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD');

    // Warm cache, connection pool, and vector services asynchronously (non-blocking)
    Promise.all([
      warmCache(),
      warmPool(),
      // Initialize vector services (embedding + vector DB)
      (async () => {
        initializeEmbeddingService();
        await warmVectorClient();
      })()
    ])
      .then(() => console.error('Cache, pool, and vector services warmed successfully'))
      .catch(err => console.error('Warm-up error:', err instanceof Error ? err.message : err));
  });
}

// ============================================
// Main Entry Point
// ============================================
const transport = process.env.TRANSPORT || 'stdio';

if (transport === 'http') {
  runHTTP().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
} else {
  runStdio().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
}
