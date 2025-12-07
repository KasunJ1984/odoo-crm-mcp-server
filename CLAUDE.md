# CLAUDE.md - Odoo CRM MCP Server

This document provides guidance for AI assistants working with this codebase.

## Project Overview

An MCP (Model Context Protocol) server for analyzing Odoo CRM data with intelligent context management. Designed to work with Desktop Claude, Claude Code, and browser-based Claude.ai.

**Key Design Principles:**
- Context-aware design for large CRM datasets
- Smart pagination (default 10, max 50 records)
- Aggregation tools for statistics instead of raw data dumps
- Dual output formats (JSON/Markdown)

## Tech Stack

- **Runtime:** Node.js >= 18.0.0
- **Language:** TypeScript 5.6.0
- **MCP SDK:** @modelcontextprotocol/sdk ^1.12.0
- **HTTP Server:** Express.js ^4.21.0
- **Odoo Client:** xmlrpc ^1.3.2
- **Validation:** Zod ^3.23.8

## Project Structure

```
src/
├── index.ts              # Server entry point (stdio/HTTP transport)
├── types.ts              # TypeScript type definitions
├── constants.ts          # Configuration constants and field selections
├── tools/
│   └── crm-tools.ts      # All 11 CRM tool implementations
├── services/
│   ├── odoo-client.ts    # Odoo XML-RPC client wrapper
│   └── formatters.ts     # Output formatting utilities
└── schemas/
    └── index.ts          # Zod validation schemas
dist/                     # Compiled JavaScript output (generated)
```

## Build Commands

```bash
npm run build    # Compile TypeScript to dist/
npm run start    # Run compiled server (dist/index.js)
npm run dev      # Development mode with auto-reload (tsx watch)
```

## Environment Variables

**Required:**
```bash
ODOO_URL="https://your-odoo-instance.com"
ODOO_DB="your_database_name"
ODOO_USERNAME="your_username"
ODOO_PASSWORD="your_password_or_api_key"
```

**Optional:**
```bash
TRANSPORT=stdio|http   # Default: stdio
PORT=3000              # HTTP port (default: 3000)
HOST=0.0.0.0           # HTTP host (default: 0.0.0.0)
```

## Code Architecture

### Transport Modes

1. **Stdio Transport** (default): For Desktop Claude and Claude Code
2. **HTTP Transport**: For browser-based Claude.ai via Express.js with streaming

### Core Components

- **OdooClient** (`src/services/odoo-client.ts`): Singleton XML-RPC client with authentication caching
- **CRM Tools** (`src/tools/crm-tools.ts`): 11 registered MCP tools for CRM operations
- **Formatters** (`src/services/formatters.ts`): Markdown and JSON output formatting
- **Schemas** (`src/schemas/index.ts`): Zod validation for all tool inputs

### Context Management Constants

Defined in `src/constants.ts`:
```typescript
MAX_RESPONSE_CHARS: 8000      // Maximum response size
DEFAULT_PAGE_SIZE: 10         // Default pagination
MAX_PAGE_SIZE: 50             // Maximum records per request
SUMMARY_THRESHOLD: 20         // When to suggest aggregation tools
```

## Available MCP Tools

| Tool | Purpose | Context Efficiency |
|------|---------|-------------------|
| `odoo_crm_search_leads` | Search/filter leads with pagination | Medium |
| `odoo_crm_get_lead_detail` | Get single lead details | Low |
| `odoo_crm_get_pipeline_summary` | Aggregated pipeline by stage | High |
| `odoo_crm_get_sales_analytics` | KPIs and metrics | Highest |
| `odoo_crm_search_contacts` | Search contacts/partners | Medium |
| `odoo_crm_get_activity_summary` | Activity workload overview | High |
| `odoo_crm_list_stages` | Get all pipeline stages | Minimal |
| `odoo_crm_list_lost_reasons` | Lost reasons with counts | High |
| `odoo_crm_get_lost_analysis` | Lost opportunity analysis | High |
| `odoo_crm_search_lost_opportunities` | Search lost opportunities | Medium |
| `odoo_crm_get_lost_trends` | Trends over time | High |

