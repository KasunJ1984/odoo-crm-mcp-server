import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getOdooClient } from '../services/odoo-client.js';
import { getPoolMetrics, useClient } from '../services/odoo-pool.js';
import {
  formatLeadList,
  formatLeadDetail,
  formatPipelineSummary,
  formatSalesAnalytics,
  formatContactList,
  formatActivitySummary,
  formatCurrency,
  formatPercent,
  getRelationName,
  formatLostReasonsList,
  formatLostAnalysis,
  formatLostOpportunitiesList,
  formatLostTrends,
  formatDate,
  formatWonOpportunitiesList,
  formatWonAnalysis,
  formatWonTrends,
  formatSalespeopleList,
  formatTeamsList,
  formatPerformanceComparison,
  formatActivityList,
  formatExportResult,
  formatPipelineSummaryWithWeighted,
  formatLeadListItemExtended,
  truncateText,
  formatStatesList,
  formatStateComparison,
  formatFieldsList,
  type FieldInfo
} from '../services/formatters.js';
import {
  LeadSearchSchema,
  LeadDetailSchema,
  PipelineSummarySchema,
  SalesAnalyticsSchema,
  ContactSearchSchema,
  ActivitySummarySchema,
  StageListSchema,
  LostReasonsListSchema,
  LostAnalysisSchema,
  LostOpportunitiesSearchSchema,
  LostTrendsSchema,
  WonOpportunitiesSearchSchema,
  WonAnalysisSchema,
  WonTrendsSchema,
  SalespeopleListSchema,
  TeamsListSchema,
  ComparePerformanceSchema,
  ActivitySearchSchema,
  ExportDataSchema,
  StatesListSchema,
  CompareStatesSchema,
  type LeadSearchInput,
  type LeadDetailInput,
  type PipelineSummaryInput,
  type SalesAnalyticsInput,
  type ContactSearchInput,
  type ActivitySummaryInput,
  type StageListInput,
  type LostReasonsListInput,
  type LostAnalysisInput,
  type LostOpportunitiesSearchInput,
  type LostTrendsInput,
  type WonOpportunitiesSearchInput,
  type WonAnalysisInput,
  type WonTrendsInput,
  type SalespeopleListInput,
  type TeamsListInput,
  type ComparePerformanceInput,
  type ActivitySearchInput,
  type ExportDataInput,
  type StatesListInput,
  type CompareStatesInput,
  CacheStatusSchema,
  type CacheStatusInput,
  HealthCheckSchema,
  type HealthCheckInput,
  ListFieldsSchema,
  type ListFieldsInput
} from '../schemas/index.js';
import { CRM_FIELDS, CONTEXT_LIMITS, ResponseFormat, EXPORT_CONFIG, FIELD_PRESETS, resolveFields } from '../constants.js';
import type { CrmLead, CrmStage, ResPartner, PaginatedResponse, PipelineSummary, SalesAnalytics, ActivitySummary, CrmLostReason, LostReasonWithCount, LostAnalysisSummary, LostOpportunity, LostTrendsSummary, WonOpportunity, WonAnalysisSummary, WonTrendsSummary, SalespersonWithStats, SalesTeamWithStats, PerformanceComparison, ActivityDetail, ExportResult, PipelineSummaryWithWeighted, CrmTeam, ResUsers, OdooRecord, ExportFormat, ResCountryState, StateWithStats, StateComparison } from '../types.js';
import { ExportWriter, generateExportFilename, getOutputDirectory, getMimeType } from '../utils/export-writer.js';
import { convertDateToUtc, getDaysAgoUtc } from '../utils/timezone.js';
import { cache, CACHE_KEYS } from '../utils/cache.js';
import { withTimeout, TIMEOUTS, TimeoutError } from '../utils/timeout.js';

