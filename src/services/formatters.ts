import { CONTEXT_LIMITS, ResponseFormat, CRM_FIELDS, FIELD_PRESETS } from '../constants.js';
import type { CrmLead, PaginatedResponse, PipelineSummary, SalesAnalytics, ActivitySummary, ResPartner, LostReasonWithCount, LostAnalysisSummary, LostOpportunity, LostTrendsSummary, WonOpportunity, WonAnalysisSummary, WonTrendsSummary, SalespersonWithStats, SalesTeamWithStats, PerformanceComparison, ActivityDetail, ExportResult, PipelineSummaryWithWeighted, StateWithStats, StateComparison, VectorMatch, VectorMetadata, PatternDiscoveryResult, SyncResult, VectorStatus } from '../types.js';
import { stripHtml, getContactName } from '../utils/html-utils.js';
import { formatLinkedName } from '../utils/odoo-urls.js';

// Format currency value
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// Format percentage (with NaN guard)
export function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '-';
  return `${Math.round(value)}%`;
}

// Format date
export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// Extract name from Odoo relation field [id, name]
export function getRelationName(field: [number, string] | undefined | null): string {
  return field?.[1] || '-';
}

// Truncate text to preserve context
export function truncateText(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Format lead for list view (minimal fields)
export function formatLeadListItem(lead: CrmLead): string {
  // Build location string from city and state
  const location = [lead.city, getRelationName(lead.state_id)].filter(x => x && x !== '-').join(', ');

  return `- **${formatLinkedName(lead.id, lead.name, 'crm.lead')}** (ID: ${lead.id})
  Contact: ${getContactName(lead)} | ${lead.email_from || '-'}
  Stage: ${getRelationName(lead.stage_id)} | Revenue: ${formatCurrency(lead.expected_revenue)} | Prob: ${formatPercent(lead.probability)}
  Sector: ${lead.sector || '-'} | Lead Source: ${getRelationName(lead.lead_source_id)} | Spec: ${getRelationName(lead.specification_id)}
  Location: ${location || '-'}`;
}

// Format lead detail view
export function formatLeadDetail(lead: CrmLead): string {
  return `## ${formatLinkedName(lead.id, lead.name, 'crm.lead')}
**ID:** ${lead.id} | **Type:** ${lead.type || 'opportunity'}

### Contact Information
- **Contact:** ${getContactName(lead)}
- **Email:** ${lead.email_from || '-'}
- **Phone:** ${lead.phone || '-'} | **Mobile:** ${lead.mobile || '-'}
- **Address:** ${[lead.street, lead.city, getRelationName(lead.state_id), getRelationName(lead.country_id)].filter(x => x && x !== '-').join(', ') || '-'}

### Opportunity Details
- **Stage:** ${getRelationName(lead.stage_id)}
- **Expected Revenue:** ${formatCurrency(lead.expected_revenue)}
- **Probability:** ${formatPercent(lead.probability)}
- **Priority:** ${lead.priority || '-'}

### Assignment
- **Salesperson:** ${getRelationName(lead.user_id)}
- **Sales Team:** ${getRelationName(lead.team_id)}
- **Partner/Company:** ${getRelationName(lead.partner_id)}

### Dates
- **Created:** ${formatDate(lead.create_date)}
- **Deadline:** ${formatDate(lead.date_deadline)}
- **Closed:** ${formatDate(lead.date_closed)}
- **Last Updated:** ${formatDate(lead.write_date)}

### Source
- **Source:** ${getRelationName(lead.source_id)}
- **Medium:** ${getRelationName(lead.medium_id)}
- **Campaign:** ${getRelationName(lead.campaign_id)}

### Classification
- **Sector:** ${lead.sector || '-'}
- **Lead Source:** ${getRelationName(lead.lead_source_id)}
- **Specification:** ${getRelationName(lead.specification_id)}

${lead.description ? `### Notes\n${truncateText(stripHtml(lead.description), 500)}` : ''}`;
}

// Format paginated leads response
export function formatLeadList(data: PaginatedResponse<CrmLead>, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(data, null, 2);
  }

  if (format === ResponseFormat.CSV) {
    return formatRecordsAsCSV(data.items);
  }

  let output = `## Leads/Opportunities (${data.count} of ${data.total})\n\n`;
  
  if (data.items.length === 0) {
    output += '_No leads found matching your criteria._\n';
  } else {
    output += data.items.map(formatLeadListItem).join('\n\n');
  }
  
  output += '\n\n---\n';
  output += `**Showing:** ${data.offset + 1}-${data.offset + data.count} of ${data.total}`;
  
  if (data.has_more) {
    output += ` | **Next page:** Use offset=${data.next_offset}`;
  }
  
  if (data.context_note) {
    output += `\n\n_💡 ${data.context_note}_`;
  }
  
  return output;
}

// Format pipeline summary
export function formatPipelineSummary(stages: PipelineSummary[], format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify({ stages }, null, 2);
  }
  
  let output = '## Pipeline Summary\n\n';
  
  const totalRevenue = stages.reduce((sum, s) => sum + s.total_revenue, 0);
  const totalCount = stages.reduce((sum, s) => sum + s.count, 0);
  
  output += `**Total Pipeline:** ${totalCount} opportunities | ${formatCurrency(totalRevenue)}\n\n`;
  
  for (const stage of stages) {
    output += `### ${stage.stage_name}\n`;
    output += `- **Count:** ${stage.count} | **Revenue:** ${formatCurrency(stage.total_revenue)} | **Avg Prob:** ${formatPercent(stage.avg_probability)}\n`;
    
    if (stage.opportunities.length > 0) {
      output += '- **Top opportunities:**\n';
      for (const opp of stage.opportunities) {
        output += `  - ${formatLinkedName(opp.id, opp.name, 'crm.lead')}: ${formatCurrency(opp.expected_revenue)} (${formatPercent(opp.probability)})\n`;
      }
    }
    output += '\n';
  }
  
  return output;
}

// Format sales analytics
export function formatSalesAnalytics(analytics: SalesAnalytics, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(analytics, null, 2);
  }
  
  let output = `## Sales Analytics ${analytics.period ? `(${analytics.period})` : ''}\n\n`;
  
  output += `### Overview
- **Total Leads:** ${analytics.total_leads}
- **Total Opportunities:** ${analytics.total_opportunities}
- **Won:** ${analytics.total_won} | **Lost:** ${analytics.total_lost}
- **Conversion Rate:** ${formatPercent(analytics.conversion_rate)}
- **Average Deal Size:** ${formatCurrency(analytics.avg_deal_size)}

### Revenue
- **Expected:** ${formatCurrency(analytics.total_revenue_expected)}
- **Won:** ${formatCurrency(analytics.total_revenue_won)}

### By Stage\n`;
  
  for (const stage of analytics.by_stage) {
    output += `- ${stage.stage}: ${stage.count} opp | ${formatCurrency(stage.revenue)}\n`;
  }
  
  if (analytics.by_salesperson && analytics.by_salesperson.length > 0) {
    output += '\n### By Salesperson\n';
    for (const sp of analytics.by_salesperson) {
      output += `- **${sp.name}:** ${sp.count} opp | ${formatCurrency(sp.revenue)} | ${sp.won} won\n`;
    }
  }
  
  if (analytics.top_opportunities.length > 0) {
    output += '\n### Top Opportunities\n';
    for (const opp of analytics.top_opportunities) {
      output += `- ${formatLinkedName(opp.id, opp.name, 'crm.lead')}: ${formatCurrency(opp.revenue)} (${formatPercent(opp.probability)}) - ${opp.stage}\n`;
    }
  }
  
  return output;
}

// Format activity summary
export function formatActivitySummary(summary: ActivitySummary, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(summary, null, 2);
  }
  
  let output = `## Activity Summary\n\n`;
  
  output += `### Overview
- **Total Activities:** ${summary.total_activities}
- **⚠️ Overdue:** ${summary.overdue}
- **📅 Today:** ${summary.today}
- **🔜 Upcoming:** ${summary.upcoming}

### By Type\n`;
  
  for (const type of summary.by_type) {
    output += `- ${type.type}: ${type.count} total (${type.overdue} overdue)\n`;
  }
  
  if (summary.by_user.length > 0) {
    output += '\n### By User\n';
    for (const user of summary.by_user) {
      output += `- ${user.user}: ${user.total} total (${user.overdue} overdue)\n`;
    }
  }
  
  return output;
}

