import { CONTEXT_LIMITS, ResponseFormat } from '../constants.js';
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
// Format percentage
export function formatPercent(value) {
    if (value === undefined || value === null)
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
    return `- **${lead.name}** (ID: ${lead.id})
  Contact: ${lead.contact_name || '-'} | ${lead.email_from || '-'}
  Stage: ${getRelationName(lead.stage_id)} | Revenue: ${formatCurrency(lead.expected_revenue)} | Prob: ${formatPercent(lead.probability)}`;
}
// Format lead detail view
export function formatLeadDetail(lead) {
    return `## ${lead.name}
**ID:** ${lead.id} | **Type:** ${lead.type || 'opportunity'}

### Contact Information
- **Contact:** ${lead.contact_name || '-'}
- **Email:** ${lead.email_from || '-'}
- **Phone:** ${lead.phone || '-'} | **Mobile:** ${lead.mobile || '-'}
- **Address:** ${[lead.street, lead.city, getRelationName(lead.country_id)].filter(Boolean).join(', ') || '-'}

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

${lead.description ? `### Notes\n${truncateText(lead.description, 500)}` : ''}`;
}
// Format paginated leads response
export function formatLeadList(data, format) {
    if (format === ResponseFormat.JSON) {
        return JSON.stringify(data, null, 2);
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
                output += `  - ${opp.name}: ${formatCurrency(opp.expected_revenue)} (${formatPercent(opp.probability)})\n`;
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
            output += `- ${opp.name}: ${formatCurrency(opp.revenue)} (${formatPercent(opp.probability)}) - ${opp.stage}\n`;
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
    let output = `## Contacts (${data.count} of ${data.total})\n\n`;
    if (data.items.length === 0) {
        output += '_No contacts found matching your criteria._\n';
    }
    else {
        for (const contact of data.items) {
            output += `- **${contact.name}** (ID: ${contact.id})${contact.is_company ? ' 🏢' : ''}\n`;
            output += `  ${contact.email || '-'} | ${contact.phone || contact.mobile || '-'}\n`;
            output += `  ${[contact.city, getRelationName(contact.country_id)].filter(x => x && x !== '-').join(', ') || '-'}\n\n`;
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
    // Top lost opportunities
    if (analysis.top_lost && analysis.top_lost.length > 0) {
        output += `### Top ${analysis.top_lost.length} Largest Lost Opportunities\n`;
        for (let i = 0; i < analysis.top_lost.length; i++) {
            const opp = analysis.top_lost[i];
            output += `${i + 1}. **${opp.name}** - ${formatCurrency(opp.revenue)} - ${opp.reason || 'No reason'} - ${opp.salesperson || 'Unassigned'}\n`;
        }
    }
    return output;
}
// Format lost opportunities list
export function formatLostOpportunitiesList(data, format) {
    if (format === ResponseFormat.JSON) {
        return JSON.stringify(data, null, 2);
    }
    let output = `## Lost Opportunities (${data.count} of ${data.total})\n\n`;
    if (data.items.length === 0) {
        output += '_No lost opportunities found matching your criteria._\n';
    }
    else {
        for (let i = 0; i < data.items.length; i++) {
            const opp = data.items[i];
            output += `${data.offset + i + 1}. **${opp.name}** (ID: ${opp.id})\n`;
            output += `   - Contact: ${opp.contact_name || '-'} | ${opp.email_from || '-'}\n`;
            output += `   - Lost Reason: ${getRelationName(opp.lost_reason_id)}\n`;
            output += `   - Revenue: ${formatCurrency(opp.expected_revenue)} | Stage: ${getRelationName(opp.stage_id)}\n`;
            output += `   - Salesperson: ${getRelationName(opp.user_id)} | Lost: ${formatDate(opp.date_closed)}\n`;
            if (opp.description) {
                output += `   - Notes: ${truncateText(opp.description, 100)}\n`;
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
    output += `- **Avg Lost per Period:** ${trends.avg_monthly_lost.toFixed(0)} opportunities (${formatCurrency(trends.avg_monthly_revenue)})\n`;
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
    let output = `## Won Opportunities (${data.count} of ${data.total})\n\n`;
    if (data.items.length === 0) {
        output += '_No won opportunities found matching your criteria._\n';
    }
    else {
        for (let i = 0; i < data.items.length; i++) {
            const opp = data.items[i];
            output += `${data.offset + i + 1}. **${opp.name}** (ID: ${opp.id})\n`;
            output += `   - Contact: ${opp.contact_name || '-'} | ${opp.email_from || '-'}\n`;
            output += `   - Revenue: ${formatCurrency(opp.expected_revenue)} | Stage: ${getRelationName(opp.stage_id)}\n`;
            output += `   - Salesperson: ${getRelationName(opp.user_id)} | Won: ${formatDate(opp.date_closed)}\n\n`;
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
    // Top won opportunities
    if (analysis.top_won && analysis.top_won.length > 0) {
        output += `### Top ${analysis.top_won.length} Largest Won Opportunities\n`;
        for (let i = 0; i < analysis.top_won.length; i++) {
            const opp = analysis.top_won[i];
            output += `${i + 1}. **${opp.name}** - ${formatCurrency(opp.revenue)} - ${opp.salesperson || 'Unassigned'} - Won: ${opp.date_closed}`;
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
    output += `- **Avg Won per Period:** ${trends.avg_period_won.toFixed(0)} opportunities (${formatCurrency(trends.avg_period_revenue)})\n`;
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
            output += `| Win Rate | ${formatPercent(p1.win_rate)} | ${formatPercent(p2.win_rate)} | ${change?.win_rate_change !== undefined ? `${change.win_rate_change >= 0 ? '+' : ''}${change.win_rate_change.toFixed(1)}pp` : '-'} |\n`;
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
            output += `- Won Count: ${comparison.benchmarks.avg_won_count.toFixed(1)}\n`;
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
                output += `   - Linked to: ${activity.res_name} (ID: ${activity.res_id})\n`;
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
// Format export result
export function formatExportResult(result, format) {
    if (format === ResponseFormat.JSON) {
        return JSON.stringify(result, null, 2);
    }
    let output = `## Export Complete\n\n`;
    output += `- **Filename:** ${result.filename}\n`;
    output += `- **Records:** ${result.record_count.toLocaleString()}\n`;
    output += `- **Format:** ${result.format.toUpperCase()}\n`;
    if (result.file_size) {
        const sizeKB = (result.file_size / 1024).toFixed(1);
        output += `- **Size:** ${sizeKB} KB\n`;
    }
    if (result.download_url) {
        output += `- **Download:** ${result.download_url}\n`;
        if (result.expires_at) {
            output += `- **Expires:** ${result.expires_at}\n`;
        }
    }
    else if (result.data) {
        output += `\n**Data (Base64 encoded):**\n\`\`\`\n${result.data.substring(0, 500)}${result.data.length > 500 ? '...' : ''}\n\`\`\`\n`;
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
                    output += `- ${opp.name}: ${formatCurrency(opp.expected_revenue)} (${formatPercent(opp.probability)})\n`;
                }
            }
        }
    }
    return output;
}
// Format extended lead list item (with additional fields)
export function formatLeadListItemExtended(lead) {
    let output = `- **${lead.name}** (ID: ${lead.id})\n`;
    output += `  Contact: ${lead.contact_name || '-'} | ${lead.email_from || '-'}\n`;
    output += `  Stage: ${getRelationName(lead.stage_id)} | Revenue: ${formatCurrency(lead.expected_revenue)} | Prob: ${formatPercent(lead.probability)}\n`;
    output += `  Salesperson: ${getRelationName(lead.user_id)} | Team: ${getRelationName(lead.team_id)}\n`;
    // Address
    const address = [lead.street, lead.city, getRelationName(lead.country_id)].filter(x => x && x !== '-').join(', ');
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
    // Description (truncated)
    if (lead.description) {
        output += `  Notes: ${truncateText(lead.description, 150)}\n`;
    }
    return output;
}
//# sourceMappingURL=formatters.js.map