// Register all CRM tools
export function registerCrmTools(server: McpServer): void {
  
  // ============================================
  // TOOL: Search Leads/Opportunities
  // ============================================
  server.registerTool(
    'odoo_crm_search_leads',
    {
      title: 'Search CRM Leads/Opportunities',
      description: `Search and filter Odoo CRM leads and opportunities with context-aware pagination.

Use this tool to find leads/opportunities by various criteria. Results are paginated to preserve context window space.

**When to use:**
- Finding specific leads by name, contact, or email
- Filtering opportunities by stage, salesperson, or revenue range
- Browsing pipeline with pagination

**Context Management Tips:**
- Start with limit=10 (default) to preview results
- Use filters to narrow results before increasing limit
- For large datasets, use odoo_crm_get_pipeline_summary instead

Returns paginated list with: name, contact, email, stage, revenue, probability`,
      inputSchema: LeadSearchSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: LeadSearchInput) => {
      try {
        return await useClient(async (client) => {
          // Build domain filter
          const domain: unknown[] = [];
        
        if (params.active_only) {
          domain.push(['active', '=', true]);
        }
        
        if (params.query) {
          // OR search across name, contact, and email using Polish notation
          domain.push(
            '|',
            '|',
            ['name', 'ilike', params.query],
            ['contact_name', 'ilike', params.query],
            ['email_from', 'ilike', params.query]
          );
        }
        
        if (params.stage_id) {
          domain.push(['stage_id', '=', params.stage_id]);
        }
        
        if (params.stage_name) {
          domain.push(['stage_id.name', 'ilike', params.stage_name]);
        }
        
        if (params.user_id) {
          domain.push(['user_id', '=', params.user_id]);
        }
        
        if (params.type) {
          domain.push(['type', '=', params.type]);
        }
        
        if (params.min_revenue !== undefined) {
          domain.push(['expected_revenue', '>=', params.min_revenue]);
        }
        
        if (params.max_revenue !== undefined) {
          domain.push(['expected_revenue', '<=', params.max_revenue]);
        }
        
        if (params.min_probability !== undefined) {
          domain.push(['probability', '>=', params.min_probability]);
        }
        
        // Date filters based on date_field (convert Sydney time to UTC)
        const dateField = params.date_field || 'create_date';
        if (params.date_from) {
          domain.push([dateField, '>=', convertDateToUtc(params.date_from, false)]);
        }

        if (params.date_to) {
          domain.push([dateField, '<=', convertDateToUtc(params.date_to, true)]);
        }

        // Explicit date_closed filters (convert Sydney time to UTC)
        if (params.date_closed_from) {
          domain.push(['date_closed', '>=', convertDateToUtc(params.date_closed_from, false)]);
        }

        if (params.date_closed_to) {
          domain.push(['date_closed', '<=', convertDateToUtc(params.date_closed_to, true)]);
        }

        // Team filter
        if (params.team_id) {
          domain.push(['team_id', '=', params.team_id]);
        }

        // Classification filters
        if (params.lead_source_id) {
          domain.push(['lead_source_id', '=', params.lead_source_id]);
        }

        if (params.sector) {
          domain.push(['sector', 'ilike', params.sector]);
        }

        if (params.specification_id) {
          domain.push(['specification_id', '=', params.specification_id]);
        }

        // State/Territory filters (direct field on crm.lead)
        if (params.state_id) {
          domain.push(['state_id', '=', params.state_id]);
        }

        if (params.state_name) {
          domain.push(['state_id.name', 'ilike', params.state_name]);
        }

        // City filter
        if (params.city) {
          domain.push(['city', 'ilike', params.city]);
        }

        // Get total count
        const total = await client.searchCount('crm.lead', domain);

        // Resolve fields from preset or custom array
        const fields = resolveFields(params.fields, 'lead', 'basic');

        // Fetch records
        const leads = await client.searchRead<CrmLead>(
          'crm.lead',
          domain,
          fields,
          {
            offset: params.offset,
            limit: params.limit,
            order: `${params.order_by} ${params.order_dir}`
          }
        );
        
        // Build paginated response
        const response: PaginatedResponse<CrmLead> = {
          total,
          count: leads.length,
          offset: params.offset,
          limit: params.limit,
          items: leads,
          has_more: total > params.offset + leads.length,
          next_offset: total > params.offset + leads.length ? params.offset + leads.length : undefined
        };
        
        // Add context note if large dataset
        if (total > CONTEXT_LIMITS.SUMMARY_THRESHOLD && params.limit < total) {
          response.context_note = `Large dataset (${total} records). Consider using filters or odoo_crm_get_pipeline_summary for overview.`;
        }
        
        const output = formatLeadList(response, params.response_format);
        
          return {
            content: [{ type: 'text', text: output }],
            structuredContent: response
          };
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error searching leads: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: Get Lead Details
  // ============================================
  server.registerTool(
    'odoo_crm_get_lead_detail',
    {
      title: 'Get Lead/Opportunity Details',
      description: `Retrieve complete details for a single lead or opportunity by ID.

Use this tool when you need full information about a specific lead, including all contact details, assignment, dates, and notes.

**When to use:**
- After finding a lead ID from search results
- When user asks about a specific opportunity
- To get detailed notes or description

Returns all available fields for the lead including description/notes.`,
      inputSchema: LeadDetailSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: LeadDetailInput) => {
      try {
        return await useClient(async (client) => {
          // Resolve fields from preset or custom array (default: full for detail views)
          const fields = resolveFields(params.fields, 'lead', 'full');

          const leads = await client.read<CrmLead>(
            'crm.lead',
            [params.lead_id],
            fields
          );

          if (leads.length === 0) {
            return {
              isError: true,
              content: [{ type: 'text', text: `Lead with ID ${params.lead_id} not found.` }]
            };
          }

          const lead = leads[0];

          if (params.response_format === ResponseFormat.JSON) {
            return {
              content: [{ type: 'text', text: JSON.stringify(lead, null, 2) }],
              structuredContent: lead
            };
          }

          return {
            content: [{ type: 'text', text: formatLeadDetail(lead) }],
            structuredContent: lead
          };
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error fetching lead: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: Pipeline Summary (Aggregated)
  // ============================================
  server.registerTool(
    'odoo_crm_get_pipeline_summary',
    {
      title: 'Get Pipeline Summary',
      description: `Get aggregated pipeline statistics grouped by stage - ideal for context-efficient overview.

This tool returns summary statistics instead of individual records, making it perfect for understanding pipeline health without consuming context window space.

**When to use:**
- Getting pipeline overview
- Analyzing opportunity distribution across stages
- Comparing revenue by stage
- When there are many opportunities (use this before search)

Returns: count, total revenue, avg probability per stage, plus optional top opportunities per stage.`,
      inputSchema: PipelineSummarySchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: PipelineSummaryInput) => {
      try {
        const client = getOdooClient();
        
        // Build domain
        const domain: unknown[] = [['active', '=', true]];
        
        if (params.team_id) {
          domain.push(['team_id', '=', params.team_id]);
        }
        
        if (params.user_id) {
          domain.push(['user_id', '=', params.user_id]);
        }
        
        // Get stages (cached for 30 minutes)
        const stages = await client.getStagesCached();
        
        // Get aggregated data by stage
        const groupedData = await client.readGroup(
          'crm.lead',
          domain,
          ['stage_id', 'expected_revenue:sum', 'probability:avg', 'id:count'],
          ['stage_id']
        );
        
        // Build summary
        const stageSummaries: PipelineSummary[] = [];
        
        for (const stage of stages) {
          const stageData = groupedData.find(
            (g) => Array.isArray(g.stage_id) && g.stage_id[0] === stage.id
          );
          
          if (!stageData && !params.include_lost) continue;
          
          const summary: PipelineSummary = {
            stage_name: stage.name,
            stage_id: stage.id,
            count: (stageData?.id as number) || 0,
            total_revenue: (stageData?.expected_revenue as number) || 0,
            avg_probability: (stageData?.probability as number) || 0,
            opportunities: []
          };
          
          // Optionally fetch top opportunities per stage
          if (params.max_opps_per_stage > 0 && summary.count > 0) {
            const stageDomain = [...domain, ['stage_id', '=', stage.id]];
            const topOpps = await client.searchRead<CrmLead>(
              'crm.lead',
              stageDomain,
              ['id', 'name', 'expected_revenue', 'probability'],
              { limit: params.max_opps_per_stage, order: 'expected_revenue desc' }
            );
            
            summary.opportunities = topOpps.map(o => ({
              id: o.id,
              name: o.name,
              expected_revenue: o.expected_revenue || 0,
              probability: o.probability || 0
            }));
          }
          
          stageSummaries.push(summary);
        }
        
        const output = formatPipelineSummary(stageSummaries, params.response_format);
        
        return {
          content: [{ type: 'text', text: output }],
          structuredContent: { stages: stageSummaries }
        };
        
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error fetching pipeline summary: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: Sales Analytics
  // ============================================
  server.registerTool(
    'odoo_crm_get_sales_analytics',
    {
      title: 'Get Sales Analytics',
      description: `Get comprehensive sales analytics and KPIs - the most context-efficient way to understand CRM performance.

Returns aggregated metrics including conversion rates, revenue analysis, and performance by stage/salesperson.

**When to use:**
- Understanding overall CRM performance
- Analyzing win/loss rates
- Comparing salesperson performance
- Identifying top opportunities

**Ideal for:** Initial analysis, reporting, performance reviews`,
      inputSchema: SalesAnalyticsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: SalesAnalyticsInput) => {
      try {
        const client = getOdooClient();
        
        // Build base domain
        const domain: unknown[] = [];
        
        if (params.team_id) {
          domain.push(['team_id', '=', params.team_id]);
        }
        
        if (params.date_from) {
          domain.push(['create_date', '>=', convertDateToUtc(params.date_from, false)]);
        }

        if (params.date_to) {
          domain.push(['create_date', '<=', convertDateToUtc(params.date_to, true)]);
        }

        // Get counts
        const totalLeads = await client.searchCount('crm.lead', [...domain, ['type', '=', 'lead']]);
        const totalOpps = await client.searchCount('crm.lead', [...domain, ['type', '=', 'opportunity']]);
        const wonOpps = await client.searchCount('crm.lead', [...domain, ['probability', '=', 100]]);
        const lostOpps = await client.searchCount('crm.lead', [...domain, ['active', '=', false], ['probability', '=', 0]]);
        
        // Get revenue by stage
        const byStage = await client.readGroup(
          'crm.lead',
          [...domain, ['active', '=', true]],
          ['stage_id', 'expected_revenue:sum', 'id:count'],
          ['stage_id']
        );
        
        // Get revenue totals
        const revenueExpected = byStage.reduce((sum, s) => sum + ((s.expected_revenue as number) || 0), 0);
        
        const wonRevenue = await client.readGroup(
          'crm.lead',
          [...domain, ['probability', '=', 100]],
          ['expected_revenue:sum'],
          []
        );
        const revenueWon = (wonRevenue[0]?.expected_revenue as number) || 0;
        
        // Calculate analytics
        const analytics: SalesAnalytics = {
          period: params.date_from || params.date_to 
            ? `${params.date_from || 'Start'} to ${params.date_to || 'Now'}` 
            : 'All Time',
          total_leads: totalLeads,
          total_opportunities: totalOpps,
          total_won: wonOpps,
          total_lost: lostOpps,
          total_revenue_expected: revenueExpected,
          total_revenue_won: revenueWon,
          conversion_rate: totalOpps > 0 ? (wonOpps / totalOpps) * 100 : 0,
          avg_deal_size: wonOpps > 0 ? revenueWon / wonOpps : 0,
          by_stage: byStage.map(s => ({
            stage: Array.isArray(s.stage_id) ? s.stage_id[1] as string : 'Unknown',
            count: (s.id as number) || 0,
            revenue: (s.expected_revenue as number) || 0
          })),
          top_opportunities: []
        };
        
        // Get by salesperson if requested
        if (params.include_by_salesperson) {
          const bySalesperson = await client.readGroup(
            'crm.lead',
            [...domain, ['active', '=', true]],
            ['user_id', 'expected_revenue:sum', 'id:count'],
            ['user_id']
          );
          
          // Get won counts per user
          const wonBySalesperson = await client.readGroup(
            'crm.lead',
            [...domain, ['probability', '=', 100]],
            ['user_id', 'id:count'],
            ['user_id']
          );
          
          analytics.by_salesperson = bySalesperson.map(s => {
            const wonData = wonBySalesperson.find(
              w => Array.isArray(w.user_id) && Array.isArray(s.user_id) && w.user_id[0] === s.user_id[0]
            );
            return {
              name: Array.isArray(s.user_id) ? s.user_id[1] as string : 'Unassigned',
              count: (s.id as number) || 0,
              revenue: (s.expected_revenue as number) || 0,
              won: (wonData?.id as number) || 0
            };
          });
        }
        
        // Get top opportunities
        if (params.top_opportunities_count > 0) {
          const topOpps = await client.searchRead<CrmLead>(
            'crm.lead',
            [...domain, ['active', '=', true], ['probability', '<', 100]],
            ['id', 'name', 'expected_revenue', 'probability', 'stage_id'],
            { limit: params.top_opportunities_count, order: 'expected_revenue desc' }
          );

          analytics.top_opportunities = topOpps.map(o => ({
            id: o.id,
            name: o.name,
            revenue: o.expected_revenue || 0,
            probability: o.probability || 0,
            stage: getRelationName(o.stage_id)
          }));
        }
        
        const output = formatSalesAnalytics(analytics, params.response_format);
        
        return {
          content: [{ type: 'text', text: output }],
          structuredContent: analytics
        };
        
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error fetching analytics: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: Search Contacts
  // ============================================
  server.registerTool(
    'odoo_crm_search_contacts',
    {
      title: 'Search CRM Contacts',
      description: `Search Odoo contacts/partners with pagination.

**When to use:**
- Finding customer or prospect contact details
- Looking up company information
- Finding contacts by location

Returns: name, email, phone, city, country`,
      inputSchema: ContactSearchSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: ContactSearchInput) => {
      try {
        return await useClient(async (client) => {
          // Build domain
          const domain: unknown[] = [];

          if (params.query) {
          // OR search across name, email, and phone using Polish notation
          domain.push(
            '|',
            '|',
            ['name', 'ilike', params.query],
            ['email', 'ilike', params.query],
            ['phone', 'ilike', params.query]
          );
        }
        
        if (params.is_company !== undefined) {
          domain.push(['is_company', '=', params.is_company]);
        }
        
        if (params.country) {
          domain.push(['country_id.name', 'ilike', params.country]);
        }
        
        if (params.city) {
          domain.push(['city', 'ilike', params.city]);
        }

        // State/Territory filters
        if (params.state_id) {
          domain.push(['state_id', '=', params.state_id]);
        }

        if (params.state_name) {
          domain.push(['state_id.name', 'ilike', params.state_name]);
        }

        if (params.has_opportunities) {
          // Get partner IDs with opportunities
          const opps = await client.searchRead<CrmLead>(
            'crm.lead',
            [['partner_id', '!=', false]],
            ['partner_id'],
            { limit: 1000 }
          );
          const partnerIds = [...new Set(opps.map(o => o.partner_id?.[0]).filter(Boolean))];
          if (partnerIds.length > 0) {
            domain.push(['id', 'in', partnerIds]);
          }
        }

        // Get total count
        const total = await client.searchCount('res.partner', domain);

        // Resolve fields from preset or custom array
        const fields = resolveFields(params.fields, 'contact', 'basic');

        // Fetch records
        const contacts = await client.searchRead<ResPartner>(
          'res.partner',
          domain,
          fields,
          {
            offset: params.offset,
            limit: params.limit,
            order: 'name asc'
          }
        );

        const response: PaginatedResponse<ResPartner> = {
          total,
          count: contacts.length,
          offset: params.offset,
          limit: params.limit,
          items: contacts,
          has_more: total > params.offset + contacts.length,
          next_offset: total > params.offset + contacts.length ? params.offset + contacts.length : undefined
        };
        
          const output = formatContactList(response, params.response_format);

          return {
            content: [{ type: 'text', text: output }],
            structuredContent: response
          };
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error searching contacts: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: Activity Summary
  // ============================================
  server.registerTool(
    'odoo_crm_get_activity_summary',
    {
      title: 'Get Activity Summary',
      description: `Get aggregated summary of CRM activities (calls, meetings, tasks).

Returns activity counts by status (overdue, today, upcoming) and by type/user.

**When to use:**
- Checking workload distribution
- Finding overdue activities
- Planning follow-ups`,
      inputSchema: ActivitySummarySchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: ActivitySummaryInput) => {
      try {
        const client = getOdooClient();
        
        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + params.days_ahead);
        const futureStr = futureDate.toISOString().split('T')[0];
        
        // Build base domain
        const baseDomain: unknown[] = [['res_model', '=', 'crm.lead']];
        
        if (params.user_id) {
          baseDomain.push(['user_id', '=', params.user_id]);
        }
        
        // Count by status
        const overdue = await client.searchCount('mail.activity', [
          ...baseDomain,
          ['date_deadline', '<', today]
        ]);
        
        const todayCount = await client.searchCount('mail.activity', [
          ...baseDomain,
          ['date_deadline', '=', today]
        ]);
        
        const upcoming = await client.searchCount('mail.activity', [
          ...baseDomain,
          ['date_deadline', '>', today],
          ['date_deadline', '<=', futureStr]
        ]);
        
        const total = overdue + todayCount + upcoming;
        
        // Get by type
        const byType = await client.readGroup(
          'mail.activity',
          baseDomain,
          ['activity_type_id', 'id:count'],
          ['activity_type_id']
        );
        
        // Get overdue by type
        const overdueByType = await client.readGroup(
          'mail.activity',
          [...baseDomain, ['date_deadline', '<', today]],
          ['activity_type_id', 'id:count'],
          ['activity_type_id']
        );
        
        // Get by user
        const byUser = await client.readGroup(
          'mail.activity',
          baseDomain,
          ['user_id', 'id:count'],
          ['user_id']
        );
        
        const overdueByUser = await client.readGroup(
          'mail.activity',
          [...baseDomain, ['date_deadline', '<', today]],
          ['user_id', 'id:count'],
          ['user_id']
        );
        
        const summary: ActivitySummary = {
          total_activities: total,
          overdue,
          today: todayCount,
          upcoming,
          by_type: byType.map(t => {
            const overdueData = overdueByType.find(
              o => Array.isArray(o.activity_type_id) && Array.isArray(t.activity_type_id) && 
                   o.activity_type_id[0] === t.activity_type_id[0]
            );
            return {
              type: Array.isArray(t.activity_type_id) ? t.activity_type_id[1] as string : 'Unknown',
              count: (t.id as number) || 0,
              overdue: (overdueData?.id as number) || 0
            };
          }),
          by_user: byUser.map(u => {
            const overdueData = overdueByUser.find(
              o => Array.isArray(o.user_id) && Array.isArray(u.user_id) && 
                   o.user_id[0] === u.user_id[0]
            );
            return {
              user: Array.isArray(u.user_id) ? u.user_id[1] as string : 'Unassigned',
              total: (u.id as number) || 0,
              overdue: (overdueData?.id as number) || 0
            };
          })
        };
        
        const output = formatActivitySummary(summary, params.response_format);
        
        return {
          content: [{ type: 'text', text: output }],
          structuredContent: summary
        };
        
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error fetching activities: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: List Stages
  // ============================================
  server.registerTool(
    'odoo_crm_list_stages',
    {
      title: 'List CRM Stages',
      description: `Get all CRM pipeline stages with their IDs.

Use this to understand the pipeline structure and get stage IDs for filtering.

**When to use:**
- Before filtering leads by stage
- Understanding pipeline configuration`,
      inputSchema: StageListSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: StageListInput) => {
      try {
        const client = getOdooClient();

        // Get stages (cached for 30 minutes)
        const stages = await client.getStagesCached();

        if (params.response_format === ResponseFormat.JSON) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ stages }, null, 2) }],
            structuredContent: { stages }
          };
        }

        let output = '## CRM Pipeline Stages\n\n';
        for (const stage of stages) {
          output += `- **${stage.name}** (ID: ${stage.id})`;
          if (stage.is_won) output += ' ✅ Won';
          if (stage.fold) output += ' 📁 Folded';
          output += '\n';
        }

        return {
          content: [{ type: 'text', text: output }],
          structuredContent: { stages }
        };

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error fetching stages: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: List Lost Reasons
  // ============================================
  server.registerTool(
    'odoo_crm_list_lost_reasons',
    {
      title: 'List Lost Reasons',
      description: `Retrieve all configured lost reasons from the CRM system.

Returns the list of predefined reasons for losing opportunities, with a count of opportunities associated with each reason.

**When to use:**
- Understanding why deals are being lost
- Getting reason IDs for filtering lost opportunity queries
- Reviewing the lost reason configuration`,
      inputSchema: LostReasonsListSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: LostReasonsListInput) => {
      try {
        const client = getOdooClient();

        // Try to get lost reasons from the dedicated model first
        let reasonsWithCounts: LostReasonWithCount[] = [];

        try {
          // Get lost reasons (cached for 30 minutes)
          const reasons = await client.getLostReasonsCached(params.include_inactive);

          // Get count of opportunities per reason using read_group
          const countsByReason = await client.readGroup(
            'crm.lead',
            [['lost_reason_id', '!=', false], ['active', '=', false], ['probability', '=', 0]],
            ['lost_reason_id', 'id:count'],
            ['lost_reason_id']
          );

          // Map counts to reasons
          reasonsWithCounts = reasons.map(reason => {
            const countData = countsByReason.find(
              (c) => Array.isArray(c.lost_reason_id) && c.lost_reason_id[0] === reason.id
            );
            return {
              ...reason,
              opportunity_count: (countData?.id as number) || 0
            };
          });

        } catch {
          // Fallback: Extract lost reasons directly from crm.lead lost_reason_id values
          // This works even if crm.lost.reason model is not accessible
          const countsByReason = await client.readGroup(
            'crm.lead',
            [['lost_reason_id', '!=', false], ['type', '=', 'opportunity']],
            ['lost_reason_id', 'id:count'],
            ['lost_reason_id']
          );

          // Build reasons from the grouped data
          reasonsWithCounts = countsByReason
            .filter(c => Array.isArray(c.lost_reason_id) && (c.lost_reason_id as unknown[]).length >= 2)
            .map(c => {
              const reasonArr = c.lost_reason_id as [number, string];
              return {
                id: reasonArr[0],
                name: reasonArr[1],
                active: true,
                opportunity_count: (c.id as number) || 0
              };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
        }

        const output = formatLostReasonsList(reasonsWithCounts, params.response_format);

        return {
          content: [{ type: 'text', text: output }],
          structuredContent: { reasons: reasonsWithCounts }
        };

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error fetching lost reasons: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: Get Lost Analysis
  // ============================================
  server.registerTool(
    'odoo_crm_get_lost_analysis',
    {
      title: 'Get Lost Opportunity Analysis',
      description: `Get aggregated analytics on lost opportunities - the primary tool for understanding why deals are being lost.

Returns summary statistics including total lost count and revenue, breakdown by the selected grouping, and optionally the top largest lost opportunities.

**When to use:**
- Understanding why deals are being lost (group by reason)
- Analyzing which salespeople have highest loss rates (group by salesperson)
- Finding at which stage deals are lost most (group by stage)
- Reviewing monthly loss trends (group by month)

**Best Practices:**
- Start with group_by='reason' for initial analysis
- Use date filters to focus on specific time periods
- Compare with won data for context (win/loss ratio)`,
      inputSchema: LostAnalysisSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: LostAnalysisInput) => {
      try {
        const client = getOdooClient();

        // Build domain for lost opportunities
        // Lost = active=False AND probability=0 (archived opportunities with 0% probability)
        const domain: unknown[] = [
          ['type', '=', 'opportunity'],
          ['active', '=', false],
          ['probability', '=', 0]
        ];

        // Apply filters (convert Sydney time to UTC)
        if (params.date_from) {
          domain.push(['date_closed', '>=', convertDateToUtc(params.date_from, false)]);
        }
        if (params.date_to) {
          domain.push(['date_closed', '<=', convertDateToUtc(params.date_to, true)]);
        }
        if (params.user_id) {
          domain.push(['user_id', '=', params.user_id]);
        }
        if (params.team_id) {
          domain.push(['team_id', '=', params.team_id]);
        }
        if (params.lost_reason_id) {
          domain.push(['lost_reason_id', '=', params.lost_reason_id]);
        }
        if (params.stage_id) {
          domain.push(['stage_id', '=', params.stage_id]);
        }
        if (params.min_revenue !== undefined) {
          domain.push(['expected_revenue', '>=', params.min_revenue]);
        }

        // Get total lost count and revenue
        const lostTotals = await client.readGroup(
          'crm.lead',
          domain,
          ['expected_revenue:sum', 'id:count'],
          []
        );

        const totalLost = (lostTotals[0]?.id as number) || 0;
        const totalLostRevenue = (lostTotals[0]?.expected_revenue as number) || 0;

        // Build analysis summary
        const analysis: LostAnalysisSummary = {
          period: params.date_from || params.date_to
            ? `${params.date_from || 'Start'} to ${params.date_to || 'Now'}`
            : 'All Time',
          total_lost: totalLost,
          total_lost_revenue: totalLostRevenue,
          avg_deal_size: totalLost > 0 ? totalLostRevenue / totalLost : 0
        };

        // Get won data for context (convert Sydney time to UTC)
        const wonDomain: unknown[] = [
          ['type', '=', 'opportunity'],
          ['probability', '=', 100]
        ];
        if (params.date_from) wonDomain.push(['date_closed', '>=', convertDateToUtc(params.date_from, false)]);
        if (params.date_to) wonDomain.push(['date_closed', '<=', convertDateToUtc(params.date_to, true)]);
        if (params.user_id) wonDomain.push(['user_id', '=', params.user_id]);
        if (params.team_id) wonDomain.push(['team_id', '=', params.team_id]);

        const wonTotals = await client.readGroup(
          'crm.lead',
          wonDomain,
          ['expected_revenue:sum', 'id:count'],
          []
        );

        analysis.total_won = (wonTotals[0]?.id as number) || 0;
        analysis.total_won_revenue = (wonTotals[0]?.expected_revenue as number) || 0;
        analysis.win_rate = (analysis.total_won + totalLost) > 0
          ? (analysis.total_won / (analysis.total_won + totalLost)) * 100
          : 0;

        // Get grouped data based on group_by parameter
        if (params.group_by === 'reason') {
          const byReason = await client.readGroup(
            'crm.lead',
            domain,
            ['lost_reason_id', 'expected_revenue:sum', 'id:count'],
            ['lost_reason_id']
          );

          analysis.by_reason = byReason.map(r => ({
            reason_id: Array.isArray(r.lost_reason_id) ? r.lost_reason_id[0] : 0,
            reason_name: Array.isArray(r.lost_reason_id) ? r.lost_reason_id[1] as string : 'No Reason Specified',
            count: (r.id as number) || 0,
            percentage: totalLost > 0 ? ((r.id as number) / totalLost) * 100 : 0,
            lost_revenue: (r.expected_revenue as number) || 0,
            avg_deal: (r.id as number) > 0 ? ((r.expected_revenue as number) || 0) / (r.id as number) : 0
          })).sort((a, b) => b.count - a.count);
        }

        if (params.group_by === 'salesperson') {
          const byUser = await client.readGroup(
            'crm.lead',
            domain,
            ['user_id', 'expected_revenue:sum', 'id:count'],
            ['user_id']
          );

          analysis.by_salesperson = byUser.map(u => ({
            user_id: Array.isArray(u.user_id) ? u.user_id[0] : 0,
            user_name: Array.isArray(u.user_id) ? u.user_id[1] as string : 'Unassigned',
            count: (u.id as number) || 0,
            percentage: totalLost > 0 ? ((u.id as number) / totalLost) * 100 : 0,
            lost_revenue: (u.expected_revenue as number) || 0,
            avg_deal: (u.id as number) > 0 ? ((u.expected_revenue as number) || 0) / (u.id as number) : 0
          })).sort((a, b) => b.count - a.count);
        }

        if (params.group_by === 'team') {
          const byTeam = await client.readGroup(
            'crm.lead',
            domain,
            ['team_id', 'expected_revenue:sum', 'id:count'],
            ['team_id']
          );

          analysis.by_team = byTeam.map(t => ({
            team_id: Array.isArray(t.team_id) ? t.team_id[0] : 0,
            team_name: Array.isArray(t.team_id) ? t.team_id[1] as string : 'No Team',
            count: (t.id as number) || 0,
            percentage: totalLost > 0 ? ((t.id as number) / totalLost) * 100 : 0,
            lost_revenue: (t.expected_revenue as number) || 0,
            avg_deal: (t.id as number) > 0 ? ((t.expected_revenue as number) || 0) / (t.id as number) : 0
          })).sort((a, b) => b.count - a.count);
        }

        if (params.group_by === 'stage') {
          const byStage = await client.readGroup(
            'crm.lead',
            domain,
            ['stage_id', 'expected_revenue:sum', 'id:count'],
            ['stage_id']
          );

          analysis.by_stage = byStage.map(s => ({
            stage_id: Array.isArray(s.stage_id) ? s.stage_id[0] : 0,
            stage_name: Array.isArray(s.stage_id) ? s.stage_id[1] as string : 'Unknown',
            count: (s.id as number) || 0,
            percentage: totalLost > 0 ? ((s.id as number) / totalLost) * 100 : 0,
            lost_revenue: (s.expected_revenue as number) || 0,
            avg_deal: (s.id as number) > 0 ? ((s.expected_revenue as number) || 0) / (s.id as number) : 0
          })).sort((a, b) => b.count - a.count);
        }

        if (params.group_by === 'month') {
          const byMonth = await client.readGroup(
            'crm.lead',
            domain,
            ['expected_revenue:sum', 'id:count'],
            ['date_closed:month']
          );

          analysis.by_month = byMonth.map(m => ({
            month: (m['date_closed:month'] as string) || 'Unknown',
            count: (m.id as number) || 0,
            lost_revenue: (m.expected_revenue as number) || 0
          }));
        }

        if (params.group_by === 'sector') {
          const bySector = await client.readGroup(
            'crm.lead',
            domain,
            ['sector', 'expected_revenue:sum', 'id:count'],
            ['sector']
          );

          analysis.by_sector = bySector.map(s => ({
            sector: (s.sector as string) || 'Not Specified',
            count: (s.id as number) || 0,
            percentage: totalLost > 0 ? ((s.id as number) / totalLost) * 100 : 0,
            lost_revenue: (s.expected_revenue as number) || 0,
            avg_deal: (s.id as number) > 0 ? ((s.expected_revenue as number) || 0) / (s.id as number) : 0
          })).sort((a, b) => b.count - a.count);
        }

        if (params.group_by === 'specification') {
          const bySpec = await client.readGroup(
            'crm.lead',
            domain,
            ['specification_id', 'expected_revenue:sum', 'id:count'],
            ['specification_id']
          );

          analysis.by_specification = bySpec.map(s => ({
            specification_id: Array.isArray(s.specification_id) ? s.specification_id[0] : 0,
            specification_name: Array.isArray(s.specification_id) ? s.specification_id[1] as string : 'Not Specified',
            count: (s.id as number) || 0,
            percentage: totalLost > 0 ? ((s.id as number) / totalLost) * 100 : 0,
            lost_revenue: (s.expected_revenue as number) || 0,
            avg_deal: (s.id as number) > 0 ? ((s.expected_revenue as number) || 0) / (s.id as number) : 0
          })).sort((a, b) => b.count - a.count);
        }

        if (params.group_by === 'lead_source') {
          const byLeadSource = await client.readGroup(
            'crm.lead',
            domain,
            ['lead_source_id', 'expected_revenue:sum', 'id:count'],
            ['lead_source_id']
          );

          analysis.by_lead_source = byLeadSource.map(s => ({
            lead_source_id: Array.isArray(s.lead_source_id) ? s.lead_source_id[0] : 0,
            lead_source_name: Array.isArray(s.lead_source_id) ? s.lead_source_id[1] as string : 'Not Specified',
            count: (s.id as number) || 0,
            percentage: totalLost > 0 ? ((s.id as number) / totalLost) * 100 : 0,
            lost_revenue: (s.expected_revenue as number) || 0,
            avg_deal: (s.id as number) > 0 ? ((s.expected_revenue as number) || 0) / (s.id as number) : 0
          })).sort((a, b) => b.count - a.count);
        }

        if (params.group_by === 'state') {
          const byState = await client.readGroup(
            'crm.lead',
            domain,
            ['state_id', 'expected_revenue:sum', 'id:count'],
            ['state_id']
          );

          analysis.by_state = byState.map(s => ({
            state_id: Array.isArray(s.state_id) ? s.state_id[0] : 0,
            state_name: Array.isArray(s.state_id) ? s.state_id[1] as string : 'Not Specified',
            count: (s.id as number) || 0,
            percentage: totalLost > 0 ? ((s.id as number) / totalLost) * 100 : 0,
            lost_revenue: (s.expected_revenue as number) || 0,
            avg_deal: (s.id as number) > 0 ? ((s.expected_revenue as number) || 0) / (s.id as number) : 0
          })).sort((a, b) => b.count - a.count);
        }

        if (params.group_by === 'city') {
          const byCity = await client.readGroup(
            'crm.lead',
            domain,
            ['city', 'expected_revenue:sum', 'id:count'],
            ['city']
          );

          analysis.by_city = byCity.map(c => ({
            city: (c.city as string) || 'Not Specified',
            count: (c.id as number) || 0,
            percentage: totalLost > 0 ? ((c.id as number) / totalLost) * 100 : 0,
            lost_revenue: (c.expected_revenue as number) || 0,
            avg_deal: (c.id as number) > 0 ? ((c.expected_revenue as number) || 0) / (c.id as number) : 0
          })).sort((a, b) => b.count - a.count);
        }

        // Get top lost opportunities
        if (params.include_top_lost > 0) {
          const topLost = await client.searchRead<LostOpportunity>(
            'crm.lead',
            domain,
            ['id', 'name', 'expected_revenue', 'lost_reason_id', 'user_id', 'date_closed'],
            { limit: params.include_top_lost, order: 'expected_revenue desc' }
          );

          analysis.top_lost = topLost.map(o => ({
            id: o.id,
            name: o.name,
            revenue: o.expected_revenue || 0,
            reason: getRelationName(o.lost_reason_id),
            salesperson: getRelationName(o.user_id),
            date_closed: formatDate(o.date_closed)
          }));
        }

        const output = formatLostAnalysis(analysis, params.group_by, params.response_format);

        return {
          content: [{ type: 'text', text: output }],
          structuredContent: analysis
        };

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error fetching lost analysis: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: Search Lost Opportunities
  // ============================================
  server.registerTool(
    'odoo_crm_search_lost_opportunities',
    {
      title: 'Search Lost Opportunities',
      description: `Search and browse lost opportunities with filtering and pagination.

Returns a paginated list of lost opportunities with details including the lost reason, revenue, stage when lost, and salesperson.

**When to use:**
- Finding specific lost deals by name or contact
- Drilling down into opportunities lost to competitors
- Reviewing lost deals for a specific salesperson or time period
- Finding the biggest deals that were lost`,
      inputSchema: LostOpportunitiesSearchSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: LostOpportunitiesSearchInput) => {
      try {
        return await useClient(async (client) => {
          // Build domain for lost opportunities
          // Lost = active=False AND probability=0 (archived opportunities with 0% probability)
          const domain: unknown[] = [
            ['type', '=', 'opportunity'],
            ['active', '=', false],
            ['probability', '=', 0]
          ];

          // Default to last 90 days if no date filter specified (prevents timeout on large datasets)
          // Use getDaysAgoUtc to get Sydney-timezone-aware 90 days ago converted to UTC
          if (!params.date_from && !params.date_to) {
            domain.push(['date_closed', '>=', getDaysAgoUtc(90, false)]);
          }

          // Apply search filters
          if (params.query) {
            domain.push(
            '|',
            '|',
            ['name', 'ilike', params.query],
            ['contact_name', 'ilike', params.query],
            ['email_from', 'ilike', params.query]
          );
        }

        if (params.lost_reason_id) {
          domain.push(['lost_reason_id', '=', params.lost_reason_id]);
        }

        if (params.lost_reason_name) {
          domain.push(['lost_reason_id.name', 'ilike', params.lost_reason_name]);
        }

        if (params.user_id) {
          domain.push(['user_id', '=', params.user_id]);
        }

        if (params.team_id) {
          domain.push(['team_id', '=', params.team_id]);
        }

        if (params.stage_id) {
          domain.push(['stage_id', '=', params.stage_id]);
        }

        // Convert Sydney time to UTC for date filters
        if (params.date_from) {
          domain.push(['date_closed', '>=', convertDateToUtc(params.date_from, false)]);
        }

        if (params.date_to) {
          domain.push(['date_closed', '<=', convertDateToUtc(params.date_to, true)]);
        }

        if (params.min_revenue !== undefined) {
          domain.push(['expected_revenue', '>=', params.min_revenue]);
        }

        if (params.max_revenue !== undefined) {
          domain.push(['expected_revenue', '<=', params.max_revenue]);
        }

        // Classification filters
        if (params.lead_source_id) {
          domain.push(['lead_source_id', '=', params.lead_source_id]);
        }

        if (params.sector) {
          domain.push(['sector', 'ilike', params.sector]);
        }

        if (params.specification_id) {
          domain.push(['specification_id', '=', params.specification_id]);
        }

        // State/Territory filters (direct field on crm.lead)
        if (params.state_id) {
          domain.push(['state_id', '=', params.state_id]);
        }

        if (params.state_name) {
          domain.push(['state_id.name', 'ilike', params.state_name]);
        }

        // City filter
        if (params.city) {
          domain.push(['city', 'ilike', params.city]);
        }

        // Get total count
        const total = await client.searchCount('crm.lead', domain);

        // Resolve fields from preset or custom array
        const fields = resolveFields(params.fields, 'lost', 'basic');

        // Fetch records
        const opportunities = await client.searchRead<LostOpportunity>(
          'crm.lead',
          domain,
          fields,
          {
            offset: params.offset,
            limit: params.limit,
            order: `${params.order_by} ${params.order_dir}`
          }
        );

        // Build paginated response
        const response: PaginatedResponse<LostOpportunity> = {
          total,
          count: opportunities.length,
          offset: params.offset,
          limit: params.limit,
          items: opportunities,
          has_more: total > params.offset + opportunities.length,
          next_offset: total > params.offset + opportunities.length ? params.offset + opportunities.length : undefined
        };

        const output = formatLostOpportunitiesList(response, params.response_format);

          return {
            content: [{ type: 'text', text: output }],
            structuredContent: response
          };
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error searching lost opportunities: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: Get Lost Trends
  // ============================================
  server.registerTool(
    'odoo_crm_get_lost_trends',
    {
      title: 'Get Lost Opportunity Trends',
      description: `Analyze lost opportunity trends over time for pattern identification.

Returns time-series data showing lost opportunities grouped by week, month, or quarter, with optional win/loss comparison.

**When to use:**
- Identifying seasonal patterns in lost deals
- Tracking if loss rates are improving or worsening
- Finding periods with unusual loss activity
- Correlating losses with business changes

**Insights provided:**
- Lost count and revenue per period
- Win/loss ratio trends
- Best and worst performing periods
- Most common lost reason overall`,
      inputSchema: LostTrendsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: LostTrendsInput) => {
      try {
        const client = getOdooClient();

        // Build domain for lost opportunities
        // Lost = active=False AND probability=0 (archived opportunities with 0% probability)
        const lostDomain: unknown[] = [
          ['type', '=', 'opportunity'],
          ['active', '=', false],
          ['probability', '=', 0]
        ];

        // Apply filters (convert Sydney time to UTC)
        if (params.date_from) {
          lostDomain.push(['date_closed', '>=', convertDateToUtc(params.date_from, false)]);
        }
        if (params.date_to) {
          lostDomain.push(['date_closed', '<=', convertDateToUtc(params.date_to, true)]);
        }
        if (params.user_id) {
          lostDomain.push(['user_id', '=', params.user_id]);
        }
        if (params.team_id) {
          lostDomain.push(['team_id', '=', params.team_id]);
        }

        // Helper function to get period label from date string
        const getPeriodLabel = (dateStr: string | undefined, granularity: string): string => {
          if (!dateStr) return 'Unknown';
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return 'Unknown';

          const year = date.getFullYear();
          const month = date.getMonth(); // 0-indexed

          switch (granularity) {
            case 'week': {
              // Get ISO week number
              const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
              d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
              const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
              const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
              return `${year}-W${weekNo.toString().padStart(2, '0')}`;
            }
            case 'quarter': {
              const quarter = Math.floor(month / 3) + 1;
              return `${year}-Q${quarter}`;
            }
            case 'month':
            default: {
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              return `${monthNames[month]} ${year}`;
            }
          }
        };

        // Fetch lost opportunities with date_closed, expected_revenue, and lost_reason_id
        const lostOpps = await client.searchRead<CrmLead>(
          'crm.lead',
          lostDomain,
          ['id', 'date_closed', 'expected_revenue', 'lost_reason_id'],
          { limit: 10000, order: 'date_closed desc' }
        );

        // Group lost opportunities by period
        const lostByPeriodMap = new Map<string, { count: number; revenue: number; reasons: Map<string, number> }>();

        for (const opp of lostOpps) {
          const periodLabel = getPeriodLabel(opp.date_closed, params.granularity);

          if (!lostByPeriodMap.has(periodLabel)) {
            lostByPeriodMap.set(periodLabel, { count: 0, revenue: 0, reasons: new Map() });
          }

          const periodData = lostByPeriodMap.get(periodLabel)!;
          periodData.count++;
          periodData.revenue += (opp.expected_revenue as number) || 0;

          // Track lost reasons
          if (Array.isArray(opp.lost_reason_id) && opp.lost_reason_id.length >= 2) {
            const reasonName = opp.lost_reason_id[1] as string;
            periodData.reasons.set(reasonName, (periodData.reasons.get(reasonName) || 0) + 1);
          }
        }

        // Fetch won opportunities if comparison requested (convert Sydney time to UTC)
        const wonByPeriodMap = new Map<string, { count: number; revenue: number }>();
        if (params.compare_to_won) {
          const wonDomain: unknown[] = [
            ['type', '=', 'opportunity'],
            ['probability', '=', 100]
          ];
          if (params.date_from) wonDomain.push(['date_closed', '>=', convertDateToUtc(params.date_from, false)]);
          if (params.date_to) wonDomain.push(['date_closed', '<=', convertDateToUtc(params.date_to, true)]);
          if (params.user_id) wonDomain.push(['user_id', '=', params.user_id]);
          if (params.team_id) wonDomain.push(['team_id', '=', params.team_id]);

          const wonOpps = await client.searchRead<CrmLead>(
            'crm.lead',
            wonDomain,
            ['id', 'date_closed', 'expected_revenue'],
            { limit: 10000, order: 'date_closed desc' }
          );

          for (const opp of wonOpps) {
            const periodLabel = getPeriodLabel(opp.date_closed, params.granularity);

            if (!wonByPeriodMap.has(periodLabel)) {
              wonByPeriodMap.set(periodLabel, { count: 0, revenue: 0 });
            }

            const periodData = wonByPeriodMap.get(periodLabel)!;
            periodData.count++;
            periodData.revenue += (opp.expected_revenue as number) || 0;
          }
        }

        // Process into periods array
        const periods: Array<{
          period_label: string;
          lost_count: number;
          lost_revenue: number;
          won_count?: number;
          won_revenue?: number;
          win_rate?: number;
          top_lost_reason?: string;
        }> = [];

        // Sort periods chronologically
        const sortedPeriods = Array.from(lostByPeriodMap.keys()).sort();

        for (const periodLabel of sortedPeriods) {
          const lostData = lostByPeriodMap.get(periodLabel)!;
          const wonData = wonByPeriodMap.get(periodLabel);

          // Find top lost reason for this period
          let topLostReason: string | undefined;
          let maxReasonCount = 0;
          for (const [reason, count] of lostData.reasons.entries()) {
            if (count > maxReasonCount) {
              maxReasonCount = count;
              topLostReason = reason;
            }
          }

          const wonCount = params.compare_to_won ? (wonData?.count || 0) : undefined;
          const wonRevenue = params.compare_to_won ? (wonData?.revenue || 0) : undefined;
          const winRate = params.compare_to_won && wonCount !== undefined && (lostData.count + wonCount) > 0
            ? (wonCount / (lostData.count + wonCount)) * 100
            : undefined;

          periods.push({
            period_label: periodLabel,
            lost_count: lostData.count,
            lost_revenue: lostData.revenue,
            won_count: wonCount,
            won_revenue: wonRevenue,
            win_rate: winRate,
            top_lost_reason: topLostReason
          });
        }

        // Calculate insights
        const totalLost = periods.reduce((sum, p) => sum + p.lost_count, 0);
        const totalLostRevenue = periods.reduce((sum, p) => sum + p.lost_revenue, 0);
        const avgLost = periods.length > 0 ? totalLost / periods.length : 0;
        const avgRevenue = periods.length > 0 ? totalLostRevenue / periods.length : 0;

        // Find worst and best periods
        const sortedByLost = [...periods].sort((a, b) => b.lost_count - a.lost_count);
        const worstPeriod = sortedByLost[0];
        const bestPeriod = sortedByLost[sortedByLost.length - 1];

        // Find most common reason overall
        const reasonCounts = new Map<string, number>();
        for (const [, periodData] of lostByPeriodMap) {
          for (const [reason, count] of periodData.reasons) {
            reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + count);
          }
        }
        let mostCommonReason: string | undefined;
        let maxCount = 0;
        for (const [name, count] of reasonCounts.entries()) {
          if (count > maxCount) {
            maxCount = count;
            mostCommonReason = name;
          }
        }

        const trends: LostTrendsSummary = {
          period: params.date_from || params.date_to
            ? `${params.date_from || 'Start'} to ${params.date_to || 'Now'}`
            : 'All Time',
          granularity: params.granularity,
          periods,
          avg_monthly_lost: avgLost,
          avg_monthly_revenue: avgRevenue,
          worst_period: worstPeriod ? {
            label: worstPeriod.period_label,
            lost_count: worstPeriod.lost_count,
            win_rate: worstPeriod.win_rate
          } : undefined,
          best_period: bestPeriod && bestPeriod !== worstPeriod ? {
            label: bestPeriod.period_label,
            lost_count: bestPeriod.lost_count,
            win_rate: bestPeriod.win_rate
          } : undefined,
          most_common_reason: mostCommonReason
        };

        const output = formatLostTrends(trends, params.response_format);

        return {
          content: [{ type: 'text', text: output }],
          structuredContent: trends
        };

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error fetching lost trends: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: Search Won Opportunities
  // ============================================
  server.registerTool(
    'odoo_crm_search_won_opportunities',
    {
      title: 'Search Won Opportunities',
      description: `Search and browse won opportunities with filtering and pagination.

Returns a paginated list of won opportunities with details including revenue, salesperson, and close date.

**When to use:**
- Finding specific won deals by name or contact
- Reviewing won deals for a specific salesperson or time period
- Finding the biggest deals that were won
- Analyzing successful closes`,
      inputSchema: WonOpportunitiesSearchSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: WonOpportunitiesSearchInput) => {
      try {
        return await useClient(async (client) => {
          // Build domain for won opportunities (probability = 100 or stage is_won = true)
          const domain: unknown[] = [
            ['type', '=', 'opportunity'],
            ['probability', '=', 100]
          ];

          // Apply search filters
        if (params.query) {
          domain.push(
            '|',
            '|',
            ['name', 'ilike', params.query],
            ['contact_name', 'ilike', params.query],
            ['email_from', 'ilike', params.query]
          );
        }

        if (params.user_id) {
          domain.push(['user_id', '=', params.user_id]);
        }

        if (params.team_id) {
          domain.push(['team_id', '=', params.team_id]);
        }

        if (params.stage_id) {
          domain.push(['stage_id', '=', params.stage_id]);
        }

        // Convert Sydney time to UTC for date filters
        if (params.date_from) {
          domain.push(['date_closed', '>=', convertDateToUtc(params.date_from, false)]);
        }

        if (params.date_to) {
          domain.push(['date_closed', '<=', convertDateToUtc(params.date_to, true)]);
        }

        if (params.min_revenue !== undefined) {
          domain.push(['expected_revenue', '>=', params.min_revenue]);
        }

        if (params.max_revenue !== undefined) {
          domain.push(['expected_revenue', '<=', params.max_revenue]);
        }

        // Classification filters
        if (params.lead_source_id) {
          domain.push(['lead_source_id', '=', params.lead_source_id]);
        }

        if (params.sector) {
          domain.push(['sector', 'ilike', params.sector]);
        }

        if (params.specification_id) {
          domain.push(['specification_id', '=', params.specification_id]);
        }

        // State/Territory filters (direct field on crm.lead)
        if (params.state_id) {
          domain.push(['state_id', '=', params.state_id]);
        }

        if (params.state_name) {
          domain.push(['state_id.name', 'ilike', params.state_name]);
        }

        // City filter
        if (params.city) {
          domain.push(['city', 'ilike', params.city]);
        }

        // Get total count
        const total = await client.searchCount('crm.lead', domain);

        // Resolve fields from preset or custom array
        const fields = resolveFields(params.fields, 'won', 'basic');

        // Fetch records
        const opportunities = await client.searchRead<WonOpportunity>(
          'crm.lead',
          domain,
          fields,
          {
            offset: params.offset,
            limit: params.limit,
            order: `${params.order_by} ${params.order_dir}`
          }
        );

        // Build paginated response
        const response: PaginatedResponse<WonOpportunity> = {
          total,
          count: opportunities.length,
          offset: params.offset,
          limit: params.limit,
          items: opportunities,
          has_more: total > params.offset + opportunities.length,
          next_offset: total > params.offset + opportunities.length ? params.offset + opportunities.length : undefined
        };

        const output = formatWonOpportunitiesList(response, params.response_format);

          return {
            content: [{ type: 'text', text: output }],
            structuredContent: response
          };
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error searching won opportunities: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: Get Won Analysis
  // ============================================
  server.registerTool(
    'odoo_crm_get_won_analysis',
    {
      title: 'Get Won Opportunity Analysis',
      description: `Get aggregated analytics on won opportunities - the primary tool for understanding successful deals.

Returns summary statistics including total won count and revenue, breakdown by the selected grouping, and optionally the top largest won opportunities.

**When to use:**
- Understanding what drives successful deals (group by source)
- Analyzing which salespeople have highest win rates (group by salesperson)
- Finding which stages close most deals (group by stage)
- Reviewing monthly success trends (group by month)`,
      inputSchema: WonAnalysisSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: WonAnalysisInput) => {
      try {
        const client = getOdooClient();

        // Build domain for won opportunities
        const domain: unknown[] = [
          ['type', '=', 'opportunity'],
          ['probability', '=', 100]
        ];

        // Apply filters (convert Sydney time to UTC)
        if (params.date_from) {
          domain.push(['date_closed', '>=', convertDateToUtc(params.date_from, false)]);
        }
        if (params.date_to) {
          domain.push(['date_closed', '<=', convertDateToUtc(params.date_to, true)]);
        }
        if (params.user_id) {
          domain.push(['user_id', '=', params.user_id]);
        }
        if (params.team_id) {
          domain.push(['team_id', '=', params.team_id]);
        }
        if (params.min_revenue !== undefined) {
          domain.push(['expected_revenue', '>=', params.min_revenue]);
        }

        // Get total won count and revenue
        const wonTotals = await client.readGroup(
          'crm.lead',
          domain,
          ['expected_revenue:sum', 'id:count'],
          []
        );

        const totalWon = (wonTotals[0]?.id as number) || 0;
        const totalWonRevenue = (wonTotals[0]?.expected_revenue as number) || 0;

        // Build analysis summary
        const analysis: WonAnalysisSummary = {
          period: params.date_from || params.date_to
            ? `${params.date_from || 'Start'} to ${params.date_to || 'Now'}`
            : 'All Time',
          total_won: totalWon,
          total_won_revenue: totalWonRevenue,
          avg_deal_size: totalWon > 0 ? totalWonRevenue / totalWon : 0
        };

        // Calculate average sales cycle
        const wonOppsForCycle = await client.searchRead<CrmLead>(
          'crm.lead',
          domain,
          ['create_date', 'date_closed'],
          { limit: 1000 }
        );

        let totalCycleDays = 0;
        let cycleCount = 0;
        for (const opp of wonOppsForCycle) {
          if (opp.create_date && opp.date_closed) {
            const createDate = new Date(opp.create_date);
            const closeDate = new Date(opp.date_closed);
            const days = Math.floor((closeDate.getTime() - createDate.getTime()) / (1000 * 60 * 60 * 24));
            if (days >= 0) {
              totalCycleDays += days;
              cycleCount++;
            }
          }
        }
        if (cycleCount > 0) {
          analysis.avg_sales_cycle_days = totalCycleDays / cycleCount;
        }

        // Get grouped data based on group_by parameter
        if (params.group_by === 'salesperson') {
          const byUser = await client.readGroup(
            'crm.lead',
            domain,
            ['user_id', 'expected_revenue:sum', 'id:count'],
            ['user_id']
          );

          analysis.by_salesperson = byUser.map(u => ({
            user_id: Array.isArray(u.user_id) ? u.user_id[0] : 0,
            user_name: Array.isArray(u.user_id) ? u.user_id[1] as string : 'Unassigned',
            count: (u.id as number) || 0,
            percentage: totalWon > 0 ? ((u.id as number) / totalWon) * 100 : 0,
            won_revenue: (u.expected_revenue as number) || 0,
            avg_deal: (u.id as number) > 0 ? ((u.expected_revenue as number) || 0) / (u.id as number) : 0
          })).sort((a, b) => b.count - a.count);
        }

        if (params.group_by === 'team') {
          const byTeam = await client.readGroup(
            'crm.lead',
            domain,
            ['team_id', 'expected_revenue:sum', 'id:count'],
            ['team_id']
          );

          analysis.by_team = byTeam.map(t => ({
            team_id: Array.isArray(t.team_id) ? t.team_id[0] : 0,
            team_name: Array.isArray(t.team_id) ? t.team_id[1] as string : 'No Team',
            count: (t.id as number) || 0,
            percentage: totalWon > 0 ? ((t.id as number) / totalWon) * 100 : 0,
            won_revenue: (t.expected_revenue as number) || 0,
            avg_deal: (t.id as number) > 0 ? ((t.expected_revenue as number) || 0) / (t.id as number) : 0
          })).sort((a, b) => b.count - a.count);
        }

        if (params.group_by === 'stage') {
          const byStage = await client.readGroup(
            'crm.lead',
            domain,
            ['stage_id', 'expected_revenue:sum', 'id:count'],
            ['stage_id']
          );

          analysis.by_stage = byStage.map(s => ({
            stage_id: Array.isArray(s.stage_id) ? s.stage_id[0] : 0,
            stage_name: Array.isArray(s.stage_id) ? s.stage_id[1] as string : 'Unknown',
            count: (s.id as number) || 0,
            percentage: totalWon > 0 ? ((s.id as number) / totalWon) * 100 : 0,
            won_revenue: (s.expected_revenue as number) || 0,
            avg_deal: (s.id as number) > 0 ? ((s.expected_revenue as number) || 0) / (s.id as number) : 0
          })).sort((a, b) => b.count - a.count);
        }

        if (params.group_by === 'month') {
          const byMonth = await client.readGroup(
            'crm.lead',
            domain,
            ['expected_revenue:sum', 'id:count'],
            ['date_closed:month']
          );

          analysis.by_month = byMonth.map(m => ({
            month: (m['date_closed:month'] as string) || 'Unknown',
            count: (m.id as number) || 0,
            won_revenue: (m.expected_revenue as number) || 0
          }));
        }

        if (params.group_by === 'source') {
          const bySource = await client.readGroup(
            'crm.lead',
            domain,
            ['source_id', 'expected_revenue:sum', 'id:count'],
            ['source_id']
          );

          analysis.by_source = bySource.map(s => ({
            source_id: Array.isArray(s.source_id) ? s.source_id[0] : 0,
            source_name: Array.isArray(s.source_id) ? s.source_id[1] as string : 'No Source',
            count: (s.id as number) || 0,
            percentage: totalWon > 0 ? ((s.id as number) / totalWon) * 100 : 0,
            won_revenue: (s.expected_revenue as number) || 0,
            avg_deal: (s.id as number) > 0 ? ((s.expected_revenue as number) || 0) / (s.id as number) : 0
          })).sort((a, b) => b.count - a.count);
        }

        if (params.group_by === 'sector') {
          const bySector = await client.readGroup(
            'crm.lead',
            domain,
            ['sector', 'expected_revenue:sum', 'id:count'],
            ['sector']
          );

          analysis.by_sector = bySector.map(s => ({
            sector: (s.sector as string) || 'Not Specified',
            count: (s.id as number) || 0,
            percentage: totalWon > 0 ? ((s.id as number) / totalWon) * 100 : 0,
            won_revenue: (s.expected_revenue as number) || 0,
            avg_deal: (s.id as number) > 0 ? ((s.expected_revenue as number) || 0) / (s.id as number) : 0
          })).sort((a, b) => b.count - a.count);
        }

        if (params.group_by === 'specification') {
          const bySpec = await client.readGroup(
            'crm.lead',
            domain,
            ['specification_id', 'expected_revenue:sum', 'id:count'],
            ['specification_id']
          );

          analysis.by_specification = bySpec.map(s => ({
            specification_id: Array.isArray(s.specification_id) ? s.specification_id[0] : 0,
            specification_name: Array.isArray(s.specification_id) ? s.specification_id[1] as string : 'Not Specified',
            count: (s.id as number) || 0,
            percentage: totalWon > 0 ? ((s.id as number) / totalWon) * 100 : 0,
            won_revenue: (s.expected_revenue as number) || 0,
            avg_deal: (s.id as number) > 0 ? ((s.expected_revenue as number) || 0) / (s.id as number) : 0
          })).sort((a, b) => b.count - a.count);
        }

        if (params.group_by === 'lead_source') {
          const byLeadSource = await client.readGroup(
            'crm.lead',
            domain,
            ['lead_source_id', 'expected_revenue:sum', 'id:count'],
            ['lead_source_id']
          );

          analysis.by_lead_source = byLeadSource.map(s => ({
            lead_source_id: Array.isArray(s.lead_source_id) ? s.lead_source_id[0] : 0,
            lead_source_name: Array.isArray(s.lead_source_id) ? s.lead_source_id[1] as string : 'Not Specified',
            count: (s.id as number) || 0,
            percentage: totalWon > 0 ? ((s.id as number) / totalWon) * 100 : 0,
            won_revenue: (s.expected_revenue as number) || 0,
            avg_deal: (s.id as number) > 0 ? ((s.expected_revenue as number) || 0) / (s.id as number) : 0
          })).sort((a, b) => b.count - a.count);
        }

        if (params.group_by === 'state') {
          const byState = await client.readGroup(
            'crm.lead',
            domain,
            ['state_id', 'expected_revenue:sum', 'id:count'],
            ['state_id']
          );

          analysis.by_state = byState.map(s => ({
            state_id: Array.isArray(s.state_id) ? s.state_id[0] : 0,
            state_name: Array.isArray(s.state_id) ? s.state_id[1] as string : 'Not Specified',
            count: (s.id as number) || 0,
            percentage: totalWon > 0 ? ((s.id as number) / totalWon) * 100 : 0,
            won_revenue: (s.expected_revenue as number) || 0,
            avg_deal: (s.id as number) > 0 ? ((s.expected_revenue as number) || 0) / (s.id as number) : 0
          })).sort((a, b) => b.count - a.count);
        }

        if (params.group_by === 'city') {
          const byCity = await client.readGroup(
            'crm.lead',
            domain,
            ['city', 'expected_revenue:sum', 'id:count'],
            ['city']
          );

          analysis.by_city = byCity.map(c => ({
            city: (c.city as string) || 'Not Specified',
            count: (c.id as number) || 0,
            percentage: totalWon > 0 ? ((c.id as number) / totalWon) * 100 : 0,
            won_revenue: (c.expected_revenue as number) || 0,
            avg_deal: (c.id as number) > 0 ? ((c.expected_revenue as number) || 0) / (c.id as number) : 0
          })).sort((a, b) => b.count - a.count);
        }

        // Get top won opportunities
        if (params.include_top_won > 0) {
          const topWon = await client.searchRead<WonOpportunity>(
            'crm.lead',
            domain,
            ['id', 'name', 'expected_revenue', 'user_id', 'date_closed', 'create_date'],
            { limit: params.include_top_won, order: 'expected_revenue desc' }
          );

          analysis.top_won = topWon.map(o => {
            let cycleDays: number | undefined;
            if (o.create_date && o.date_closed) {
              const createDate = new Date(o.create_date);
              const closeDate = new Date(o.date_closed);
              cycleDays = Math.floor((closeDate.getTime() - createDate.getTime()) / (1000 * 60 * 60 * 24));
            }
            return {
              id: o.id,
              name: o.name,
              revenue: o.expected_revenue || 0,
              salesperson: getRelationName(o.user_id),
              date_closed: formatDate(o.date_closed),
              sales_cycle_days: cycleDays
            };
          });
        }

        const output = formatWonAnalysis(analysis, params.group_by, params.response_format);

        return {
          content: [{ type: 'text', text: output }],
          structuredContent: analysis
        };

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error fetching won analysis: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: Get Won Trends
  // ============================================
  server.registerTool(
    'odoo_crm_get_won_trends',
    {
      title: 'Get Won Opportunity Trends',
      description: `Analyze won opportunity trends over time for pattern identification.

Returns time-series data showing won opportunities grouped by week, month, or quarter, with optional win/loss comparison.

**When to use:**
- Identifying seasonal patterns in winning deals
- Tracking if win rates are improving or worsening
- Finding periods with exceptional success
- Analyzing deal size trends over time`,
      inputSchema: WonTrendsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: WonTrendsInput) => {
      try {
        const client = getOdooClient();

        // Helper function to get period label from date string
        const getPeriodLabel = (dateStr: string | undefined, granularity: string): string => {
          if (!dateStr) return 'Unknown';
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return 'Unknown';

          const year = date.getFullYear();
          const month = date.getMonth();

          switch (granularity) {
            case 'week': {
              const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
              d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
              const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
              const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
              return `${year}-W${weekNo.toString().padStart(2, '0')}`;
            }
            case 'quarter': {
              const quarter = Math.floor(month / 3) + 1;
              return `${year}-Q${quarter}`;
            }
            case 'month':
            default: {
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              return `${monthNames[month]} ${year}`;
            }
          }
        };

        // Build domain for won opportunities (convert Sydney time to UTC)
        const wonDomain: unknown[] = [
          ['type', '=', 'opportunity'],
          ['probability', '=', 100]
        ];

        if (params.date_from) wonDomain.push(['date_closed', '>=', convertDateToUtc(params.date_from, false)]);
        if (params.date_to) wonDomain.push(['date_closed', '<=', convertDateToUtc(params.date_to, true)]);
        if (params.user_id) wonDomain.push(['user_id', '=', params.user_id]);
        if (params.team_id) wonDomain.push(['team_id', '=', params.team_id]);

        // Fetch won opportunities
        const wonOpps = await client.searchRead<CrmLead>(
          'crm.lead',
          wonDomain,
          ['id', 'date_closed', 'expected_revenue'],
          { limit: 10000, order: 'date_closed desc' }
        );

        // Group won opportunities by period
        const wonByPeriodMap = new Map<string, { count: number; revenue: number }>();

        for (const opp of wonOpps) {
          const periodLabel = getPeriodLabel(opp.date_closed, params.granularity);

          if (!wonByPeriodMap.has(periodLabel)) {
            wonByPeriodMap.set(periodLabel, { count: 0, revenue: 0 });
          }

          const periodData = wonByPeriodMap.get(periodLabel)!;
          periodData.count++;
          periodData.revenue += (opp.expected_revenue as number) || 0;
        }

        // Fetch lost opportunities if comparison requested (convert Sydney time to UTC)
        // Lost = active=False AND probability=0 (archived opportunities with 0% probability)
        const lostByPeriodMap = new Map<string, { count: number; revenue: number }>();
        if (params.compare_to_lost) {
          const lostDomain: unknown[] = [
            ['type', '=', 'opportunity'],
            ['active', '=', false],
            ['probability', '=', 0]
          ];
          if (params.date_from) lostDomain.push(['date_closed', '>=', convertDateToUtc(params.date_from, false)]);
          if (params.date_to) lostDomain.push(['date_closed', '<=', convertDateToUtc(params.date_to, true)]);
          if (params.user_id) lostDomain.push(['user_id', '=', params.user_id]);
          if (params.team_id) lostDomain.push(['team_id', '=', params.team_id]);

          const lostOpps = await client.searchRead<CrmLead>(
            'crm.lead',
            lostDomain,
            ['id', 'date_closed', 'expected_revenue'],
            { limit: 10000, order: 'date_closed desc' }
          );

          for (const opp of lostOpps) {
            const periodLabel = getPeriodLabel(opp.date_closed, params.granularity);

            if (!lostByPeriodMap.has(periodLabel)) {
              lostByPeriodMap.set(periodLabel, { count: 0, revenue: 0 });
            }

            const periodData = lostByPeriodMap.get(periodLabel)!;
            periodData.count++;
            periodData.revenue += (opp.expected_revenue as number) || 0;
          }
        }

        // Process into periods array
        const periods: Array<{
          period_label: string;
          won_count: number;
          won_revenue: number;
          lost_count?: number;
          lost_revenue?: number;
          win_rate?: number;
          avg_deal_size: number;
        }> = [];

        const sortedPeriods = Array.from(wonByPeriodMap.keys()).sort();

        for (const periodLabel of sortedPeriods) {
          const wonData = wonByPeriodMap.get(periodLabel)!;
          const lostData = lostByPeriodMap.get(periodLabel);

          const lostCount = params.compare_to_lost ? (lostData?.count || 0) : undefined;
          const lostRevenue = params.compare_to_lost ? (lostData?.revenue || 0) : undefined;
          const winRate = params.compare_to_lost && lostCount !== undefined && (wonData.count + lostCount) > 0
            ? (wonData.count / (wonData.count + lostCount)) * 100
            : undefined;

          periods.push({
            period_label: periodLabel,
            won_count: wonData.count,
            won_revenue: wonData.revenue,
            lost_count: lostCount,
            lost_revenue: lostRevenue,
            win_rate: winRate,
            avg_deal_size: wonData.count > 0 ? wonData.revenue / wonData.count : 0
          });
        }

        // Calculate insights
        const totalWon = periods.reduce((sum, p) => sum + p.won_count, 0);
        const totalWonRevenue = periods.reduce((sum, p) => sum + p.won_revenue, 0);
        const avgWon = periods.length > 0 ? totalWon / periods.length : 0;
        const avgRevenue = periods.length > 0 ? totalWonRevenue / periods.length : 0;

        // Find best and worst periods
        const sortedByWon = [...periods].sort((a, b) => b.won_count - a.won_count);
        const bestPeriod = sortedByWon[0];
        const worstPeriod = sortedByWon[sortedByWon.length - 1];

        // Calculate deal size trend
        let avgDealSizeTrend: 'increasing' | 'decreasing' | 'stable' | undefined;
        if (periods.length >= 2) {
          const firstHalf = periods.slice(0, Math.floor(periods.length / 2));
          const secondHalf = periods.slice(Math.floor(periods.length / 2));
          const firstHalfAvg = firstHalf.reduce((sum, p) => sum + p.avg_deal_size, 0) / firstHalf.length;
          const secondHalfAvg = secondHalf.reduce((sum, p) => sum + p.avg_deal_size, 0) / secondHalf.length;
          const changePercent = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
          if (changePercent > 10) avgDealSizeTrend = 'increasing';
          else if (changePercent < -10) avgDealSizeTrend = 'decreasing';
          else avgDealSizeTrend = 'stable';
        }

        const trends: WonTrendsSummary = {
          period: params.date_from || params.date_to
            ? `${params.date_from || 'Start'} to ${params.date_to || 'Now'}`
            : 'All Time',
          granularity: params.granularity,
          periods,
          avg_period_won: avgWon,
          avg_period_revenue: avgRevenue,
          best_period: bestPeriod ? {
            label: bestPeriod.period_label,
            won_count: bestPeriod.won_count,
            won_revenue: bestPeriod.won_revenue,
            win_rate: bestPeriod.win_rate
          } : undefined,
          worst_period: worstPeriod && worstPeriod !== bestPeriod ? {
            label: worstPeriod.period_label,
            won_count: worstPeriod.won_count,
            won_revenue: worstPeriod.won_revenue,
            win_rate: worstPeriod.win_rate
          } : undefined,
          avg_deal_size_trend: avgDealSizeTrend
        };

        const output = formatWonTrends(trends, params.response_format);

        return {
          content: [{ type: 'text', text: output }],
          structuredContent: trends
        };

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error fetching won trends: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: List Salespeople
  // ============================================
  server.registerTool(
    'odoo_crm_list_salespeople',
    {
      title: 'List Salespeople',
      description: `Retrieve all salespeople (users) who have CRM opportunities assigned.

Returns a list of users with their IDs and optionally their opportunity statistics.

**When to use:**
- Getting user IDs for filtering other queries
- Comparing salesperson workload
- Finding active salespeople in CRM`,
      inputSchema: SalespeopleListSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: SalespeopleListInput) => {
      try {
        const client = getOdooClient();

        // Get all users who have opportunities assigned
        const userStats = await client.readGroup(
          'crm.lead',
          [['user_id', '!=', false], ['type', '=', 'opportunity'], ['active', '=', true]],
          ['user_id', 'expected_revenue:sum', 'id:count'],
          ['user_id']
        );

        // Get won stats
        const wonStats = await client.readGroup(
          'crm.lead',
          [['user_id', '!=', false], ['probability', '=', 100]],
          ['user_id', 'expected_revenue:sum', 'id:count'],
          ['user_id']
        );

        const salespeople: SalespersonWithStats[] = [];

        for (const stat of userStats) {
          if (!Array.isArray(stat.user_id)) continue;

          const userId = stat.user_id[0];
          const userName = stat.user_id[1] as string;

          const wonStat = wonStats.find(w => Array.isArray(w.user_id) && w.user_id[0] === userId);

          const spWithStats: SalespersonWithStats = {
            user_id: userId,
            name: userName
          };

          if (params.include_stats) {
            spWithStats.opportunity_count = (stat.id as number) || 0;
            spWithStats.active_revenue = (stat.expected_revenue as number) || 0;
            spWithStats.won_count = (wonStat?.id as number) || 0;
            spWithStats.won_revenue = (wonStat?.expected_revenue as number) || 0;
          }

          salespeople.push(spWithStats);
        }

        // Sort by opportunity count
        salespeople.sort((a, b) => (b.opportunity_count || 0) - (a.opportunity_count || 0));

        const output = formatSalespeopleList(salespeople, params.response_format);

        return {
          content: [{ type: 'text', text: output }],
          structuredContent: { salespeople }
        };

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error fetching salespeople: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: List Teams
  // ============================================
  server.registerTool(
    'odoo_crm_list_teams',
    {
      title: 'List Sales Teams',
      description: `Retrieve all sales teams with their statistics.

Returns a list of teams with their IDs and optionally member count and opportunity statistics.

**When to use:**
- Getting team IDs for filtering other queries
- Comparing team performance
- Understanding team structure`,
      inputSchema: TeamsListSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: TeamsListInput) => {
      try {
        const client = getOdooClient();

        // Get all teams (cached for 15 minutes)
        const teamsData = await client.getTeamsCached();

        const teams: SalesTeamWithStats[] = [];

        if (params.include_stats) {
          // Get opportunity stats per team
          const teamStats = await client.readGroup(
            'crm.lead',
            [['team_id', '!=', false], ['type', '=', 'opportunity'], ['active', '=', true]],
            ['team_id', 'expected_revenue:sum', 'id:count'],
            ['team_id']
          );

          // Get won stats per team
          const wonStats = await client.readGroup(
            'crm.lead',
            [['team_id', '!=', false], ['probability', '=', 100]],
            ['team_id', 'expected_revenue:sum', 'id:count'],
            ['team_id']
          );

          for (const team of teamsData) {
            const stat = teamStats.find(s => Array.isArray(s.team_id) && s.team_id[0] === team.id);
            const wonStat = wonStats.find(w => Array.isArray(w.team_id) && w.team_id[0] === team.id);

            teams.push({
              team_id: team.id,
              name: team.name,
              member_count: team.member_ids?.length,
              opportunity_count: (stat?.id as number) || 0,
              total_pipeline_revenue: (stat?.expected_revenue as number) || 0,
              won_count: (wonStat?.id as number) || 0,
              won_revenue: (wonStat?.expected_revenue as number) || 0
            });
          }
        } else {
          for (const team of teamsData) {
            teams.push({
              team_id: team.id,
              name: team.name,
              member_count: team.member_ids?.length
            });
          }
        }

        // Sort by opportunity count
        teams.sort((a, b) => (b.opportunity_count || 0) - (a.opportunity_count || 0));

        const output = formatTeamsList(teams, params.response_format);

        return {
          content: [{ type: 'text', text: output }],
          structuredContent: { teams }
        };

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error fetching teams: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: Compare Performance
  // ============================================
  server.registerTool(
    'odoo_crm_compare_performance',
    {
      title: 'Compare Performance',
      description: `Compare performance between salespeople, teams, or time periods.

Returns side-by-side comparison of key metrics including won count, revenue, win rate, and sales cycle.

**When to use:**
- Comparing salespeople against each other
- Comparing team performance
- Analyzing period-over-period changes
- Benchmarking against averages`,
      inputSchema: ComparePerformanceSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: ComparePerformanceInput) => {
      try {
        const client = getOdooClient();

        const comparison: PerformanceComparison = {
          compare_type: params.compare_type
        };

        if (params.compare_type === 'periods') {
          // Period comparison
          if (!params.period1_start || !params.period1_end || !params.period2_start || !params.period2_end) {
            return {
              isError: true,
              content: [{ type: 'text', text: 'Period comparison requires period1_start, period1_end, period2_start, and period2_end' }]
            };
          }

          const getMetricsForPeriod = async (start: string, end: string) => {
            const wonDomain: unknown[] = [
              ['probability', '=', 100],
              ['date_closed', '>=', start],
              ['date_closed', '<=', end]
            ];
            // Lost = active=False AND probability=0 (archived opportunities with 0% probability)
            const lostDomain: unknown[] = [
              ['active', '=', false],
              ['probability', '=', 0],
              ['date_closed', '>=', start],
              ['date_closed', '<=', end]
            ];

            const wonTotals = await client.readGroup('crm.lead', wonDomain, ['expected_revenue:sum', 'id:count'], []);
            const lostTotals = await client.readGroup('crm.lead', lostDomain, ['id:count'], []);

            const wonCount = (wonTotals[0]?.id as number) || 0;
            const wonRevenue = (wonTotals[0]?.expected_revenue as number) || 0;
            const lostCount = (lostTotals[0]?.id as number) || 0;
            const winRate = (wonCount + lostCount) > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0;

            // Get cycle days
            const wonOpps = await client.searchRead<CrmLead>(
              'crm.lead',
              wonDomain,
              ['create_date', 'date_closed'],
              { limit: 500 }
            );
            let totalCycle = 0, cycleCount = 0;
            for (const opp of wonOpps) {
              if (opp.create_date && opp.date_closed) {
                const days = Math.floor((new Date(opp.date_closed).getTime() - new Date(opp.create_date).getTime()) / (1000 * 60 * 60 * 24));
                if (days >= 0) { totalCycle += days; cycleCount++; }
              }
            }

            return {
              won_count: wonCount,
              won_revenue: wonRevenue,
              win_rate: winRate,
              avg_deal_size: wonCount > 0 ? wonRevenue / wonCount : 0,
              avg_cycle_days: cycleCount > 0 ? totalCycle / cycleCount : 0
            };
          };

          // Convert Sydney time to UTC for date filters
          const p1Metrics = await getMetricsForPeriod(
            convertDateToUtc(params.period1_start, false),
            convertDateToUtc(params.period1_end, true)
          );
          const p2Metrics = await getMetricsForPeriod(
            convertDateToUtc(params.period2_start, false),
            convertDateToUtc(params.period2_end, true)
          );

          comparison.periods = [
            { label: `${params.period1_start} to ${params.period1_end}`, start: params.period1_start, end: params.period1_end, ...p1Metrics },
            { label: `${params.period2_start} to ${params.period2_end}`, start: params.period2_start, end: params.period2_end, ...p2Metrics }
          ];

          // Calculate changes
          comparison.period_change = {
            won_count_change: p1Metrics.won_count > 0 ? ((p2Metrics.won_count - p1Metrics.won_count) / p1Metrics.won_count) * 100 : 0,
            won_revenue_change: p1Metrics.won_revenue > 0 ? ((p2Metrics.won_revenue - p1Metrics.won_revenue) / p1Metrics.won_revenue) * 100 : 0,
            win_rate_change: p2Metrics.win_rate - p1Metrics.win_rate,
            avg_deal_size_change: p1Metrics.avg_deal_size > 0 ? ((p2Metrics.avg_deal_size - p1Metrics.avg_deal_size) / p1Metrics.avg_deal_size) * 100 : 0,
            avg_cycle_days_change: p1Metrics.avg_cycle_days > 0 ? ((p2Metrics.avg_cycle_days - p1Metrics.avg_cycle_days) / p1Metrics.avg_cycle_days) * 100 : 0
          };

        } else {
          // Salespeople or Teams comparison
          const groupField = params.compare_type === 'salespeople' ? 'user_id' : 'team_id';

          // Get won stats
          const wonStats = await client.readGroup(
            'crm.lead',
            [[groupField, '!=', false], ['probability', '=', 100]],
            [groupField, 'expected_revenue:sum', 'id:count'],
            [groupField]
          );

          // Get lost stats (active=False AND probability=0)
          const lostStats = await client.readGroup(
            'crm.lead',
            [[groupField, '!=', false], ['active', '=', false], ['probability', '=', 0]],
            [groupField, 'id:count'],
            [groupField]
          );

          const entities: Array<{
            id: number;
            name: string;
            won_count: number;
            won_revenue: number;
            win_rate: number;
            avg_deal_size: number;
            avg_cycle_days: number;
          }> = [];

          for (const stat of wonStats) {
            const fieldValue = stat[groupField];
            if (!Array.isArray(fieldValue)) continue;

            // Filter by entity_ids if specified
            if (params.entity_ids && params.entity_ids.length > 0 && !params.entity_ids.includes(fieldValue[0])) {
              continue;
            }

            const lostStat = lostStats.find(l => {
              const lf = l[groupField];
              return Array.isArray(lf) && lf[0] === fieldValue[0];
            });

            const wonCount = (stat.id as number) || 0;
            const lostCount = (lostStat?.id as number) || 0;

            entities.push({
              id: fieldValue[0],
              name: fieldValue[1] as string,
              won_count: wonCount,
              won_revenue: (stat.expected_revenue as number) || 0,
              win_rate: (wonCount + lostCount) > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0,
              avg_deal_size: wonCount > 0 ? ((stat.expected_revenue as number) || 0) / wonCount : 0,
              avg_cycle_days: 0 // Would need additional query to calculate
            });
          }

          comparison.entities = entities.sort((a, b) => b.won_revenue - a.won_revenue);

          // Calculate benchmarks
          if (entities.length > 0) {
            comparison.benchmarks = {
              avg_won_count: entities.reduce((s, e) => s + e.won_count, 0) / entities.length,
              avg_won_revenue: entities.reduce((s, e) => s + e.won_revenue, 0) / entities.length,
              avg_win_rate: entities.reduce((s, e) => s + e.win_rate, 0) / entities.length,
              avg_deal_size: entities.reduce((s, e) => s + e.avg_deal_size, 0) / entities.length,
              avg_cycle_days: entities.reduce((s, e) => s + e.avg_cycle_days, 0) / entities.length
            };
          }
        }

        const output = formatPerformanceComparison(comparison, params.response_format);

        return {
          content: [{ type: 'text', text: output }],
          structuredContent: comparison
        };

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error comparing performance: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: Search Activities
  // ============================================
  server.registerTool(
    'odoo_crm_search_activities',
    {
      title: 'Search CRM Activities',
      description: `Search and list individual CRM activities (calls, meetings, tasks, emails).

Returns a paginated list of activities with details including type, due date, status, and linked opportunity.

**When to use:**
- Finding specific activities by type or status
- Reviewing overdue activities
- Checking upcoming activities for a user
- Finding activities linked to a specific opportunity`,
      inputSchema: ActivitySearchSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: ActivitySearchInput) => {
      try {
        return await useClient(async (client) => {
          const today = new Date().toISOString().split('T')[0];

          // Build domain
          const domain: unknown[] = [['res_model', '=', 'crm.lead']];

        if (params.user_id) {
          domain.push(['user_id', '=', params.user_id]);
        }

        if (params.lead_id) {
          domain.push(['res_id', '=', params.lead_id]);
        }

        // Convert Sydney time to UTC for date filters (applies to date_deadline for consistency)
        if (params.date_from) {
          domain.push(['date_deadline', '>=', convertDateToUtc(params.date_from, false)]);
        }

        if (params.date_to) {
          domain.push(['date_deadline', '<=', convertDateToUtc(params.date_to, true)]);
        }

        // Activity type filter
        if (params.activity_type !== 'all') {
          domain.push(['activity_type_id.name', 'ilike', params.activity_type]);
        }

        // Status filter
        if (params.status !== 'all') {
          if (params.status === 'overdue') {
            domain.push(['date_deadline', '<', today]);
          } else if (params.status === 'today') {
            domain.push(['date_deadline', '=', today]);
          } else if (params.status === 'upcoming') {
            domain.push(['date_deadline', '>', today]);
          }
          // 'done' status would require checking activity state
        }

        // Get total count
        const total = await client.searchCount('mail.activity', domain);

        // Resolve fields from preset or custom array
        const fields = resolveFields(params.fields, 'activity', 'basic');

        // Fetch activities
        const activities = await client.searchRead<ActivityDetail>(
          'mail.activity',
          domain,
          fields,
          {
            offset: params.offset,
            limit: params.limit,
            order: 'date_deadline asc'
          }
        );

        // Calculate status for each activity
        for (const activity of activities) {
          if (activity.date_deadline) {
            if (activity.date_deadline < today) {
              activity.activity_status = 'overdue';
            } else if (activity.date_deadline === today) {
              activity.activity_status = 'today';
            } else {
              activity.activity_status = 'upcoming';
            }
          }
        }

        const response: PaginatedResponse<ActivityDetail> = {
          total,
          count: activities.length,
          offset: params.offset,
          limit: params.limit,
          items: activities,
          has_more: total > params.offset + activities.length,
          next_offset: total > params.offset + activities.length ? params.offset + activities.length : undefined
        };

        const output = formatActivityList(response, params.response_format);

          return {
            content: [{ type: 'text', text: output }],
            structuredContent: response
          };
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error searching activities: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: Export Data (file-based, supports XLSX/CSV/JSON)
  // ============================================
  server.registerTool(
    'odoo_crm_export_data',
    {
      title: 'Export CRM Data',
      description: `Export CRM data to Excel (XLSX), CSV, or JSON files.

**Formats:**
- **xlsx** (default): Excel format - compressed, opens directly in Excel/Power BI
- **csv**: Comma-separated values - universal compatibility
- **json**: Structured data for programmatic use

**Features:**
- Exports up to ${EXPORT_CONFIG.MAX_EXPORT_RECORDS.toLocaleString()} records
- Large exports are fetched in batches (no timeout issues)
- Files written directly to disk (fast, no size limits)

**When to use:**
- Exporting leads/contacts for external analysis
- Creating reports for stakeholders
- Backing up CRM data
- Integrating with other systems like Power BI

**Best Practices:**
- Use filters to focus on relevant data
- XLSX format is recommended for Excel users (smaller files)`,
      inputSchema: ExportDataSchema,
      annotations: {
        readOnlyHint: false,  // Creates files
        destructiveHint: false,
        idempotentHint: false,  // Creates new file each time
        openWorldHint: true
      }
    },
    async (params: ExportDataInput) => {
      const startTime = Date.now();

      try {
        const client = getOdooClient();

        let model: string;
        let domain: unknown[] = [];
        let fields: string[];

        // Configure based on export type
        switch (params.export_type) {
          case 'leads':
            model = 'crm.lead';
            domain = [['type', '=', 'opportunity'], ['active', '=', true]];
            fields = params.fields || CRM_FIELDS.LEAD_LIST_EXTENDED;
            break;
          case 'won':
            model = 'crm.lead';
            domain = [['probability', '=', 100]];
            fields = params.fields || CRM_FIELDS.WON_OPPORTUNITY_DETAIL;
            break;
          case 'lost':
            // Lost = active=False AND probability=0 (archived opportunities with 0% probability)
            model = 'crm.lead';
            domain = [['active', '=', false], ['probability', '=', 0]];
            fields = params.fields || CRM_FIELDS.LOST_OPPORTUNITY_DETAIL;
            break;
          case 'contacts':
            model = 'res.partner';
            domain = [];
            fields = params.fields || CRM_FIELDS.CONTACT_LIST;
            break;
          case 'activities':
            model = 'mail.activity';
            domain = [['res_model', '=', 'crm.lead']];
            fields = params.fields || CRM_FIELDS.ACTIVITY_DETAIL;
            break;
          default:
            return {
              isError: true,
              content: [{ type: 'text', text: `Unknown export type: ${params.export_type}` }]
            };
        }

        // Apply filters (convert Sydney time to UTC for date filters)
        if (params.filters) {
          if (params.filters.user_id) domain.push(['user_id', '=', params.filters.user_id]);
          if (params.filters.team_id) domain.push(['team_id', '=', params.filters.team_id]);
          if (params.filters.stage_id) domain.push(['stage_id', '=', params.filters.stage_id]);
          if (params.filters.date_from) domain.push(['create_date', '>=', convertDateToUtc(params.filters.date_from, false)]);
          if (params.filters.date_to) domain.push(['create_date', '<=', convertDateToUtc(params.filters.date_to, true)]);
          if (params.filters.min_revenue !== undefined) domain.push(['expected_revenue', '>=', params.filters.min_revenue]);
          if (params.filters.max_revenue !== undefined) domain.push(['expected_revenue', '<=', params.filters.max_revenue]);
          if (params.filters.query) {
            domain.push('|', '|', ['name', 'ilike', params.filters.query], ['contact_name', 'ilike', params.filters.query], ['email_from', 'ilike', params.filters.query]);
          }
          // State/Territory filters
          if (params.filters.state_id) domain.push(['state_id', '=', params.filters.state_id]);
          if (params.filters.state_name) domain.push(['state_id.name', 'ilike', params.filters.state_name]);
          // City filter
          if (params.filters.city) domain.push(['city', 'ilike', params.filters.city]);
        }

        // Setup export
        const format = params.format as ExportFormat;
        const outputDir = getOutputDirectory(params.output_directory);
        const filename = generateExportFilename(params.export_type, params.filename);

        // Initialize the export writer
        const writer = new ExportWriter({
          format,
          outputDir,
          filename,
          fields,
        });

        try {
          await writer.initialize();

          // Fetch records in batches with progress tracking
          const { records, totalFetched, totalAvailable } = await client.searchReadPaginated<OdooRecord>(
            model,
            domain,
            fields,
            {
              maxRecords: params.max_records,
              batchSize: EXPORT_CONFIG.BATCH_SIZE,
              order: 'id desc',
              onProgress: (progress) => {
                // Log progress to stderr (doesn't interfere with MCP protocol)
                console.error(`Export progress: ${progress.percent_complete}% (${progress.records_exported}/${progress.total_records})`);
              },
            }
          );

          // Write all records
          await writer.writeBatch(records);

          // Finalize and get file info
          const { filePath, sizeBytes } = await writer.finalize();

          const duration = Date.now() - startTime;

          // Build result
          const result: ExportResult = {
            success: true,
            filename: `${filename}.${format}`,
            file_path: filePath,
            record_count: totalFetched,
            total_available: totalAvailable,
            size_bytes: sizeBytes,
            format,
            mime_type: getMimeType(format),
            export_duration_ms: duration,
            warning: totalFetched < totalAvailable
              ? `Exported ${totalFetched.toLocaleString()} of ${totalAvailable.toLocaleString()} available records. Increase max_records or add filters to export more.`
              : undefined,
            instructions: `File exported successfully to: ${filePath}`,
          };

          const output = formatExportResult(result, ResponseFormat.MARKDOWN);

          return {
            content: [{ type: 'text', text: output }],
            structuredContent: result
          };

        } catch (error) {
          // Clean up partial file on error
          await writer.cleanup();
          throw error;
        }

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error exporting data: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: Cache Management
  // ============================================
  server.registerTool(
    'odoo_crm_cache_status',
    {
      title: 'Cache Status & Management',
      description: `View cache statistics and optionally clear cached data.

The server caches frequently accessed, rarely-changing data to improve performance:
- **Stages** (30 min TTL): Pipeline stages
- **Lost Reasons** (30 min TTL): Lost reason options
- **Teams** (15 min TTL): Sales teams
- **Salespeople** (15 min TTL): User list

**When to use:**
- Check what data is currently cached
- Force refresh of cached data if it seems stale
- Troubleshoot issues where data changes aren't reflected

**Note:** Cache is automatically refreshed when TTL expires. Manual clearing is rarely needed.`,
      inputSchema: CacheStatusSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: CacheStatusInput) => {
      try {
        const client = getOdooClient();

        if (params.action === 'clear') {
          // Clear specific cache type or all
          if (params.cache_type === 'all') {
            await client.invalidateCache();
            return {
              content: [{ type: 'text', text: '## Cache Cleared\n\nAll cached data has been invalidated. Next API calls will fetch fresh data from Odoo.' }]
            };
          } else {
            // Map cache_type to cache key
            const keyMap: Record<string, string | undefined> = {
              stages: CACHE_KEYS.stages(),
              lost_reasons: CACHE_KEYS.lostReasons(false),
              teams: CACHE_KEYS.teams(),
              salespeople: CACHE_KEYS.salespeople()
            };

            const cacheKey = keyMap[params.cache_type];
            if (cacheKey) {
              await cache.delete(cacheKey);
              // Also clear with different params if applicable
              if (params.cache_type === 'lost_reasons') {
                await cache.delete(CACHE_KEYS.lostReasons(true));
              }
              return {
                content: [{ type: 'text', text: `## Cache Cleared\n\n**${params.cache_type}** cache has been invalidated. Next call will fetch fresh data from Odoo.` }]
              };
            }
          }
        }

        // Return cache status
        const stats = await client.getCacheStats();

        let output = '## Cache Status\n\n';
        output += `**Total cached entries:** ${stats.size}\n\n`;

        // Add hit/miss metrics section
        output += '### Performance Metrics\n';
        output += `- **Cache hits:** ${stats.metrics.hits}\n`;
        output += `- **Cache misses:** ${stats.metrics.misses}\n`;
        output += `- **Hit rate:** ${stats.metrics.hitRate}%\n`;

        // Add helpful interpretation
        if (stats.metrics.hits + stats.metrics.misses > 0) {
          if (stats.metrics.hitRate >= 80) {
            output += '\n*Excellent cache efficiency - most requests served from cache.*\n';
          } else if (stats.metrics.hitRate >= 50) {
            output += '\n*Good cache efficiency - cache is saving many API calls.*\n';
          } else if (stats.metrics.hitRate > 0) {
            output += '\n*Low hit rate - cache may be expiring frequently or data is accessed once.*\n';
          } else {
            output += '\n*No cache hits yet - data will be cached on first access.*\n';
          }
        } else {
          output += '\n*No cache requests yet.*\n';
        }
        output += '\n';

        if (stats.size === 0) {
          output += '### Cached Data:\n';
          output += '*Cache is empty. Data will be fetched from Odoo on next request.*\n';
        } else {
          output += '### Cached Data:\n';
          for (const key of stats.keys) {
            // Parse the key to provide friendly name
            let friendlyName = key;
            if (key.startsWith('crm:stages')) friendlyName = 'Pipeline Stages';
            else if (key.startsWith('crm:lost_reasons')) friendlyName = `Lost Reasons (${key.includes('true') ? 'including inactive' : 'active only'})`;
            else if (key.startsWith('crm:teams')) friendlyName = 'Sales Teams';
            else if (key.startsWith('crm:salespeople')) friendlyName = key.includes('team:') ? `Salespeople (team ${key.split(':').pop()})` : 'All Salespeople';

            output += `- ${friendlyName}\n`;
          }
          output += '\n*Cache entries automatically expire. Use action="clear" to force refresh.*\n';
        }

        return {
          content: [{ type: 'text', text: output }],
          structuredContent: {
            cache_size: stats.size,
            cached_keys: stats.keys,
            metrics: {
              hits: stats.metrics.hits,
              misses: stats.metrics.misses,
              hit_rate_percent: stats.metrics.hitRate
            }
          }
        };

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error accessing cache: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: List Available Fields (Discovery)
  // ============================================
  server.registerTool(
    'odoo_crm_list_fields',
    {
      title: 'List Available Fields',
      description: `Discover available fields for Odoo CRM models.

Use this tool BEFORE making search requests to know what fields/columns are available for selection.

**Common models:**
- **crm.lead**: Leads and opportunities (most common)
- **res.partner**: Contacts and companies
- **mail.activity**: Activities (calls, meetings, tasks)
- **crm.stage**: Pipeline stages
- **crm.lost.reason**: Lost reasons

**Field presets (use in 'fields' parameter of search tools):**
- **basic**: Minimal fields for fast list views (default)
- **extended**: Includes address, source, tags
- **full**: All fields for detailed views

Returns field names you can use in the 'fields' parameter of search tools.`,
      inputSchema: ListFieldsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: ListFieldsInput) => {
      try {
        const client = getOdooClient();

        // Get field metadata from Odoo using fieldsGet
        const fieldsInfo = await client.fieldsGet(
          params.model,
          ['string', 'type', 'required', 'readonly', 'relation', 'help']
        );

        // Process and filter fields
        const fieldList: FieldInfo[] = [];

        for (const [fieldName, metadata] of Object.entries(fieldsInfo)) {
          const meta = metadata as Record<string, unknown>;
          const fieldType = meta.type as string;

          // Apply filter
          if (params.filter !== 'all') {
            const isRelational = ['many2one', 'many2many', 'one2many'].includes(fieldType);
            const isRequired = meta.required === true;

            if (params.filter === 'relational' && !isRelational) continue;
            if (params.filter === 'basic' && isRelational) continue;
            if (params.filter === 'required' && !isRequired) continue;
          }

          const fieldInfo: FieldInfo = {
            name: fieldName,
            label: (meta.string as string) || fieldName,
            type: fieldType,
            required: (meta.required as boolean) || false
          };

          // Add description if requested and available
          if (params.include_descriptions && meta.help) {
            fieldInfo.description = meta.help as string;
          }

          fieldList.push(fieldInfo);
        }

        // Sort alphabetically by name
        fieldList.sort((a, b) => a.name.localeCompare(b.name));

        // Determine model type for presets
        const modelTypeMap: Record<string, 'lead' | 'contact' | 'activity'> = {
          'crm.lead': 'lead',
          'res.partner': 'contact',
          'mail.activity': 'activity'
        };
        const modelType = modelTypeMap[params.model];

        // Format output using the formatter
        const output = formatFieldsList(
          params.model,
          fieldList,
          params.response_format,
          modelType
        );

        // Build structured content for JSON
        const structuredContent: {
          model: string;
          field_count: number;
          fields: FieldInfo[];
          presets?: string[];
        } = {
          model: params.model,
          field_count: fieldList.length,
          fields: fieldList
        };

        if (modelType && FIELD_PRESETS[modelType]) {
          structuredContent.presets = Object.keys(FIELD_PRESETS[modelType]);
        }

        return {
          content: [{ type: 'text', text: output }],
          structuredContent
        };

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error listing fields: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: Health Check
  // ============================================
  server.registerTool(
    'odoo_crm_health_check',
    {
      title: 'Health Check',
      description: `Check Odoo CRM connectivity and server health.

Verifies that the MCP server can connect to Odoo, measures API latency, and reports cache and circuit breaker statistics.

**When to use:**
- Debugging connection issues
- Verifying Odoo is accessible
- Monitoring server health
- Checking cache performance
- Viewing circuit breaker state

Returns: status (healthy/unhealthy), odoo_connected, latency_ms, cache_entries, cache_hit_rate, circuit_breaker_state`,
      inputSchema: HealthCheckSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: HealthCheckInput) => {
      const result: {
        status: 'healthy' | 'unhealthy';
        odoo_connected: boolean;
        latency_ms: number | null;
        cache_entries: number;
        cache_hit_rate: number;
        circuit_breaker: {
          state: string;
          failure_count: number;
          seconds_until_retry: number | null;
        };
        pool: {
          size: number;
          available: number;
          borrowed: number;
          pending: number;
          min: number;
          max: number;
        };
        error?: string;
        odoo_url?: string;
        odoo_database?: string;
        timestamp: string;
      } = {
        status: 'unhealthy',
        odoo_connected: false,
        latency_ms: null,
        cache_entries: 0,
        cache_hit_rate: 0,
        circuit_breaker: {
          state: 'UNKNOWN',
          failure_count: 0,
          seconds_until_retry: null
        },
        pool: {
          size: 0,
          available: 0,
          borrowed: 0,
          pending: 0,
          min: 0,
          max: 0
        },
        timestamp: new Date().toISOString()
      };

      try {
        const client = getOdooClient();

        // Get cache stats first (always works)
        const cacheStats = await client.getCacheStats();
        result.cache_entries = cacheStats.size;
        result.cache_hit_rate = cacheStats.metrics.hitRate;

        // Get connection pool metrics
        const poolMetrics = getPoolMetrics();
        result.pool = {
          size: poolMetrics.size,
          available: poolMetrics.available,
          borrowed: poolMetrics.borrowed,
          pending: poolMetrics.pending,
          min: poolMetrics.min,
          max: poolMetrics.max
        };

        // Get circuit breaker metrics
        const cbMetrics = client.getCircuitBreakerMetrics();
        result.circuit_breaker = {
          state: cbMetrics.state,
          failure_count: cbMetrics.failureCount,
          seconds_until_retry: cbMetrics.secondsUntilHalfOpen
        };

        // Reset UID to force fresh authentication test
        client.resetAuthCache();

        // Measure authentication latency (5 second timeout)
        const startTime = Date.now();
        try {
          await withTimeout(
            client.authenticate(),
            TIMEOUTS.HEALTH_CHECK,
            'Odoo health check timed out'
          );
          const endTime = Date.now();

          result.status = 'healthy';
          result.odoo_connected = true;
          result.latency_ms = endTime - startTime;
          result.odoo_url = process.env.ODOO_URL || 'not configured';
          result.odoo_database = process.env.ODOO_DB || 'not configured';

        } catch (authError) {
          result.odoo_connected = false;
          result.latency_ms = Date.now() - startTime;

          if (authError instanceof TimeoutError) {
            result.error = `Connection timed out after ${TIMEOUTS.HEALTH_CHECK}ms`;
          } else {
            result.error = authError instanceof Error ? authError.message : 'Unknown authentication error';
          }
        }

      } catch (error) {
        result.error = error instanceof Error ? error.message : 'Unknown error';
      }

      // Format output
      if (params.response_format === ResponseFormat.JSON) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          structuredContent: result
        };
      }

      // Markdown format
      let output = `## Health Check\n\n`;
      output += `**Status:** ${result.status === 'healthy' ? 'Healthy' : 'Unhealthy'}\n`;
      output += `**Timestamp:** ${result.timestamp}\n\n`;

      output += `### Odoo Connectivity\n`;
      output += `- **Connected:** ${result.odoo_connected ? 'Yes' : 'No'}\n`;
      if (result.latency_ms !== null) {
        output += `- **Latency:** ${result.latency_ms}ms\n`;
      }
      if (result.odoo_url) {
        output += `- **URL:** ${result.odoo_url}\n`;
      }
      if (result.odoo_database) {
        output += `- **Database:** ${result.odoo_database}\n`;
      }
      if (result.error) {
        output += `- **Error:** ${result.error}\n`;
      }

      output += `\n### Cache Statistics\n`;
      output += `- **Cached Entries:** ${result.cache_entries}\n`;
      output += `- **Hit Rate:** ${result.cache_hit_rate}%\n`;

      output += `\n### Connection Pool\n`;
      output += `- **Size:** ${result.pool.size} (min: ${result.pool.min}, max: ${result.pool.max})\n`;
      output += `- **Available:** ${result.pool.available}\n`;
      output += `- **In Use:** ${result.pool.borrowed}\n`;
      if (result.pool.pending > 0) {
        output += `- **Waiting:** ${result.pool.pending} requests\n`;
      }

      output += `\n### Circuit Breaker\n`;
      output += `- **State:** ${result.circuit_breaker.state}\n`;
      output += `- **Failure Count:** ${result.circuit_breaker.failure_count}\n`;
      if (result.circuit_breaker.seconds_until_retry !== null) {
        output += `- **Retry In:** ${result.circuit_breaker.seconds_until_retry} seconds\n`;
      }
      if (result.circuit_breaker.state === 'OPEN') {
        output += `\n*Circuit breaker is OPEN - Odoo requests are being blocked to prevent overload.*\n`;
      } else if (result.circuit_breaker.state === 'HALF_OPEN') {
        output += `\n*Circuit breaker is testing if Odoo has recovered...*\n`;
      }

      if (result.status === 'healthy') {
        if (result.latency_ms !== null && result.latency_ms < 500) {
          output += `\n*Connection is fast and responsive.*`;
        } else if (result.latency_ms !== null && result.latency_ms < 2000) {
          output += `\n*Connection is working but latency is moderate.*`;
        } else {
          output += `\n*Connection is slow - check network or Odoo server load.*`;
        }
      } else {
        output += `\n*Unable to connect to Odoo. Check credentials and network connectivity.*`;
      }

      return {
        content: [{ type: 'text', text: output }],
        structuredContent: result
      };
    }
  );

  // ============================================
  // TOOL: List States/Territories
  // ============================================
  server.registerTool(
    'odoo_crm_list_states',
    {
      title: 'List States/Territories',
      description: `Get a list of Australian states/territories with optional CRM statistics.

Returns all states for the specified country (default: Australia) with opportunity counts, won/lost counts, and revenue.

**When to use:**
- See which states/territories have the most opportunities
- Get state IDs for filtering other tools
- Geographic overview of CRM data`,
      inputSchema: StatesListSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: StatesListInput) => {
      try {
        const client = getOdooClient();

        // Get states from cache
        const states = await client.getStatesCached(params.country_code);

        // Build result with or without stats
        let statesWithStats: StateWithStats[] = states.map(s => ({
          id: s.id,
          name: s.name,
          code: s.code,
          country_id: s.country_id
        }));

        if (params.include_stats) {
          // Get opportunity counts by state
          const oppCounts = await client.readGroup(
            'crm.lead',
            [['type', '=', 'opportunity'], ['active', '=', true]],
            ['state_id', 'expected_revenue:sum', 'id:count'],
            ['state_id']
          );

          const wonCounts = await client.readGroup(
            'crm.lead',
            [['type', '=', 'opportunity'], ['probability', '=', 100]],
            ['state_id', 'id:count'],
            ['state_id']
          );

          const lostCounts = await client.readGroup(
            'crm.lead',
            [['type', '=', 'opportunity'], ['active', '=', false], ['probability', '=', 0]],
            ['state_id', 'id:count'],
            ['state_id']
          );

          // Map stats to states
          const oppCountMap = new Map(oppCounts.map(o => [
            Array.isArray(o.state_id) ? o.state_id[0] : 0,
            { count: (o.id as number) || 0, revenue: (o.expected_revenue as number) || 0 }
          ]));
          const wonCountMap = new Map(wonCounts.map(w => [
            Array.isArray(w.state_id) ? w.state_id[0] : 0,
            (w.id as number) || 0
          ]));
          const lostCountMap = new Map(lostCounts.map(l => [
            Array.isArray(l.state_id) ? l.state_id[0] : 0,
            (l.id as number) || 0
          ]));

          statesWithStats = states.map(s => ({
            id: s.id,
            name: s.name,
            code: s.code,
            country_id: s.country_id,
            opportunity_count: oppCountMap.get(s.id)?.count || 0,
            won_count: wonCountMap.get(s.id) || 0,
            lost_count: lostCountMap.get(s.id) || 0,
            total_revenue: oppCountMap.get(s.id)?.revenue || 0
          }));

          // Sort by opportunity count descending
          statesWithStats.sort((a, b) => (b.opportunity_count || 0) - (a.opportunity_count || 0));
        }

        const output = formatStatesList(statesWithStats, params.country_code, params.response_format);

        return {
          content: [{ type: 'text', text: output }],
          structuredContent: { states: statesWithStats, country_code: params.country_code }
        };

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error listing states: ${message}` }]
        };
      }
    }
  );

  // ============================================
  // TOOL: Compare States
  // ============================================
  server.registerTool(
    'odoo_crm_compare_states',
    {
      title: 'Compare State Performance',
      description: `Compare CRM performance across Australian states/territories.

Returns win/loss metrics, revenue, and win rates for each state, allowing geographic analysis of sales performance.

**When to use:**
- Identify top performing states/territories
- Compare win rates across geographic regions
- Analyze revenue distribution by state`,
      inputSchema: CompareStatesSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: CompareStatesInput) => {
      try {
        const client = getOdooClient();

        // Build base domain with optional state filter
        const baseDomain: unknown[] = [['type', '=', 'opportunity']];

        if (params.state_ids && params.state_ids.length > 0) {
          baseDomain.push(['state_id', 'in', params.state_ids]);
        }

        // Build date-filtered domain
        const wonDomain = [...baseDomain, ['probability', '=', 100]];
        const lostDomain = [...baseDomain, ['active', '=', false], ['probability', '=', 0]];

        if (params.date_from) {
          wonDomain.push(['date_closed', '>=', convertDateToUtc(params.date_from, false)]);
          lostDomain.push(['date_closed', '>=', convertDateToUtc(params.date_from, false)]);
        }
        if (params.date_to) {
          wonDomain.push(['date_closed', '<=', convertDateToUtc(params.date_to, true)]);
          lostDomain.push(['date_closed', '<=', convertDateToUtc(params.date_to, true)]);
        }

        // Get won by state
        const wonByState = await client.readGroup(
          'crm.lead',
          wonDomain,
          ['state_id', 'expected_revenue:sum', 'id:count'],
          ['state_id']
        );

        // Get lost by state
        const lostByState = await client.readGroup(
          'crm.lead',
          lostDomain,
          ['state_id', 'expected_revenue:sum', 'id:count'],
          ['state_id']
        );

        // Build state maps
        const wonMap = new Map(wonByState.map(w => [
          Array.isArray(w.state_id) ? w.state_id[0] : 0,
          {
            name: Array.isArray(w.state_id) ? w.state_id[1] as string : 'Not Specified',
            count: (w.id as number) || 0,
            revenue: (w.expected_revenue as number) || 0
          }
        ]));

        const lostMap = new Map(lostByState.map(l => [
          Array.isArray(l.state_id) ? l.state_id[0] : 0,
          {
            name: Array.isArray(l.state_id) ? l.state_id[1] as string : 'Not Specified',
            count: (l.id as number) || 0,
            revenue: (l.expected_revenue as number) || 0
          }
        ]));

        // Combine all state IDs
        const allStateIds = new Set([...wonMap.keys(), ...lostMap.keys()]);

        // Build comparison data
        const states: StateComparison['states'] = [];
        let totalWon = 0, totalLost = 0, totalWonRevenue = 0, totalLostRevenue = 0;

        for (const stateId of allStateIds) {
          const won = wonMap.get(stateId) || { name: 'Not Specified', count: 0, revenue: 0 };
          const lost = lostMap.get(stateId) || { name: 'Not Specified', count: 0, revenue: 0 };
          const total = won.count + lost.count;
          const winRate = total > 0 ? (won.count / total) * 100 : 0;
          const avgDealSize = won.count > 0 ? won.revenue / won.count : 0;

          states.push({
            state_id: stateId,
            state_name: won.name || lost.name,
            won_count: won.count,
            lost_count: lost.count,
            won_revenue: won.revenue,
            lost_revenue: lost.revenue,
            win_rate: winRate,
            avg_deal_size: avgDealSize,
            total_opportunities: total
          });

          totalWon += won.count;
          totalLost += lost.count;
          totalWonRevenue += won.revenue;
          totalLostRevenue += lost.revenue;
        }

        // Sort by won revenue descending
        states.sort((a, b) => b.won_revenue - a.won_revenue);

        const comparison: StateComparison = {
          period: params.date_from || params.date_to
            ? `${params.date_from || 'Start'} to ${params.date_to || 'Now'}`
            : undefined,
          states,
          totals: {
            total_won: totalWon,
            total_lost: totalLost,
            total_won_revenue: totalWonRevenue,
            total_lost_revenue: totalLostRevenue,
            overall_win_rate: (totalWon + totalLost) > 0 ? (totalWon / (totalWon + totalLost)) * 100 : 0
          }
        };

        const output = formatStateComparison(comparison, params.response_format);

        return {
          content: [{ type: 'text', text: output }],
          structuredContent: comparison
        };

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          isError: true,
          content: [{ type: 'text', text: `Error comparing states: ${message}` }]
        };
      }
    }
  );
}