// Format contact list
export function formatContactList(data: PaginatedResponse<ResPartner>, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(data, null, 2);
  }

  if (format === ResponseFormat.CSV) {
    return formatRecordsAsCSV(data.items);
  }

  let output = `## Contacts (${data.count} of ${data.total})\n\n`;
  
  if (data.items.length === 0) {
    output += '_No contacts found matching your criteria._\n';
  } else {
    for (const contact of data.items) {
      output += `- **${formatLinkedName(contact.id, contact.name, 'res.partner')}** (ID: ${contact.id})${contact.is_company ? ' 🏢' : ''}\n`;
      output += `  ${contact.email || '-'} | ${contact.phone || contact.mobile || '-'}\n`;
      output += `  ${[contact.city, getRelationName(contact.state_id), getRelationName(contact.country_id)].filter(x => x && x !== '-').join(', ') || '-'}\n\n`;
    }
  }
  
  output += '---\n';
  output += `**Showing:** ${data.offset + 1}-${data.offset + data.count} of ${data.total}`;
  
  if (data.has_more) {
    output += ` | **Next page:** Use offset=${data.next_offset}`;
  }
  
  return output;
}

// Check if response exceeds context limits
export function checkContextLimit(response: string): { ok: boolean; note?: string } {
  if (response.length > CONTEXT_LIMITS.MAX_RESPONSE_CHARS) {
    return {
      ok: false,
      note: `Response truncated. Use pagination (smaller limit) or filters to reduce data.`
    };
  }
  return { ok: true };
}

// Format lost reasons list
export function formatLostReasonsList(reasons: LostReasonWithCount[], format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify({ reasons }, null, 2);
  }

  let output = '## Lost Reasons\n\n';

  if (reasons.length === 0) {
    output += '_No lost reasons configured in the system._\n';
    return output;
  }

  output += '| ID | Reason | Active | Opportunities |\n';
  output += '|----|--------|--------|---------------|\n';

  for (const reason of reasons) {
    const activeIcon = reason.active !== false ? '✓' : '✗';
    output += `| ${reason.id} | ${reason.name} | ${activeIcon} | ${reason.opportunity_count.toLocaleString()} |\n`;
  }

  return output;
}

// Format lost analysis summary
export function formatLostAnalysis(analysis: LostAnalysisSummary, groupBy: string, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(analysis, null, 2);
  }

  let output = `## Lost Opportunity Analysis\n\n`;

  if (analysis.period) {
    output += `**Period:** ${analysis.period}\n`;
  }
  output += `**Total Lost:** ${analysis.total_lost.toLocaleString()} opportunities | ${formatCurrency(analysis.total_lost_revenue)}\n`;
  output += `**Average Deal Size:** ${formatCurrency(analysis.avg_deal_size)}\n\n`;

  // Win/Loss Context
  if (analysis.total_won !== undefined && analysis.win_rate !== undefined) {
    output += `### Win/Loss Context\n`;
    output += `- **Win Rate:** ${formatPercent(analysis.win_rate)} (${analysis.total_won?.toLocaleString()} won vs ${analysis.total_lost.toLocaleString()} lost)\n`;
    output += `- **Won Revenue:** ${formatCurrency(analysis.total_won_revenue)}\n`;
    output += `- **Lost Revenue:** ${formatCurrency(analysis.total_lost_revenue)}\n\n`;
  }

  // Grouped data based on group_by parameter
  if (groupBy === 'reason' && analysis.by_reason && analysis.by_reason.length > 0) {
    output += `### By Reason\n`;
    output += '| Reason | Count | % of Total | Lost Revenue | Avg Deal |\n';
    output += '|--------|-------|------------|--------------|----------|\n';
    for (const item of analysis.by_reason) {
      output += `| ${item.reason_name} | ${item.count.toLocaleString()} | ${formatPercent(item.percentage)} | ${formatCurrency(item.lost_revenue)} | ${formatCurrency(item.avg_deal)} |\n`;
    }
    output += '\n';
  }

  if (groupBy === 'salesperson' && analysis.by_salesperson && analysis.by_salesperson.length > 0) {
    output += `### By Salesperson\n`;
    output += '| Salesperson | Count | % of Total | Lost Revenue | Avg Deal |\n';
    output += '|-------------|-------|------------|--------------|----------|\n';
    for (const item of analysis.by_salesperson) {
      output += `| ${item.user_name} | ${item.count.toLocaleString()} | ${formatPercent(item.percentage)} | ${formatCurrency(item.lost_revenue)} | ${formatCurrency(item.avg_deal)} |\n`;
    }
    output += '\n';
  }

  if (groupBy === 'team' && analysis.by_team && analysis.by_team.length > 0) {
    output += `### By Team\n`;
    output += '| Team | Count | % of Total | Lost Revenue | Avg Deal |\n';
    output += '|------|-------|------------|--------------|----------|\n';
    for (const item of analysis.by_team) {
      output += `| ${item.team_name} | ${item.count.toLocaleString()} | ${formatPercent(item.percentage)} | ${formatCurrency(item.lost_revenue)} | ${formatCurrency(item.avg_deal)} |\n`;
    }
    output += '\n';
  }

  if (groupBy === 'stage' && analysis.by_stage && analysis.by_stage.length > 0) {
    output += `### By Stage (when lost)\n`;
    output += '| Stage | Count | % of Total | Lost Revenue | Avg Deal |\n';
    output += '|-------|-------|------------|--------------|----------|\n';
    for (const item of analysis.by_stage) {
      output += `| ${item.stage_name} | ${item.count.toLocaleString()} | ${formatPercent(item.percentage)} | ${formatCurrency(item.lost_revenue)} | ${formatCurrency(item.avg_deal)} |\n`;
    }
    output += '\n';
  }

  if (groupBy === 'month' && analysis.by_month && analysis.by_month.length > 0) {
    output += `### By Month\n`;
    output += '| Month | Count | Lost Revenue |\n';
    output += '|-------|-------|---------------|\n';
    for (const item of analysis.by_month) {
      output += `| ${item.month} | ${item.count.toLocaleString()} | ${formatCurrency(item.lost_revenue)} |\n`;
    }
    output += '\n';
  }

  if (groupBy === 'sector' && analysis.by_sector && analysis.by_sector.length > 0) {
    output += `### By Sector\n`;
    output += '| Sector | Count | % of Total | Lost Revenue | Avg Deal |\n';
    output += '|--------|-------|------------|--------------|----------|\n';
    for (const item of analysis.by_sector) {
      output += `| ${item.sector} | ${item.count.toLocaleString()} | ${formatPercent(item.percentage)} | ${formatCurrency(item.lost_revenue)} | ${formatCurrency(item.avg_deal)} |\n`;
    }
    output += '\n';
  }

  if (groupBy === 'specification' && analysis.by_specification && analysis.by_specification.length > 0) {
    output += `### By Specification\n`;
    output += '| Specification | Count | % of Total | Lost Revenue | Avg Deal |\n';
    output += '|---------------|-------|------------|--------------|----------|\n';
    for (const item of analysis.by_specification) {
      output += `| ${item.specification_name} | ${item.count.toLocaleString()} | ${formatPercent(item.percentage)} | ${formatCurrency(item.lost_revenue)} | ${formatCurrency(item.avg_deal)} |\n`;
    }
    output += '\n';
  }

  if (groupBy === 'lead_source' && analysis.by_lead_source && analysis.by_lead_source.length > 0) {
    output += `### By Lead Source\n`;
    output += '| Lead Source | Count | % of Total | Lost Revenue | Avg Deal |\n';
    output += '|-------------|-------|------------|--------------|----------|\n';
    for (const item of analysis.by_lead_source) {
      output += `| ${item.lead_source_name} | ${item.count.toLocaleString()} | ${formatPercent(item.percentage)} | ${formatCurrency(item.lost_revenue)} | ${formatCurrency(item.avg_deal)} |\n`;
    }
    output += '\n';
  }

  if (groupBy === 'state' && analysis.by_state && analysis.by_state.length > 0) {
    output += `### By State/Territory\n`;
    output += '| State | Count | % of Total | Lost Revenue | Avg Deal |\n';
    output += '|-------|-------|------------|--------------|----------|\n';
    for (const item of analysis.by_state) {
      output += `| ${item.state_name} | ${item.count.toLocaleString()} | ${formatPercent(item.percentage)} | ${formatCurrency(item.lost_revenue)} | ${formatCurrency(item.avg_deal)} |\n`;
    }
    output += '\n';
  }

  if (groupBy === 'city' && analysis.by_city && analysis.by_city.length > 0) {
    output += `### By City\n`;
    output += '| City | Count | % of Total | Lost Revenue | Avg Deal |\n';
    output += '|------|-------|------------|--------------|----------|\n';
    for (const item of analysis.by_city) {
      output += `| ${item.city} | ${item.count.toLocaleString()} | ${formatPercent(item.percentage)} | ${formatCurrency(item.lost_revenue)} | ${formatCurrency(item.avg_deal)} |\n`;
    }
    output += '\n';
  }

  // Top lost opportunities
  if (analysis.top_lost && analysis.top_lost.length > 0) {
    output += `### Top ${analysis.top_lost.length} Largest Lost Opportunities\n`;
    for (let i = 0; i < analysis.top_lost.length; i++) {
      const opp = analysis.top_lost[i];
      output += `${i + 1}. **${formatLinkedName(opp.id, opp.name, 'crm.lead')}** - ${formatCurrency(opp.revenue)} - ${opp.reason || 'No reason'} - ${opp.salesperson || 'Unassigned'}\n`;
    }
  }

  return output;
}

