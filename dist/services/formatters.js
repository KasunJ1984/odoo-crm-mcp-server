import { CONTEXT_LIMITS, ResponseFormat, FIELD_PRESETS } from '../constants.js';
import { stripHtml, getContactName } from '../utils/html-utils.js';
import { formatLinkedName } from '../utils/odoo-urls.js';
// Format currency value
export function formatCurrency(value) {
    if (value === undefined || value === null)
        return '-';
    return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}
// Format percentage (with NaN guard)
export function formatPercent(value) {
    if (value === undefined || value === null || isNaN(value))
        return '-';
    return `${Math.round(value)}%`;
}
// Format date
export function formatDate(dateStr) {
    if (!dateStr)
        return '-';
    try {
        return new Date(dateStr).toLocaleDateString('en-AU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    catch {
        return dateStr;
    }
}
// Extract name from Odoo relation field [id, name]
export function getRelationName(field) {
    return field?.[1] || '-';
}
// Truncate text to preserve context
export function truncateText(text, maxLength = 200) {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength - 3) + '...';
}
// Format lead for list view (minimal fields)
export function formatLeadListItem(lead) {
    // Build location string from city and state
    const location = [lead.city, getRelationName(lead.state_id)].filter(x => x && x !== '-').join(', ');
    return `- **${formatLinkedName(lead.id, lead.name, 'crm.lead')}** (ID: ${lead.id})
  Contact: ${getContactName(lead)} | ${lead.email_from || '-'}
  Stage: ${getRelationName(lead.stage_id)} | Revenue: ${formatCurrency(lead.expected_revenue)} | Prob: ${formatPercent(lead.probability)}
  Sector: ${lead.sector || '-'} | Lead Source: ${getRelationName(lead.lead_source_id)} | Spec: ${getRelationName(lead.specification_id)}
  Location: ${location || '-'}`;
}
// Format lead detail view
export function formatLeadDetail(lead) {
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
export function formatLeadList(data, format) {
    if (format === ResponseFormat.JSON) {
        return JSON.stringify(data, null, 2);
    }
    if (format === ResponseFormat.CSV) {
        return formatRecordsAsCSV(data.items);
    }
    let output = `## Leads/Opportunities (${data.count} of ${data.total})\n\n`;
    if (data.items.length === 0) {
        output += '_No leads found matching your criteria._\n';
    }
    else {
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
export function formatPipelineSummary(stages, format) {
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
export function formatSalesAnalytics(analytics, format) {
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
export function formatActivitySummary(summary, format) {
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
export function formatContactList(data, format) {
    if (format === ResponseFormat.JSON) {
        return JSON.stringify(data, null, 2);
    }
    if (format === ResponseFormat.CSV) {
        return formatRecordsAsCSV(data.items);
    }
    let output = `## Contacts (${data.count} of ${data.total})\n\n`;
    if (data.items.length === 0) {
        output += '_No contacts found matching your criteria._\n';
    }
    else {
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
export function checkContextLimit(response) {
    if (response.length > CONTEXT_LIMITS.MAX_RESPONSE_CHARS) {
        return {
            ok: false,
            note: `Response truncated. Use pagination (smaller limit) or filters to reduce data.`
        };
    }
    return { ok: true };
}
// Format lost reasons list
export function formatLostReasonsList(reasons, format) {
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
export function formatLostAnalysis(analysis, groupBy, format) {
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
export function formatLostOpportunitiesList(data, format) {
    if (format === ResponseFormat.JSON) {
        return JSON.stringify(data, null, 2);
    }
    if (format === ResponseFormat.CSV) {
        return formatRecordsAsCSV(data.items);
    }
    let output = `## Lost Opportunities (${data.count} of ${data.total})\n\n`;
    if (data.items.length === 0) {
        output += '_No lost opportunities found matching your criteria._\n';
    }
    else {
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
export function formatLostTrends(trends, format) {
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
    }
    else {
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
export function formatWonOpportunitiesList(data, format) {
    if (format === ResponseFormat.JSON) {
        return JSON.stringify(data, null, 2);
    }
    if (format === ResponseFormat.CSV) {
        return formatRecordsAsCSV(data.items);
    }
    let output = `## Won Opportunities (${data.count} of ${data.total})\n\n`;
    if (data.items.length === 0) {
        output += '_No won opportunities found matching your criteria._\n';
    }
    else {
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
export function formatWonAnalysis(analysis, groupBy, format) {
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
export function formatWonTrends(trends, format) {
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
    }
    else {
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
export function formatSalespeopleList(salespeople, format) {
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
export function formatTeamsList(teams, format) {
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
export function formatPerformanceComparison(comparison, format) {
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
    }
    else if (comparison.entities) {
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
export function formatActivityList(data, format) {
    if (format === ResponseFormat.JSON) {
        return JSON.stringify(data, null, 2);
    }
    if (format === ResponseFormat.CSV) {
        return formatRecordsAsCSV(data.items);
    }
    let output = `## CRM Activities (${data.count} of ${data.total})\n\n`;
    if (data.items.length === 0) {
        output += '_No activities found matching your criteria._\n';
    }
    else {
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
export function formatExportResult(result, format) {
    if (format === ResponseFormat.JSON) {
        return JSON.stringify(result, null, 2);
    }
    let output = `## Export Complete\n\n`;
    // Format file size in human-readable format
    const bytes = result.size_bytes;
    let sizeStr;
    if (bytes < 1024) {
        sizeStr = `${bytes} B`;
    }
    else if (bytes < 1024 * 1024) {
        sizeStr = `${(bytes / 1024).toFixed(1)} KB`;
    }
    else {
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
    }
    else if (result.format === 'csv') {
        output += `**To open:** Import into Excel, Google Sheets, or any spreadsheet application\n`;
    }
    else if (result.format === 'json') {
        output += `**To use:** Parse with any JSON-compatible tool or programming language\n`;
    }
    return output;
}
// Format pipeline summary with weighted revenue
export function formatPipelineSummaryWithWeighted(stages, format) {
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
export function formatLeadListItemExtended(lead) {
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
export function formatStatesList(states, countryCode, format) {
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
    }
    else {
        output += '| ID | State | Code |\n';
        output += '|----|-------|------|\n';
        for (const state of states) {
            output += `| ${state.id} | ${state.name} | ${state.code || '-'} |\n`;
        }
    }
    return output;
}
// Format state comparison (for odoo_crm_compare_states tool)
export function formatStateComparison(comparison, format) {
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
export function formatRecordsAsCSV(records, fields) {
    if (records.length === 0) {
        return fields ? fields.join(',') : '';
    }
    // Determine columns - use provided fields or object keys
    const columns = fields || Object.keys(records[0]);
    // Helper to escape CSV values
    const escapeCSV = (value) => {
        if (value === null || value === undefined)
            return '';
        // Handle Odoo relation fields: [id, name] -> name
        if (Array.isArray(value)) {
            if (value.length === 2 && typeof value[0] === 'number') {
                return escapeCSV(value[1]); // Return the name part
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
    const rows = records.map(record => columns.map(col => escapeCSV(record[col])).join(','));
    return [header, ...rows].join('\n');
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
export function formatFieldsList(model, fields, format, modelType) {
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
        const rows = fields.map(f => `${f.name},"${f.label.replace(/"/g, '""')}",${f.type},${f.required}`);
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
// COLOR ANALYSIS FORMATTERS - For color trends and RFQ search tools
// =============================================================================
/**
 * Format color trends summary for display.
 * Shows overall color distribution, trends over time, and detection rate.
 *
 * @param summary - The color trends summary data
 * @param format - Output format (markdown, json, csv)
 * @returns Formatted string
 */
export function formatColorTrends(summary, format) {
    if (format === ResponseFormat.JSON) {
        return JSON.stringify(summary, null, 2);
    }
    let output = `## Color Trends Analysis\n\n`;
    output += `**Period:** ${summary.period} | **Granularity:** ${summary.granularity}\n\n`;
    // Overall Summary
    output += `### Overall Summary\n`;
    output += `- **Top Color:** ${summary.overall_summary.top_color} (${summary.overall_summary.top_color_count} RFQs, ${formatPercent(summary.overall_summary.top_color_percentage)})\n`;
    output += `- **RFQs with Color:** ${summary.overall_summary.total_rfqs_with_color.toLocaleString()}\n`;
    output += `- **RFQs without Color:** ${summary.overall_summary.total_rfqs_without_color.toLocaleString()}\n`;
    output += `- **Detection Rate:** ${formatPercent(summary.overall_summary.color_detection_rate)}\n\n`;
    // Color Distribution Table
    if (summary.color_distribution && summary.color_distribution.length > 0) {
        output += `### Color Distribution\n`;
        output += '| Color | Count | % of RFQs | Avg Revenue |\n';
        output += '|-------|-------|-----------|-------------|\n';
        for (const color of summary.color_distribution) {
            output += `| ${color.color_category} | ${color.count.toLocaleString()} | ${formatPercent(color.percentage)} | ${formatCurrency(color.avg_revenue)} |\n`;
        }
        output += '\n';
    }
    // Color Trends (if available)
    if (summary.color_trends && summary.color_trends.length > 0) {
        output += `### Color Trends\n`;
        for (const trend of summary.color_trends) {
            const trendEmoji = trend.trend === 'up' ? '📈' : trend.trend === 'down' ? '📉' : '➡️';
            const changeStr = trend.change_percent !== 0 ? ` (${trend.change_percent > 0 ? '+' : ''}${trend.change_percent}%)` : '';
            output += `- ${trendEmoji} **${trend.color_category}:** ${trend.trend}${changeStr}\n`;
        }
        output += '\n';
    }
    // Period-by-Period Breakdown (compact table)
    if (summary.periods && summary.periods.length > 0) {
        output += `### Period Breakdown\n`;
        output += '| Period | Total RFQs | Total Revenue | Top Colors |\n';
        output += '|--------|------------|---------------|------------|\n';
        for (const period of summary.periods) {
            // Get top 3 colors for this period
            const topColors = period.colors.slice(0, 3).map(c => `${c.color_category} (${c.count})`).join(', ') || 'None';
            output += `| ${period.period_label} | ${period.total_count.toLocaleString()} | ${formatCurrency(period.total_revenue)} | ${topColors} |\n`;
        }
    }
    return output;
}
/**
 * Format a color badge for display.
 * Supports both legacy LeadWithColor and enhanced LeadWithEnhancedColor.
 *
 * @param lead - Lead with color data (legacy or enhanced)
 * @returns Formatted color badge string
 */
function formatColorBadge(lead) {
    // Check for enhanced color data first
    const enhanced = lead.colors;
    if (enhanced?.primary) {
        const { color_code, color_name, color_category } = enhanced.primary;
        const codeStr = color_code ? `[${color_code}] ` : '';
        return `🎨 **${color_category}** (${codeStr}${color_name})`;
    }
    // Fall back to legacy color data
    const color = lead.color;
    if (color && color.color_category !== 'Unknown') {
        return `🎨 **${color.color_category}**${color.raw_color ? ` (${color.raw_color})` : ''}`;
    }
    return '⚪ _No color detected_';
}
/**
 * Format all colors when multiple exist.
 *
 * @param lead - Lead with enhanced color data
 * @returns Formatted string with all colors
 */
function formatAllColors(lead) {
    const enhanced = lead.colors;
    if (enhanced && enhanced.color_count > 1) {
        return enhanced.all_colors
            .map(c => c.color_code ? `${c.color_code} ${c.color_name}` : c.color_name)
            .join(', ');
    }
    return formatColorBadge(lead);
}
/**
 * Format RFQ search results with color badges.
 * Shows paginated list of RFQs with color extraction data.
 * Supports both legacy and enhanced color formats.
 *
 * @param data - The RFQ search result (paginated leads with color)
 * @param format - Output format (markdown, json, csv)
 * @returns Formatted string
 */
export function formatRfqByColorList(data, format) {
    if (format === ResponseFormat.JSON) {
        return JSON.stringify(data, null, 2);
    }
    if (format === ResponseFormat.CSV) {
        // Custom CSV for color data - include enhanced fields if available
        const csvRecords = data.items.map(lead => {
            const enhanced = lead.colors;
            return {
                id: lead.id,
                name: lead.name,
                contact_name: lead.contact_name || '',
                email: lead.email_from || '',
                // Enhanced fields (if available)
                color_code: enhanced?.primary?.color_code || '',
                color_name: enhanced?.primary?.color_name || lead.color?.raw_color || '',
                color_category: enhanced?.primary?.color_category || lead.color?.color_category || 'Unknown',
                full_specification: enhanced?.primary?.full_specification || lead.color?.raw_color || '',
                color_count: enhanced?.color_count || (lead.color?.color_category !== 'Unknown' ? 1 : 0),
                all_colors: enhanced?.all_colors?.map(c => c.full_specification).join('; ') || '',
                extraction_source: enhanced?.extraction_source || lead.color?.extraction_source || 'none',
                expected_revenue: lead.expected_revenue || 0,
                tender_rfq_date: lead.tender_rfq_date || '',
                stage: getRelationName(lead.stage_id),
                salesperson: getRelationName(lead.user_id),
                city: lead.city || '',
                state: getRelationName(lead.state_id)
            };
        });
        return formatRecordsAsCSV(csvRecords);
    }
    // Markdown format
    let output = `## RFQ Search Results (${data.count} of ${data.total})\n\n`;
    if (data.color_filter_applied) {
        output += `**Color Filter:** ${data.color_filter_applied}\n\n`;
    }
    if (data.items.length === 0) {
        output += '_No RFQs found matching your criteria._\n';
    }
    else {
        for (let i = 0; i < data.items.length; i++) {
            const lead = data.items[i];
            const enhanced = lead.colors;
            const color = lead.color;
            // Format color badge (handles both legacy and enhanced)
            const colorBadge = formatColorBadge(lead);
            output += `${data.offset + i + 1}. **${formatLinkedName(lead.id, lead.name, 'crm.lead')}** (ID: ${lead.id})\n`;
            output += `   - Color: ${colorBadge}\n`;
            // Show all colors if multiple (enhanced mode)
            if (enhanced && enhanced.color_count > 1) {
                output += `   - All Colors (${enhanced.color_count}): ${formatAllColors(lead)}\n`;
            }
            output += `   - Contact: ${getContactName(lead)} | ${lead.email_from || '-'}\n`;
            output += `   - Revenue: ${formatCurrency(lead.expected_revenue)} | Stage: ${getRelationName(lead.stage_id)}\n`;
            output += `   - RFQ Date: ${formatDate(lead.tender_rfq_date)} | Created: ${formatDate(lead.create_date)}\n`;
            output += `   - Salesperson: ${getRelationName(lead.user_id)}\n`;
            // Location
            const location = [lead.city, getRelationName(lead.state_id)].filter(x => x && x !== '-').join(', ');
            if (location) {
                output += `   - Location: ${location}\n`;
            }
            // Notes excerpt (if color was extracted from it)
            const extractionSource = enhanced?.extraction_source || color?.extraction_source;
            if (extractionSource && extractionSource !== 'none' && lead.description) {
                const excerpt = truncateText(stripHtml(lead.description), 100);
                output += `   - Notes: _${excerpt}_\n`;
            }
            output += '\n';
        }
    }
    output += '---\n';
    output += `**Showing:** ${data.offset + 1}-${data.offset + data.count} of ${data.total}`;
    if (data.has_more) {
        output += ` | **Next page:** Use offset=${data.next_offset}`;
    }
    output += '\n\n**Color Legend:** 🎨 Detected | ⚪ No color | [CODE] = Product code';
    return output;
}
//# sourceMappingURL=formatters.js.map