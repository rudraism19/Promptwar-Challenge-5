import type { BudgetItem, EventPlan, IdeaCategory, PersonalizedIdea, TimelineItem } from '../types.ts';
import { calculateBudgetTotals } from './eventCalculations.ts';

/**
 * Sanitizes a cell value for safe CSV export (RFC 4180 + formula injection defense).
 * Cells beginning with =, +, -, @, tab, or CR are prefixed with a single quote
 * so spreadsheet applications never evaluate untrusted formulas.
 */
export function sanitizeCsvCell(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) {
    return '""';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '0';
  }
  if (typeof value === 'boolean') {
    return value ? '"Yes"' : '"No"';
  }
  const trimmed = String(value);
  const formulaSafe = /^[=+\-@\t\r]/.test(trimmed) ? `'${trimmed}` : trimmed;
  const escaped = formulaSafe.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Generates an RFC 4180 compliant CSV string for an EventPlan's budget items.
 */
export function formatBudgetToCsv(event: EventPlan): string {
  const totals = calculateBudgetTotals(event.budgetItems, event.targetBudget);
  const headers = [
    'Category',
    'Item Name',
    'Planned Cost ($)',
    'Actual Cost ($)',
    'Paid Status',
    'Notes',
  ];

  const rows = event.budgetItems.map((item) => [
    sanitizeCsvCell(item.category),
    sanitizeCsvCell(item.name),
    sanitizeCsvCell(item.plannedCost),
    sanitizeCsvCell(item.actualCost),
    sanitizeCsvCell(item.paid ? 'Paid' : 'Pending'),
    sanitizeCsvCell(item.notes || ''),
  ]);

  // Append summary row
  rows.push([
    sanitizeCsvCell('TOTAL SUMMARY'),
    sanitizeCsvCell(`${event.title} (Target: $${totals.targetBudget})`),
    sanitizeCsvCell(totals.totalPlanned),
    sanitizeCsvCell(totals.totalSpent),
    sanitizeCsvCell(`Paid: $${totals.totalPaid}`),
    sanitizeCsvCell(
      totals.isOverBudget
        ? `Over budget by $${Math.abs(totals.remainingTarget)}`
        : `Remaining: $${totals.remainingTarget}`
    ),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generates a structured Markdown dossier for sharing or clipboard copy.
 */
export function formatEventDossierMarkdown(event: EventPlan): string {
  const totals = calculateBudgetTotals(event.budgetItems, event.targetBudget);
  const lines: string[] = [];

  lines.push(`# ${event.title}`);
  lines.push(
    `**Event Type:** ${event.eventType.toUpperCase()} | **Date:** ${event.date} | **Guests:** ${event.guestCount} | **Budget:** $${event.targetBudget.toLocaleString()}`
  );
  lines.push(`**Location:** ${event.location}`);
  lines.push(`**Aesthetic & Vibe:** ${event.vibeAndTheme}`);

  if (event.colorPalette && event.colorPalette.length > 0) {
    const paletteStr = event.colorPalette.map((c) => `${c.name} (${c.hex})`).join(', ');
    lines.push(`**Color Palette:** ${paletteStr}`);
  }

  if (event.customNotes && event.customNotes.trim()) {
    lines.push(`\n## Planner Notes\n${event.customNotes.trim()}`);
  }

  lines.push(`\n## Signature Highlights`);
  if (event.keyHighlights.length === 0) {
    lines.push(`- No highlights listed.`);
  } else {
    event.keyHighlights.forEach((h, i) => {
      lines.push(`${i + 1}. ${h}`);
    });
  }

  lines.push(
    `\n## Budget Summary ($${totals.totalSpent.toLocaleString()} spent of $${totals.targetBudget.toLocaleString()})`
  );
  event.budgetItems.forEach((b) => {
    lines.push(
      `- [${b.paid ? 'x' : ' '}] **${b.category}**: ${b.name} — Planned: $${b.plannedCost.toLocaleString()}, Actual: $${b.actualCost.toLocaleString()} (${b.paid ? 'PAID' : 'PENDING'})`
    );
  });

  lines.push(`\n## Day-of Run of Show`);
  const dayOfItems = event.timelineItems
    .filter((t) => t.phase === 'Day-of Schedule')
    .sort((a, b) => (a.dayOfOrder || 0) - (b.dayOfOrder || 0));

  if (dayOfItems.length === 0) {
    lines.push(`- No day-of schedule items added yet.`);
  } else {
    dayOfItems.forEach((t) => {
      lines.push(`- **${t.timeOfDay || 'Time TBD'}**: ${t.title} — ${t.description}`);
    });
  }

  lines.push(`\n## Vendors`);
  if (event.vendorItems.length === 0) {
    lines.push(`- No vendors listed.`);
  } else {
    event.vendorItems.forEach((v) => {
      const cost = v.actualCost ?? v.estimatedCost;
      lines.push(`- **${v.category}**: ${v.name} (${v.status.toUpperCase()}) — $${cost.toLocaleString()}`);
    });
  }

  const includedIdeas = event.personalizedIdeas.filter((i) => i.addedToPlan);
  if (includedIdeas.length > 0) {
    lines.push(`\n## Selected Creative Ideas`);
    includedIdeas.forEach((idea) => {
      lines.push(`- **${idea.title}** (${idea.estimatedCostImpact}): ${idea.description}`);
    });
  }

  return lines.join('\n') + '\n';
}

/**
 * Extracts a numeric dollar estimate from a cost impact string like "+$350", "~$280", or "Saves ~$1,200".
 * If it describes a savings or $0, returns 0 for planned expense cost.
 */
export function parseEstimatedCostImpact(impactStr?: string): number {
  if (!impactStr || /saves|free|\$0\b/i.test(impactStr)) {
    return 0;
  }
  const match = impactStr.match(/\$\s*([0-9,]+(?:\.[0-9]+)?)/);
  if (!match) return 150;
  const numeric = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(numeric) && numeric >= 0 ? Math.round(numeric) : 150;
}

const IDEA_CATEGORY_TO_BUDGET_CATEGORY: Record<IdeaCategory, string> = {
  food_drink: 'Catering & Bar',
  theme_decor: 'Florals & Decor',
  entertainment_activity: 'Music & Entertainment',
  budget_saver: 'Budget Optimization',
  contingency_backup: 'Contingency & Logistics',
};

/**
 * Converts a PersonalizedIdea into a concrete BudgetItem that can be tracked in the Budget tab.
 */
export function convertIdeaToBudgetItem(idea: PersonalizedIdea, idOverride?: string): BudgetItem {
  const category = IDEA_CATEGORY_TO_BUDGET_CATEGORY[idea.category] || 'Special Touches';
  const plannedCost = parseEstimatedCostImpact(idea.estimatedCostImpact);

  return {
    id: idOverride || `budget-idea-${idea.id}-${Date.now()}`,
    category,
    name: idea.title.trim(),
    plannedCost,
    actualCost: 0,
    paid: false,
    notes: `${idea.description} (${idea.estimatedCostImpact || 'AI Idea Lab'})`.trim(),
  };
}

/**
 * Converts a PersonalizedIdea into an actionable TimelineItem for the event schedule.
 */
export function convertIdeaToTimelineItem(idea: PersonalizedIdea, idOverride?: string): TimelineItem {
  const isContingency = idea.category === 'contingency_backup';
  return {
    id: idOverride || `timeline-idea-${idea.id}-${Date.now()}`,
    title: `Implement Idea: ${idea.title.trim()}`,
    description: `${idea.description} — ${idea.whyItFitsTheme}`.trim(),
    phase: isContingency ? 'Final Weeks' : '1-2 Months',
    completed: false,
    priority: isContingency ? 'high' : 'medium',
    assignedTo: 'Planner',
  };
}