// Format lost opportunities list
export function formatLostOpportunitiesList(data: PaginatedResponse<LostOpportunity>, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(data, null, 2);
  }

  if (format === ResponseFormat.CSV) {
    return formatRecordsAsCSV(data.items);
  }

  let output = `## Lost Opportunities (${data.count} of ${data.total})\n\n`;

  if (data.items.length === 0) {
    output += '_No lost opportunities found matching your criteria._\n';
  } else {
    for (let i = 0; i < data.items.length; i++) {
      const opp = data.items[i];
      output += `${data.offset + i + 1}. **${formatLinkedName(opp.id, opp.name, 'crm.lead')}** (ID: ${opp.id})\n`;
      output += `   - Contact: ${getContactName(opp)} | ${opp.email_from || '-'}\n`;
      output += `   - Lost Reason: ${getRelationName(opp.lost_reason_id)}\n`;
      output += `   - Revenue: ${formatCurrency(opp.expected_revenue)} | Stage: ${getRelationName(opp.stage_id)}\n`;
      output += `   - Salesperson: ${getRelationName(opp.user_id)} | Lost: ${formatDate(opp.date_closed)}\n`;
      output += `   - Sector: ${opp.sector || '-'} | Lead Source: ${getRelationName(opp.lead_source_id)} | Spec: ${getRelationName(opp.specification_id)}\n`;
      const location = [opp.city, getRelationName(opp.state_id)].filter(x => x && x !== '-').join(', ');
      if (location) {
        output += `   - Location: ${location}\n`;
      }
      if (opp.description) {
        output += `   - Notes: ${truncateText(stripHtml(opp.description), 100)}\n`;
      }
      output += '\n';
    }
  }

  output += '---\n';
  output += `**Showing:** ${data.offset + 1}-${data.offset + data.count} of ${data.total}`;

  if (data.has_more) {
    output += ` | **Next page:** Use offset=${data.next_offset}`;
  }

  return output;
}

// Format lost trends
export function formatLostTrends(trends: LostTrendsSummary, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(trends, null, 2);
  }

  let output = `## Lost Opportunity Trends\n\n`;
  output += `**Period:** ${trends.period} | **Granularity:** ${trends.granularity}\n\n`;

  // Trends table
  const hasWonData = trends.periods.some(p => p.won_count !== undefined);

  if (hasWonData) {
    output += '| Period | Lost | Lost Revenue | Won | Won Revenue | Win Rate | Top Lost Reason |\n';
    output += '|--------|------|--------------|-----|-------------|----------|------------------|\n';
    for (const period of trends.periods) {
      output += `| ${period.period_label} | ${period.lost_count} | ${formatCurrency(period.lost_revenue)} | ${period.won_count || '-'} | ${formatCurrency(period.won_revenue)} | ${formatPercent(period.win_rate)} | ${period.top_lost_reason || '-'} |\n`;
    }
  } else {
    output += '| Period | Lost | Lost Revenue | Top Lost Reason |\n';
    output += '|--------|------|--------------|------------------|\n';
    for (const period of trends.periods) {
      output += `| ${period.period_label} | ${period.lost_count} | ${formatCurrency(period.lost_revenue)} | ${period.top_lost_reason || '-'} |\n`;
    }
  }

  output += '\n### Trend Insights\n';
  output += `- **Avg Lost per Period:** ${(isNaN(trends.avg_monthly_lost) ? 0 : trends.avg_monthly_lost).toFixed(0)} opportunities (${formatCurrency(trends.avg_monthly_revenue)})\n`;

  if (trends.worst_period) {
    output += `- **Worst Period:** ${trends.worst_period.label} (${trends.worst_period.lost_count} lost`;
    if (trends.worst_period.win_rate !== undefined) {
      output += `, ${formatPercent(trends.worst_period.win_rate)} win rate`;
    }
    output += ')\n';
  }

  if (trends.best_period) {
    output += `- **Best Period:** ${trends.best_period.label} (${trends.best_period.lost_count} lost`;
    if (trends.best_period.win_rate !== undefined) {
      output += `, ${formatPercent(trends.best_period.win_rate)} win rate`;
    }
    output += ')\n';
  }

  if (trends.most_common_reason) {
    output += `- **Most Common Reason:** "${trends.most_common_reason}"\n`;
  }

  return output;
}

// Format won opportunities list
export function formatWonOpportunitiesList(data: PaginatedResponse<WonOpportunity>, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(data, null, 2);
  }

  if (format === ResponseFormat.CSV) {
    return formatRecordsAsCSV(data.items);
  }

  let output = `## Won Opportunities (${data.count} of ${data.total})\n\n`;

  if (data.items.length === 0) {
    output += '_No won opportunities found matching your criteria._\n';
  } else {
    for (let i = 0; i < data.items.length; i++) {
      const opp = data.items[i];
      output += `${data.offset + i + 1}. **${formatLinkedName(opp.id, opp.name, 'crm.lead')}** (ID: ${opp.id})\n`;
      output += `   - Contact: ${getContactName(opp)} | ${opp.email_from || '-'}\n`;
      output += `   - Revenue: ${formatCurrency(opp.expected_revenue)} | Stage: ${getRelationName(opp.stage_id)}\n`;
      output += `   - Salesperson: ${getRelationName(opp.user_id)} | Won: ${formatDate(opp.date_closed)}\n`;
      output += `   - Sector: ${opp.sector || '-'} | Lead Source: ${getRelationName(opp.lead_source_id)} | Spec: ${getRelationName(opp.specification_id)}\n`;
      const location = [opp.city, getRelationName(opp.state_id)].filter(x => x && x !== '-').join(', ');
      if (location) {
        output += `   - Location: ${location}\n`;
      }
      output += '\n';
    }
  }

  output += '---\n';
  output += `**Showing:** ${data.offset + 1}-${data.offset + data.count} of ${data.total}`;

  if (data.has_more) {
    output += ` | **Next page:** Use offset=${data.next_offset}`;
  }

  return output;
}