## Coding Conventions

### Naming
- **Tools:** `odoo_crm_[verb]_[noun]` format
- **Functions:** camelCase
- **Types/Interfaces:** PascalCase
- **Constants:** UPPER_SNAKE_CASE

### Type Safety
- All inputs validated with Zod schemas
- Strict TypeScript configuration enabled
- Runtime type checking on all tool inputs

### Error Handling
- Try-catch blocks with descriptive error messages
- Graceful error returns in tool handlers
- Authentication errors handled at client initialization

### Response Structure
All tools return:
```typescript
{
  content: [{ type: "text", text: string }],
  structuredContent?: object  // For JSON responses
}
```

## Adding New Tools

1. Define Zod schema in `src/schemas/index.ts`
2. Add type interfaces in `src/types.ts` if needed
3. Define field selections in `src/constants.ts`
4. Implement tool in `src/tools/crm-tools.ts`:
   - Register with `server.tool()`
   - Parse and validate input with Zod schema
   - Use `OdooClient` for Odoo API calls
   - Format output with formatters
5. Add formatter functions in `src/services/formatters.ts`

### Tool Registration Pattern
```typescript
server.tool(
  "odoo_crm_tool_name",
  "Tool description for LLM context",
  SchemaName.shape,
  async (args): Promise<CallToolResult> => {
    const input = SchemaName.parse(args);
    // Implementation
    return { content: [{ type: "text", text: output }] };
  }
);
```

## Odoo Domain Filters

Odoo uses Polish notation for domain filters:
```typescript
// Simple filter
[["stage_id", "=", stageId]]

// OR condition
["|", ["field1", "=", val1], ["field2", "=", val2]]

// AND is default (no operator needed)
[["field1", "=", val1], ["field2", "=", val2]]
```

## Testing

No automated tests configured. Manual testing approach:
1. Set up `.env` with Odoo credentials
2. Run `npm run dev` for stdio mode
3. Test with Claude Desktop or Claude Code
4. For HTTP mode: Set `TRANSPORT=http` and test with curl/browser

## Key Files for Modifications

| Task | File(s) |
|------|---------|
| Add new tool | `src/tools/crm-tools.ts`, `src/schemas/index.ts` |
| Modify output format | `src/services/formatters.ts` |
| Change pagination/limits | `src/constants.ts` |
| Add new types | `src/types.ts` |
| Modify Odoo API calls | `src/services/odoo-client.ts` |
| Server configuration | `src/index.ts` |

## Common Patterns

### Pagination Response
```typescript
const paginationInfo = totalCount > limit
  ? `\n---\n*Showing ${records.length} of ${totalCount}. Use offset=${offset + limit} for next page.*`
  : "";
```

### Field Selection for Context Efficiency
Use constants from `src/constants.ts`:
- `FIELD_SELECTION.LEAD_LIST` - Minimal fields for lists
- `FIELD_SELECTION.LEAD_DETAIL` - Full fields for detail view

### Currency/Date Formatting
```typescript
formatCurrency(value)   // "$1,234.56" (AUD)
formatDate(dateString)  // "1 Jan 2024" (en-AU)
```

## Dependencies Overview

| Package | Purpose |
|---------|---------|
| `@modelcontextprotocol/sdk` | MCP protocol implementation |
| `express` | HTTP server for browser transport |
| `xmlrpc` | Odoo XML-RPC API client |
| `zod` | Runtime schema validation |
| `dotenv` | Environment variable loading |
| `tsx` | TypeScript execution (dev only) |

## Security Notes

- Never commit `.env` files with credentials
- Use API keys instead of passwords when possible
- HTTP transport requires HTTPS in production for Claude.ai
- Validate all user inputs with Zod schemas