// Format won analysis summary
export function formatWonAnalysis(analysis: WonAnalysisSummary, groupBy: string, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(analysis, null, 2);
  }

  let output = `## Won Opportunity Analysis\n\n`;

  if (analysis.period) {
    output += `**Period:** ${analysis.period}\n`;
  }
  output += `**Total Won:** ${analysis.total_won.toLocaleString()} opportunities | ${formatCurrency(analysis.total_won_revenue)}\n`;
  output += `**Average Deal Size:** ${formatCurrency(analysis.avg_deal_size)}\n`;
  if (analysis.avg_sales_cycle_days !== undefined) {
    output += `**Avg Sales Cycle:** ${Math.round(analysis.avg_sales_cycle_days)} days\n`;
  }
  output += '\n';

  // Grouped data based on group_by parameter
  if (groupBy === 'salesperson' && analysis.by_salesperson && analysis.by_salesperson.length > 0) {
    output += `### By Salesperson\n`;
    output += '| Salesperson | Count | % of Total | Won Revenue | Avg Deal |\n';
    output += '|-------------|-------|------------|-------------|----------|\n';
    for (const item of analysis.by_salesperson) {
      output += `| ${item.user_name} | ${item.count.toLocaleString()} | ${formatPercent(item.percentage)} | ${formatCurrency(item.won_revenue)} | ${formatCurrency(item.avg_deal)} |\n`;
    }
    output += '\n';
  }

  if (groupBy === 'team' && analysis.by_team && analysis.by_team.length > 0) {
    output += `### By Team\n`;
    output += '| Team | Count | % of Total | Won Revenue | Avg Deal |\n';
    output += '|------|-------|------------|-------------|----------|\n';
    for (const item of analysis.by_team) {
      output += `| ${item.team_name} | ${item.count.toLocaleString()} | ${formatPercent(item.percentage)} | ${formatCurrency(item.won_revenue)} | ${formatCurrency(item.avg_deal)} |\n`;
    }
    output += '\n';
  }

  if (groupBy === 'stage' && analysis.by_stage && analysis.by_stage.length > 0) {
    output += `### By Stage (when won)\n`;
    output += '| Stage | Count | % of Total | Won Revenue | Avg Deal |\n';
    output += '|-------|-------|------------|-------------|----------|\n';
    for (const item of analysis.by_stage) {
      output += `| ${item.stage_name} | ${item.count.toLocaleString()} | ${formatPercent(item.percentage)} | ${formatCurrency(item.won_revenue)} | ${formatCurrency(item.avg_deal)} |\n`;
    }
    output += '\n';
  }

  if (groupBy === 'month' && analysis.by_month && analysis.by_month.length > 0) {
    output += `### By Month\n`;
    output += '| Month | Count | Won Revenue |\n';
    output += '|-------|-------|-------------|\n';
    for (const item of analysis.by_month) {
      output += `| ${item.month} | ${item.count.toLocaleString()} | ${formatCurrency(item.won_revenue)} |\n`;
    }
    output += '\n';
  }

  if (groupBy === 'source' && analysis.by_source && analysis.by_source.length > 0) {
    output += `### By Source\n`;
    output += '| Source | Count | % of Total | Won Revenue | Avg Deal |\n';
    output += '|--------|-------|------------|-------------|----------|\n';
    for (const item of analysis.by_source) {
      output += `| ${item.source_name} | ${item.count.toLocaleString()} | ${formatPercent(item.percentage)} | ${formatCurrency(item.won_revenue)} | ${formatCurrency(item.avg_deal)} |\n`;
    }
    output += '\n';
  }

  if (groupBy === 'sector' && analysis.by_sector && analysis.by_sector.length > 0) {
    output += `### By Sector\n`;
    output += '| Sector | Count | % of Total | Won Revenue | Avg Deal |\n';
    output += '|--------|-------|------------|-------------|----------|\n';
    for (const item of analysis.by_sector) {
      output += `| ${item.sector} | ${item.count.toLocaleString()} | ${formatPercent(item.percentage)} | ${formatCurrency(item.won_revenue)} | ${formatCurrency(item.avg_deal)} |\n`;
    }
    output += '\n';
  }

  if (groupBy === 'specification' && analysis.by_specification && analysis.by_specification.length > 0) {
    output += `### By Specification\n`;
    output += '| Specification | Count | % of Total | Won Revenue | Avg Deal |\n';
    output += '|---------------|-------|------------|-------------|----------|\n';
    for (const item of analysis.by_specification) {
      output += `| ${item.specification_name} | ${item.count.toLocaleString()} | ${formatPercent(item.percentage)} | ${formatCurrency(item.won_revenue)} | ${formatCurrency(item.avg_deal)} |\n`;
    }
    output += '\n';
  }

  if (groupBy === 'lead_source' && analysis.by_lead_source && analysis.by_lead_source.length > 0) {
    output += `### By Lead Source\n`;
    output += '| Lead Source | Count | % of Total | Won Revenue | Avg Deal |\n';
    output += '|-------------|-------|------------|-------------|----------|\n';
    for (const item of analysis.by_lead_source) {
      output += `| ${item.lead_source_name} | ${item.count.toLocaleString()} | ${formatPercent(item.percentage)} | ${formatCurrency(item.won_revenue)} | ${formatCurrency(item.avg_deal)} |\n`;
    }
    output += '\n';
  }

  if (groupBy === 'state' && analysis.by_state && analysis.by_state.length > 0) {
    output += `### By State/Territory\n`;
    output += '| State | Count | % of Total | Won Revenue | Avg Deal |\n';
    output += '|-------|-------|------------|-------------|----------|\n';
    for (const item of analysis.by_state) {
      output += `| ${item.state_name} | ${item.count.toLocaleString()} | ${formatPercent(item.percentage)} | ${formatCurrency(item.won_revenue)} | ${formatCurrency(item.avg_deal)} |\n`;
    }
    output += '\n';
  }

  if (groupBy === 'city' && analysis.by_city && analysis.by_city.length > 0) {
    output += `### By City\n`;
    output += '| City | Count | % of Total | Won Revenue | Avg Deal |\n';
    output += '|------|-------|------------|-------------|----------|\n';
    for (const item of analysis.by_city) {
      output += `| ${item.city} | ${item.count.toLocaleString()} | ${formatPercent(item.percentage)} | ${formatCurrency(item.won_revenue)} | ${formatCurrency(item.avg_deal)} |\n`;
    }
    output += '\n';
  }

  // Top won opportunities
  if (analysis.top_won && analysis.top_won.length > 0) {
    output += `### Top ${analysis.top_won.length} Largest Won Opportunities\n`;
    for (let i = 0; i < analysis.top_won.length; i++) {
      const opp = analysis.top_won[i];
      output += `${i + 1}. **${formatLinkedName(opp.id, opp.name, 'crm.lead')}** - ${formatCurrency(opp.revenue)} - ${opp.salesperson || 'Unassigned'} - Won: ${opp.date_closed}`;
      if (opp.sales_cycle_days !== undefined) {
        output += ` (${opp.sales_cycle_days} days)`;
      }
      output += '\n';
    }
  }

  return output;
}

// Format won trends
export function formatWonTrends(trends: WonTrendsSummary, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(trends, null, 2);
  }

  let output = `## Won Opportunity Trends\n\n`;
  output += `**Period:** ${trends.period} | **Granularity:** ${trends.granularity}\n\n`;

  // Trends table
  const hasLostData = trends.periods.some(p => p.lost_count !== undefined);

  if (hasLostData) {
    output += '| Period | Won | Won Revenue | Lost | Lost Revenue | Win Rate | Avg Deal |\n';
    output += '|--------|-----|-------------|------|--------------|----------|----------|\n';
    for (const period of trends.periods) {
      output += `| ${period.period_label} | ${period.won_count} | ${formatCurrency(period.won_revenue)} | ${period.lost_count || '-'} | ${formatCurrency(period.lost_revenue)} | ${formatPercent(period.win_rate)} | ${formatCurrency(period.avg_deal_size)} |\n`;
    }
  } else {
    output += '| Period | Won | Won Revenue | Avg Deal |\n';
    output += '|--------|-----|-------------|----------|\n';
    for (const period of trends.periods) {
      output += `| ${period.period_label} | ${period.won_count} | ${formatCurrency(period.won_revenue)} | ${formatCurrency(period.avg_deal_size)} |\n`;
    }
  }

  output += '\n### Trend Insights\n';
  output += `- **Avg Won per Period:** ${(isNaN(trends.avg_period_won) ? 0 : trends.avg_period_won).toFixed(0)} opportunities (${formatCurrency(trends.avg_period_revenue)})\n`;

  if (trends.best_period) {
    output += `- **Best Period:** ${trends.best_period.label} (${trends.best_period.won_count} won, ${formatCurrency(trends.best_period.won_revenue)}`;
    if (trends.best_period.win_rate !== undefined) {
      output += `, ${formatPercent(trends.best_period.win_rate)} win rate`;
    }
    output += ')\n';
  }

  if (trends.worst_period) {
    output += `- **Worst Period:** ${trends.worst_period.label} (${trends.worst_period.won_count} won, ${formatCurrency(trends.worst_period.won_revenue)}`;
    if (trends.worst_period.win_rate !== undefined) {
      output += `, ${formatPercent(trends.worst_period.win_rate)} win rate`;
    }
    output += ')\n';
  }

  if (trends.avg_deal_size_trend) {
    const trendEmoji = trends.avg_deal_size_trend === 'increasing' ? '📈' :
                       trends.avg_deal_size_trend === 'decreasing' ? '📉' : '➡️';
    output += `- **Deal Size Trend:** ${trendEmoji} ${trends.avg_deal_size_trend}\n`;
  }

  return output;
}

// Format salespeople list
export function formatSalespeopleList(salespeople: SalespersonWithStats[], format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify({ salespeople }, null, 2);
  }

  let output = '## Salespeople\n\n';

  if (salespeople.length === 0) {
    output += '_No salespeople found._\n';
    return output;
  }

  output += '| ID | Name | Email | Opportunities | Revenue | Won |\n';
  output += '|----|------|-------|---------------|---------|-----|\n';

  for (const sp of salespeople) {
    output += `| ${sp.user_id} | ${sp.name} | ${sp.email || '-'} | ${sp.opportunity_count?.toLocaleString() || '-'} | ${formatCurrency(sp.active_revenue)} | ${sp.won_count?.toLocaleString() || '-'} |\n`;
  }

  return output;
}

// Format teams list
export function formatTeamsList(teams: SalesTeamWithStats[], format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify({ teams }, null, 2);
  }

  let output = '## Sales Teams\n\n';

  if (teams.length === 0) {
    output += '_No sales teams found._\n';
    return output;
  }

  output += '| ID | Team | Members | Opportunities | Pipeline Revenue | Won |\n';
  output += '|----|------|---------|---------------|------------------|-----|\n';

  for (const team of teams) {
    output += `| ${team.team_id} | ${team.name} | ${team.member_count || '-'} | ${team.opportunity_count?.toLocaleString() || '-'} | ${formatCurrency(team.total_pipeline_revenue)} | ${team.won_count?.toLocaleString() || '-'} |\n`;
  }

  return output;
}

// Format performance comparison
export function formatPerformanceComparison(comparison: PerformanceComparison, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(comparison, null, 2);
  }

  let output = `## Performance Comparison\n\n`;
  output += `**Type:** ${comparison.compare_type}\n\n`;

  if (comparison.compare_type === 'periods' && comparison.periods) {
    output += '### Period Comparison\n';
    output += '| Metric | Period 1 | Period 2 | Change |\n';
    output += '|--------|----------|----------|--------|\n';

    const p1 = comparison.periods[0];
    const p2 = comparison.periods[1];
    const change = comparison.period_change;

    if (p1 && p2) {
      output += `| **Period** | ${p1.label} | ${p2.label} | - |\n`;
      output += `| Won Count | ${p1.won_count} | ${p2.won_count} | ${change?.won_count_change !== undefined ? `${change.won_count_change >= 0 ? '+' : ''}${formatPercent(change.won_count_change)}` : '-'} |\n`;
      output += `| Won Revenue | ${formatCurrency(p1.won_revenue)} | ${formatCurrency(p2.won_revenue)} | ${change?.won_revenue_change !== undefined ? `${change.won_revenue_change >= 0 ? '+' : ''}${formatPercent(change.won_revenue_change)}` : '-'} |\n`;
      output += `| Win Rate | ${formatPercent(p1.win_rate)} | ${formatPercent(p2.win_rate)} | ${change?.win_rate_change !== undefined && !isNaN(change.win_rate_change) ? `${change.win_rate_change >= 0 ? '+' : ''}${change.win_rate_change.toFixed(1)}pp` : '-'} |\n`;
      output += `| Avg Deal Size | ${formatCurrency(p1.avg_deal_size)} | ${formatCurrency(p2.avg_deal_size)} | ${change?.avg_deal_size_change !== undefined ? `${change.avg_deal_size_change >= 0 ? '+' : ''}${formatPercent(change.avg_deal_size_change)}` : '-'} |\n`;
      output += `| Avg Cycle Days | ${Math.round(p1.avg_cycle_days)} | ${Math.round(p2.avg_cycle_days)} | ${change?.avg_cycle_days_change !== undefined ? `${change.avg_cycle_days_change >= 0 ? '+' : ''}${formatPercent(change.avg_cycle_days_change)}` : '-'} |\n`;
    }
  } else if (comparison.entities) {
    output += `### ${comparison.compare_type === 'salespeople' ? 'Salespeople' : 'Teams'} Comparison\n`;
    output += '| Name | Won | Revenue | Win Rate | Avg Deal | Cycle Days |\n';
    output += '|------|-----|---------|----------|----------|------------|\n';

    for (const entity of comparison.entities) {
      output += `| ${entity.name} | ${entity.won_count} | ${formatCurrency(entity.won_revenue)} | ${formatPercent(entity.win_rate)} | ${formatCurrency(entity.avg_deal_size)} | ${Math.round(entity.avg_cycle_days)} |\n`;
    }

    if (comparison.benchmarks) {
      output += '\n### Benchmarks (Average)\n';
      output += `- Won Count: ${(isNaN(comparison.benchmarks.avg_won_count) ? 0 : comparison.benchmarks.avg_won_count).toFixed(1)}\n`;
      output += `- Won Revenue: ${formatCurrency(comparison.benchmarks.avg_won_revenue)}\n`;
      output += `- Win Rate: ${formatPercent(comparison.benchmarks.avg_win_rate)}\n`;
      output += `- Avg Deal Size: ${formatCurrency(comparison.benchmarks.avg_deal_size)}\n`;
      output += `- Avg Cycle Days: ${Math.round(comparison.benchmarks.avg_cycle_days)}\n`;
    }
  }

  return output;
}

// Format activity search results
export function formatActivityList(data: PaginatedResponse<ActivityDetail>, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(data, null, 2);
  }

  if (format === ResponseFormat.CSV) {
    return formatRecordsAsCSV(data.items);
  }

  let output = `## CRM Activities (${data.count} of ${data.total})\n\n`;

  if (data.items.length === 0) {
    output += '_No activities found matching your criteria._\n';
  } else {
    for (let i = 0; i < data.items.length; i++) {
      const activity = data.items[i];
      const statusEmoji = activity.activity_status === 'overdue' ? '🔴' :
                          activity.activity_status === 'today' ? '🟡' :
                          activity.activity_status === 'upcoming' ? '🟢' : '✅';

      output += `${data.offset + i + 1}. ${statusEmoji} **${activity.summary || 'No Summary'}** (ID: ${activity.id})\n`;
      output += `   - Type: ${getRelationName(activity.activity_type_id)} | Due: ${formatDate(activity.date_deadline)}\n`;
      output += `   - Assigned: ${getRelationName(activity.user_id)} | Status: ${activity.activity_status || '-'}\n`;
      if (activity.res_name) {
        output += `   - Linked to: ${formatLinkedName(activity.res_id, activity.res_name, 'crm.lead')} (ID: ${activity.res_id})\n`;
      }
      output += '\n';
    }
  }

  output += '---\n';
  output += `**Showing:** ${data.offset + 1}-${data.offset + data.count} of ${data.total}`;

  if (data.has_more) {
    output += ` | **Next page:** Use offset=${data.next_offset}`;
  }

  output += '\n\n**Legend:** 🔴 Overdue | 🟡 Today | 🟢 Upcoming | ✅ Done';

  return output;
}

// Format export result (file-based export)
export function formatExportResult(result: ExportResult, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(result, null, 2);
  }

  let output = `## Export Complete\n\n`;

  // Format file size in human-readable format
  const bytes = result.size_bytes;
  let sizeStr: string;
  if (bytes < 1024) {
    sizeStr = `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    sizeStr = `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    sizeStr = `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  // Format duration
  const durationSec = (result.export_duration_ms / 1000).toFixed(1);

  output += `| Property | Value |\n`;
  output += `|----------|-------|\n`;
  output += `| Status | ${result.success ? 'Success' : 'Failed'} |\n`;
  output += `| Filename | \`${result.filename}\` |\n`;
  output += `| Records | ${result.record_count.toLocaleString()} |\n`;
  if (result.total_available > result.record_count) {
    output += `| Available | ${result.total_available.toLocaleString()} |\n`;
  }
  output += `| Format | ${result.format.toUpperCase()} |\n`;
  output += `| Size | ${sizeStr} |\n`;
  output += `| Duration | ${durationSec}s |\n`;
  output += `| Location | \`${result.file_path}\` |\n`;

  output += '\n';

  if (result.warning) {
    output += `> **Note:** ${result.warning}\n\n`;
  }

  output += `### Next Steps\n`;
  output += `${result.instructions}\n\n`;

  // Format-specific tips
  if (result.format === 'xlsx') {
    output += `**To open:** Double-click the file or import into Excel/Power BI\n`;
  } else if (result.format === 'csv') {
    output += `**To open:** Import into Excel, Google Sheets, or any spreadsheet application\n`;
  } else if (result.format === 'json') {
    output += `**To use:** Parse with any JSON-compatible tool or programming language\n`;
  }

  return output;
}

// Format pipeline summary with weighted revenue
export function formatPipelineSummaryWithWeighted(stages: PipelineSummaryWithWeighted[], format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify({ stages }, null, 2);
  }

  let output = '## Pipeline Summary (with Weighted Revenue)\n\n';

  const totalRevenue = stages.reduce((sum, s) => sum + s.total_revenue, 0);
  const totalWeighted = stages.reduce((sum, s) => sum + s.weighted_revenue, 0);
  const totalCount = stages.reduce((sum, s) => sum + s.count, 0);

  output += `**Total Pipeline:** ${totalCount} opportunities | ${formatCurrency(totalRevenue)}\n`;
  output += `**Total Weighted Pipeline:** ${formatCurrency(totalWeighted)}\n\n`;

  output += '| Stage | Count | Revenue | Weighted | Avg Prob |\n';
  output += '|-------|-------|---------|----------|----------|\n';

  for (const stage of stages) {
    output += `| ${stage.stage_name} | ${stage.count} | ${formatCurrency(stage.total_revenue)} | ${formatCurrency(stage.weighted_revenue)} | ${formatPercent(stage.avg_probability)} |\n`;
  }

  if (stages.some(s => s.opportunities && s.opportunities.length > 0)) {
    output += '\n### Top Opportunities by Stage\n';
    for (const stage of stages) {
      if (stage.opportunities && stage.opportunities.length > 0) {
        output += `\n**${stage.stage_name}:**\n`;
        for (const opp of stage.opportunities) {
          output += `- ${formatLinkedName(opp.id, opp.name, 'crm.lead')}: ${formatCurrency(opp.expected_revenue)} (${formatPercent(opp.probability)})\n`;
        }
      }
    }
  }

  return output;
}

// Format extended lead list item (with additional fields)
export function formatLeadListItemExtended(lead: CrmLead): string {
  let output = `- **${formatLinkedName(lead.id, lead.name, 'crm.lead')}** (ID: ${lead.id})\n`;
  output += `  Contact: ${getContactName(lead)} | ${lead.email_from || '-'}\n`;
  output += `  Stage: ${getRelationName(lead.stage_id)} | Revenue: ${formatCurrency(lead.expected_revenue)} | Prob: ${formatPercent(lead.probability)}\n`;
  output += `  Salesperson: ${getRelationName(lead.user_id)} | Team: ${getRelationName(lead.team_id)}\n`;

  // Address (now includes state)
  const address = [lead.street, lead.city, getRelationName(lead.state_id), getRelationName(lead.country_id)].filter(x => x && x !== '-').join(', ');
  if (address) {
    output += `  Location: ${address}\n`;
  }

  // Source/Medium/Campaign
  const source = getRelationName(lead.source_id);
  const medium = getRelationName(lead.medium_id);
  const campaign = getRelationName(lead.campaign_id);
  if (source !== '-' || medium !== '-' || campaign !== '-') {
    output += `  Source: ${source} | Medium: ${medium} | Campaign: ${campaign}\n`;
  }

  // Deadline
  if (lead.date_deadline) {
    output += `  Deadline: ${formatDate(lead.date_deadline)}\n`;
  }

  // Partner
  const partner = getRelationName(lead.partner_id);
  if (partner !== '-') {
    output += `  Partner: ${partner}\n`;
  }

  // Description (truncated, HTML stripped)
  if (lead.description) {
    output += `  Notes: ${truncateText(stripHtml(lead.description), 150)}\n`;
  }

  return output;
}

// Format states list (for odoo_crm_list_states tool)
export function formatStatesList(states: StateWithStats[], countryCode: string, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify({ states, country_code: countryCode }, null, 2);
  }

  let output = `## States/Territories (${countryCode})\n\n`;

  if (states.length === 0) {
    output += '_No states found for this country._\n';
    return output;
  }

  // Check if we have stats
  const hasStats = states.some(s => s.opportunity_count !== undefined);

  if (hasStats) {
    output += '| ID | State | Code | Opportunities | Won | Lost | Revenue |\n';
    output += '|----|-------|------|---------------|-----|------|----------|\n';
    for (const state of states) {
      output += `| ${state.id} | ${state.name} | ${state.code || '-'} | ${state.opportunity_count?.toLocaleString() || '-'} | ${state.won_count?.toLocaleString() || '-'} | ${state.lost_count?.toLocaleString() || '-'} | ${formatCurrency(state.total_revenue)} |\n`;
    }
  } else {
    output += '| ID | State | Code |\n';
    output += '|----|-------|------|\n';
    for (const state of states) {
      output += `| ${state.id} | ${state.name} | ${state.code || '-'} |\n`;
    }
  }

  return output;
}

// Format state comparison (for odoo_crm_compare_states tool)
export function formatStateComparison(comparison: StateComparison, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(comparison, null, 2);
  }

  let output = `## State Performance Comparison\n\n`;

  if (comparison.period) {
    output += `**Period:** ${comparison.period}\n\n`;
  }

  if (comparison.states.length === 0) {
    output += '_No data available for comparison._\n';
    return output;
  }

  output += '| State | Won | Lost | Win Rate | Won Revenue | Lost Revenue | Avg Deal |\n';
  output += '|-------|-----|------|----------|-------------|--------------|----------|\n';

  for (const state of comparison.states) {
    output += `| ${state.state_name} | ${state.won_count.toLocaleString()} | ${state.lost_count.toLocaleString()} | ${formatPercent(state.win_rate)} | ${formatCurrency(state.won_revenue)} | ${formatCurrency(state.lost_revenue)} | ${formatCurrency(state.avg_deal_size)} |\n`;
  }

  // Totals
  if (comparison.totals) {
    output += '\n### Summary\n';
    output += `- **Total Won:** ${comparison.totals.total_won.toLocaleString()} (${formatCurrency(comparison.totals.total_won_revenue)})\n`;
    output += `- **Total Lost:** ${comparison.totals.total_lost.toLocaleString()} (${formatCurrency(comparison.totals.total_lost_revenue)})\n`;
    output += `- **Overall Win Rate:** ${formatPercent(comparison.totals.overall_win_rate)}\n`;
  }

  return output;
}

// =============================================================================
// CSV FORMATTERS - Generic CSV output for any record array
// =============================================================================

/**
 * Format any array of records as CSV.
 * Handles special cases like Odoo relation fields [id, name] and arrays.
 *
 * @param records - Array of objects to format
 * @param fields - Optional field order (uses object keys if not specified)
 * @returns CSV string with header row
 *
 * @example
 * // Basic usage
 * formatRecordsAsCSV(leads)
 *
 * @example
 * // With specific field order
 * formatRecordsAsCSV(leads, ['id', 'name', 'email_from', 'expected_revenue'])
 */
export function formatRecordsAsCSV<T extends Record<string, unknown>>(
  records: T[],
  fields?: string[]
): string {
  if (records.length === 0) {
    return fields ? fields.join(',') : '';
  }

  // Determine columns - use provided fields or object keys
  const columns = fields || Object.keys(records[0]);

  // Helper to escape CSV values
  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) return '';

    // Handle Odoo relation fields: [id, name] -> name
    if (Array.isArray(value)) {
      if (value.length === 2 && typeof value[0] === 'number') {
        return escapeCSV(value[1]);  // Return the name part
      }
      // Handle other arrays (like tag_ids)
      return value.map(v => {
        if (Array.isArray(v) && v.length === 2 && typeof v[0] === 'number') {
          return String(v[1]);
        }
        return String(v);
      }).join(';');
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    // Handle dates (format nicely)
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    // Handle objects
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    // Convert to string
    const str = String(value);

    // Escape if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  };

  // Header row
  const header = columns.join(',');

  // Data rows
  const rows = records.map(record =>
    columns.map(col => escapeCSV(record[col])).join(',')
  );

  return [header, ...rows].join('\n');
}

// =============================================================================
// FIELD DISCOVERY FORMATTERS - For odoo_crm_list_fields tool
// =============================================================================

/**
 * Information about a single Odoo field.
 * Used by the list_fields discovery tool.
 */
export interface FieldInfo {
  name: string;
  label: string;
  type: string;
  required: boolean;
  description?: string;
}

/**
 * Format a list of fields for display.
 * Supports markdown, JSON, and CSV output formats.
 *
 * @param model - The Odoo model name (e.g., 'crm.lead')
 * @param fields - Array of field information
 * @param format - Output format (markdown, json, csv)
 * @param modelType - The model type for showing presets ('lead', 'contact', etc.)
 * @returns Formatted string
 */
export function formatFieldsList(
  model: string,
  fields: FieldInfo[],
  format: ResponseFormat,
  modelType?: 'lead' | 'contact' | 'activity' | 'lost' | 'won'
): string {
  // Get presets for this model type if available
  const presets = modelType ? FIELD_PRESETS[modelType] : undefined;

  // JSON format - structured data
  if (format === ResponseFormat.JSON) {
    return JSON.stringify({
      model,
      field_count: fields.length,
      fields,
      presets: presets ? Object.keys(presets) : undefined
    }, null, 2);
  }

  // CSV format - compact, token-efficient
  if (format === ResponseFormat.CSV) {
    const header = 'name,label,type,required';
    const rows = fields.map(f =>
      `${f.name},"${f.label.replace(/"/g, '""')}",${f.type},${f.required}`
    );
    return [header, ...rows].join('\n');
  }

  // Markdown format - human-readable with presets shown
  let output = `## Available Fields for \`${model}\`\n\n`;
  output += `**Total fields:** ${fields.length}\n\n`;

  // Show presets if available
  if (presets && Object.keys(presets).length > 0) {
    output += `### Field Presets\n`;
    output += `Use these names in the \`fields\` parameter for quick selection:\n\n`;

    for (const [presetName, presetFields] of Object.entries(presets)) {
      const fieldCount = presetFields.length;
      const preview = presetFields.slice(0, 4).join(', ');
      const suffix = fieldCount > 4 ? ', ...' : '';
      output += `- **\`${presetName}\`**: ${fieldCount} fields (${preview}${suffix})\n`;
    }
    output += `\n`;
  }

  // Show example usage
  output += `### Usage Examples\n`;
  output += `\`\`\`\n`;
  output += `// Use a preset\n`;
  output += `{ "fields": "basic" }\n\n`;
  output += `// Use custom fields\n`;
  output += `{ "fields": ["name", "email_from", "expected_revenue"] }\n`;
  output += `\`\`\`\n\n`;

  // Show all fields
  output += `### All Fields\n\n`;
  output += `| Field Name | Label | Type | Required |\n`;
  output += `|------------|-------|------|----------|\n`;

  for (const field of fields) {
    const required = field.required ? 'Yes' : '-';
    // Escape pipe characters in labels
    const safeLabel = field.label.replace(/\|/g, '\\|');
    output += `| \`${field.name}\` | ${safeLabel} | ${field.type} | ${required} |\n`;
  }

  return output;
}

// =============================================================================
// VECTOR SEARCH FORMATTERS - For semantic search and pattern discovery tools
// =============================================================================

/**
 * Format semantic search results.
 * Shows opportunities ranked by semantic similarity to the query.
 *
 * @param matches - Vector search matches with scores
 * @param leads - Full CRM lead data from Odoo
 * @param query - Original search query
 * @param format - Output format (markdown or json)
 * @returns Formatted string
 */
export function formatSemanticSearchResults(
  matches: VectorMatch[],
  leads: CrmLead[],
  query: string,
  format: ResponseFormat
): string {
  // Build a map of lead ID to lead data for fast lookup
  const leadMap = new Map<number, CrmLead>();
  for (const lead of leads) {
    leadMap.set(lead.id, lead);
  }

  // JSON format - return structured data
  if (format === ResponseFormat.JSON) {
    const results = matches.map(match => {
      const lead = leadMap.get(parseInt(match.id));
      return {
        id: parseInt(match.id),
        name: lead?.name || match.metadata?.name || 'Unknown',
        similarity_score: Math.round(match.score * 100),
        stage: getRelationName(lead?.stage_id),
        expected_revenue: lead?.expected_revenue || 0,
        probability: lead?.probability || 0,
        salesperson: getRelationName(lead?.user_id),
        team: getRelationName(lead?.team_id),
        sector: lead?.sector || match.metadata?.sector || null,
        city: lead?.city || match.metadata?.city || null,
        state: getRelationName(lead?.state_id),
        is_won: match.metadata?.is_won || false,
        is_lost: match.metadata?.is_lost || false,
      };
    });

    return JSON.stringify({
      query,
      result_count: matches.length,
      results,
    }, null, 2);
  }

  // Markdown format - human-readable
  let output = `## Semantic Search Results\n\n`;
  output += `**Query:** "${query}"\n`;
  output += `**Matches:** ${matches.length}\n\n`;

  if (matches.length === 0) {
    output += '_No matching opportunities found._\n';
    return output;
  }

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const lead = leadMap.get(parseInt(match.id));
    const similarity = Math.round(match.score * 100);

    // Similarity indicator (visual bar)
    const similarityBar = similarity >= 80 ? '🟢' : similarity >= 60 ? '🟡' : '🟠';

    output += `### ${i + 1}. ${formatLinkedName(parseInt(match.id), lead?.name || match.metadata?.name || 'Unknown', 'crm.lead')}\n`;
    output += `${similarityBar} **${similarity}% match** | ID: ${match.id}\n\n`;

    if (lead) {
      // Status badges
      const statusBadges: string[] = [];
      if (match.metadata?.is_won) statusBadges.push('✅ Won');
      if (match.metadata?.is_lost) statusBadges.push('❌ Lost');
      if (!match.metadata?.is_won && !match.metadata?.is_lost) statusBadges.push('🔵 Active');

      output += `- **Status:** ${statusBadges.join(' ')}\n`;
      output += `- **Stage:** ${getRelationName(lead.stage_id)} | **Revenue:** ${formatCurrency(lead.expected_revenue)} | **Prob:** ${formatPercent(lead.probability)}\n`;
      output += `- **Contact:** ${getContactName(lead)} | ${lead.email_from || '-'}\n`;
      output += `- **Salesperson:** ${getRelationName(lead.user_id)} | **Team:** ${getRelationName(lead.team_id)}\n`;

      const location = [lead.city, getRelationName(lead.state_id)].filter(x => x && x !== '-').join(', ');
      if (location) {
        output += `- **Location:** ${location}\n`;
      }

      if (lead.sector) {
        output += `- **Sector:** ${lead.sector}\n`;
      }
    } else if (match.metadata) {
      // Fallback to metadata if lead not found
      output += `- **Stage:** ${match.metadata.stage_name || '-'}\n`;
      output += `- **Revenue:** ${formatCurrency(match.metadata.expected_revenue)}\n`;
      output += `- **Sector:** ${match.metadata.sector || '-'}\n`;
    }

    output += '\n';
  }

  return output;
}

/**
 * Format similar deals results.
 * Shows opportunities similar to a reference deal.
 *
 * @param matches - Vector search matches with scores
 * @param leads - Full CRM lead data from Odoo
 * @param reference - Reference deal metadata
 * @param format - Output format (markdown or json)
 * @returns Formatted string
 */
export function formatSimilarDeals(
  matches: VectorMatch[],
  leads: CrmLead[],
  reference: VectorMetadata,
  format: ResponseFormat
): string {
  // Build a map of lead ID to lead data for fast lookup
  const leadMap = new Map<number, CrmLead>();
  for (const lead of leads) {
    leadMap.set(lead.id, lead);
  }

  // JSON format
  if (format === ResponseFormat.JSON) {
    const results = matches.map(match => {
      const lead = leadMap.get(parseInt(match.id));
      return {
        id: parseInt(match.id),
        name: lead?.name || match.metadata?.name || 'Unknown',
        similarity_score: Math.round(match.score * 100),
        stage: getRelationName(lead?.stage_id),
        expected_revenue: lead?.expected_revenue || 0,
        outcome: match.metadata?.is_won ? 'won' : match.metadata?.is_lost ? 'lost' : 'active',
        salesperson: getRelationName(lead?.user_id),
        sector: lead?.sector || match.metadata?.sector || null,
      };
    });

    return JSON.stringify({
      reference_deal: {
        id: reference.odoo_id,
        name: reference.name,
        stage: reference.stage_name,
        revenue: reference.expected_revenue,
        outcome: reference.is_won ? 'won' : reference.is_lost ? 'lost' : 'active',
      },
      similar_deals_count: matches.length,
      similar_deals: results,
    }, null, 2);
  }

  // Markdown format
  let output = `## Similar Deals\n\n`;
  output += `### Reference Deal\n`;
  output += `- **${formatLinkedName(reference.odoo_id, reference.name, 'crm.lead')}** (ID: ${reference.odoo_id})\n`;
  output += `- Stage: ${reference.stage_name} | Revenue: ${formatCurrency(reference.expected_revenue)}\n`;

  const refStatus = reference.is_won ? '✅ Won' : reference.is_lost ? '❌ Lost' : '🔵 Active';
  output += `- Status: ${refStatus}\n\n`;

  output += `### Similar Opportunities (${matches.length})\n\n`;

  if (matches.length === 0) {
    output += '_No similar deals found._\n';
    return output;
  }

  // Group by outcome for better presentation
  const won = matches.filter(m => m.metadata?.is_won);
  const lost = matches.filter(m => m.metadata?.is_lost);
  const active = matches.filter(m => !m.metadata?.is_won && !m.metadata?.is_lost);

  const formatDealGroup = (deals: VectorMatch[], title: string, emoji: string): string => {
    if (deals.length === 0) return '';

    let groupOutput = `#### ${emoji} ${title} (${deals.length})\n\n`;

    for (const match of deals) {
      const lead = leadMap.get(parseInt(match.id));
      const similarity = Math.round(match.score * 100);

      groupOutput += `- **${formatLinkedName(parseInt(match.id), lead?.name || match.metadata?.name || 'Unknown', 'crm.lead')}** - ${similarity}% similar\n`;
      groupOutput += `  Revenue: ${formatCurrency(lead?.expected_revenue || match.metadata?.expected_revenue)} | ${getRelationName(lead?.stage_id) || match.metadata?.stage_name || '-'}\n`;

      if (lead?.sector || match.metadata?.sector) {
        groupOutput += `  Sector: ${lead?.sector || match.metadata?.sector}\n`;
      }
    }
    groupOutput += '\n';
    return groupOutput;
  };

  output += formatDealGroup(won, 'Won Deals', '✅');
  output += formatDealGroup(lost, 'Lost Deals', '❌');
  output += formatDealGroup(active, 'Active Deals', '🔵');

  return output;
}

/**
 * Format pattern discovery results.
 * Shows clusters of similar opportunities with themes.
 *
 * @param result - Pattern discovery result with clusters
 * @param format - Output format (markdown or json)
 * @returns Formatted string
 */
export function formatPatternDiscovery(
  result: PatternDiscoveryResult,
  format: ResponseFormat
): string {
  // JSON format
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(result, null, 2);
  }

  // Markdown format
  let output = `## Pattern Discovery Results\n\n`;
  output += `**Analysis Type:** ${result.analysisType.replace(/_/g, ' ')}\n`;
  output += `**Records Analyzed:** ${result.totalRecordsAnalyzed.toLocaleString()}\n`;
  output += `**Clusters Found:** ${result.numClusters}\n`;
  output += `**Analysis Time:** ${(result.durationMs / 1000).toFixed(1)}s\n\n`;

  if (result.clusters.length === 0) {
    output += '_Not enough data for pattern analysis._\n';
    return output;
  }

  // Insights section
  if (result.insights && result.insights.length > 0) {
    output += `### Key Insights\n\n`;
    for (const insight of result.insights) {
      output += `💡 ${insight}\n`;
    }
    output += '\n';
  }

  // Cluster details
  output += `### Cluster Details\n\n`;

  for (const cluster of result.clusters) {
    const sizePercent = Math.round((cluster.size / result.totalRecordsAnalyzed) * 100);

    output += `#### Cluster ${cluster.clusterId + 1}: ${cluster.size} opportunities (${sizePercent}%)\n\n`;
    output += `**Summary:** ${cluster.summary}\n\n`;

    // Top sectors
    if (cluster.commonThemes.topSectors.length > 0) {
      output += `**Top Sectors:**\n`;
      for (const sector of cluster.commonThemes.topSectors) {
        output += `- ${sector.sector}: ${sector.count} deals\n`;
      }
      output += '\n';
    }

    // Lost reasons (if applicable)
    if (cluster.commonThemes.topLostReasons.length > 0) {
      output += `**Top Lost Reasons:**\n`;
      for (const reason of cluster.commonThemes.topLostReasons) {
        output += `- ${reason.reason}: ${reason.count} deals\n`;
      }
      output += '\n';
    }

    // Revenue stats
    if (cluster.commonThemes.avgRevenue > 0) {
      output += `**Revenue:** Avg ${formatCurrency(cluster.commonThemes.avgRevenue)}`;
      if (cluster.commonThemes.revenueRange) {
        output += ` (${formatCurrency(cluster.commonThemes.revenueRange.min)} - ${formatCurrency(cluster.commonThemes.revenueRange.max)})`;
      }
      output += '\n\n';
    }

    // Representative deals
    if (cluster.representativeDeals.length > 0) {
      output += `**Representative Deals:**\n`;
      for (const deal of cluster.representativeDeals) {
        const similarity = Math.round(deal.similarity * 100);
        output += `- ${formatLinkedName(deal.id, deal.name, 'crm.lead')} (${similarity}% to center)\n`;
      }
      output += '\n';
    }

    output += '---\n\n';
  }

  return output;
}

/**
 * Format sync result.
 * Shows the outcome of a vector sync operation.
 *
 * @param result - Sync operation result
 * @returns Formatted string
 */
export function formatSyncResult(result: SyncResult): string {
  let output = `## Sync Result\n\n`;

  const statusEmoji = result.success ? '✅' : '❌';
  output += `**Status:** ${statusEmoji} ${result.success ? 'Success' : 'Failed'}\n`;
  output += `**Duration:** ${(result.durationMs / 1000).toFixed(1)}s\n`;
  output += `**Sync Version:** ${result.syncVersion}\n\n`;

  output += `### Summary\n`;
  output += `| Metric | Count |\n`;
  output += `|--------|-------|\n`;
  output += `| Records Synced | ${result.recordsSynced.toLocaleString()} |\n`;
  output += `| Records Failed | ${result.recordsFailed.toLocaleString()} |\n`;
  output += `| Records Deleted | ${result.recordsDeleted.toLocaleString()} |\n`;

  if (result.errors && result.errors.length > 0) {
    output += `\n### Errors\n`;
    for (const error of result.errors.slice(0, 5)) {
      output += `- ${error}\n`;
    }
    if (result.errors.length > 5) {
      output += `- _...and ${result.errors.length - 5} more errors_\n`;
    }
  }

  return output;
}

/**
 * Format vector status.
 * Shows the health and state of the vector infrastructure.
 *
 * @param status - Vector system status
 * @returns Formatted string
 */
export function formatVectorStatus(status: VectorStatus): string {
  let output = `## Vector Infrastructure Status\n\n`;

  // Overall status
  const allGreen = status.enabled && status.qdrantConnected && status.voyageConnected;
  const statusEmoji = allGreen ? '🟢' : status.enabled ? '🟡' : '🔴';
  output += `**Overall:** ${statusEmoji} ${allGreen ? 'Healthy' : status.enabled ? 'Degraded' : 'Disabled'}\n\n`;

  // Service status table
  output += `### Service Status\n\n`;
  output += `| Service | Status |\n`;
  output += `|---------|--------|\n`;
  output += `| Vector Features | ${status.enabled ? '✅ Enabled' : '❌ Disabled'} |\n`;
  output += `| Qdrant (Vector DB) | ${status.qdrantConnected ? '✅ Connected' : '❌ Disconnected'} |\n`;
  output += `| Voyage AI (Embeddings) | ${status.voyageConnected ? '✅ Available' : '❌ Unavailable'} |\n`;
  output += `| Circuit Breaker | ${formatCircuitBreakerState(status.circuitBreakerState)} |\n`;

  // Collection info
  output += `\n### Collection Info\n\n`;
  output += `- **Collection:** ${status.collectionName || '-'}\n`;
  output += `- **Total Vectors:** ${status.totalVectors.toLocaleString()}\n`;

  // Sync status
  output += `\n### Sync Status\n\n`;
  output += `- **Last Sync:** ${status.lastSync ? formatDate(status.lastSync) : 'Never'}\n`;
  output += `- **Sync Version:** ${status.syncVersion}\n`;

  // Error info
  if (status.errorMessage) {
    output += `\n### ⚠️ Error\n\n`;
    output += `${status.errorMessage}\n`;
  }

  // Recommendations
  output += `\n### Recommendations\n\n`;
  if (!status.enabled) {
    output += `- Set \`VECTOR_ENABLED=true\` to enable vector features\n`;
  }
  if (!status.qdrantConnected) {
    output += `- Check Qdrant connection at \`QDRANT_HOST\`\n`;
  }
  if (!status.voyageConnected) {
    output += `- Verify \`VOYAGE_API_KEY\` is set correctly\n`;
  }
  if (status.totalVectors === 0 && status.qdrantConnected) {
    output += `- Run \`odoo_crm_sync_embeddings\` with action="full_rebuild" to generate embeddings\n`;
  }
  if (allGreen && status.totalVectors > 0) {
    output += `- All systems operational. You can use semantic search tools.\n`;
  }

  return output;
}

/**
 * Format circuit breaker state for display.
 */
function formatCircuitBreakerState(state: string): string {
  switch (state) {
    case 'CLOSED':
      return '🟢 Closed (healthy)';
    case 'OPEN':
      return '🔴 Open (blocking)';
    case 'HALF_OPEN':
      return '🟡 Half-Open (testing)';
    default:
      return state;
  }
}
