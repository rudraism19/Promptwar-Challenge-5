import type { BudgetItem, EventPlan, TimelineItem, VendorItem } from '../types.ts';

export interface CategorySummary {
  category: string;
  planned: number;
  actual: number;
  count: number;
  percentOfBudget: number;
}

export interface BudgetTotals {
  targetBudget: number;
  totalPlanned: number;
  totalSpent: number;
  totalPaid: number;
  remainingTarget: number;
  isOverBudget: boolean;
  variancePlannedVsTarget: number;
  percentSpent: number;
  categories: CategorySummary[];
}

function finiteNonNegative(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function calculateBudgetTotals(
  budgetItems: BudgetItem[] = [],
  targetBudget: number = 0
): BudgetTotals {
  const safeTarget = finiteNonNegative(targetBudget);
  let totalPlanned = 0;
  let totalSpent = 0;
  let totalPaid = 0;

  const categoryMap = new Map<string, { planned: number; actual: number; count: number }>();

  for (const item of budgetItems) {
    const planned = finiteNonNegative(item.plannedCost);
    const actual = finiteNonNegative(item.actualCost);
    totalPlanned += planned;
    totalSpent += actual;
    if (item.paid) totalPaid += actual;

    const catName = typeof item.category === 'string' ? item.category.trim() || 'General' : 'General';
    const existing = categoryMap.get(catName) || { planned: 0, actual: 0, count: 0 };
    existing.planned += planned;
    existing.actual += actual;
    existing.count += 1;
    categoryMap.set(catName, existing);
  }

  const categories: CategorySummary[] = Array.from(categoryMap.entries()).map(([cat, val]) => ({
    category: cat,
    planned: Math.round(val.planned),
    actual: Math.round(val.actual),
    count: val.count,
    percentOfBudget: safeTarget > 0 ? Math.round((val.planned / safeTarget) * 100) : 0,
  })).sort((a, b) => b.planned - a.planned);

  const remainingTarget = safeTarget - totalSpent;
  const isOverBudget = safeTarget > 0 && totalSpent > safeTarget;
  const percentSpent = safeTarget > 0 ? Math.min(100, Math.round((totalSpent / safeTarget) * 100)) : 0;

  return {
    targetBudget: safeTarget,
    totalPlanned: Math.round(totalPlanned),
    totalSpent: Math.round(totalSpent),
    totalPaid: Math.round(totalPaid),
    remainingTarget: Math.round(remainingTarget),
    isOverBudget,
    variancePlannedVsTarget: Math.round(safeTarget - totalPlanned),
    percentSpent,
    categories,
  };
}

export interface TimelineProgress {
  total: number;
  completed: number;
  pending: number;
  percent: number;
  overdueCount: number;
  phaseCounts: Record<string, { total: number; completed: number }>;
}

export function calculateTimelineProgress(
  timelineItems: TimelineItem[] = [],
  referenceDateStr?: string
): TimelineProgress {
  const total = timelineItems.length;
  let completed = 0;
  let overdueCount = 0;
  const phaseCounts: Record<string, { total: number; completed: number }> = {};

  const refTime = referenceDateStr ? new Date(referenceDateStr).getTime() : Date.now();

  for (const item of timelineItems) {
    if (item.completed) {
      completed++;
    } else if (item.dueDate) {
      const dueTime = new Date(item.dueDate).getTime();
      if (!isNaN(dueTime) && dueTime < refTime) overdueCount++;
    }

    const phase = item.phase || 'Unscheduled';
    if (!phaseCounts[phase]) phaseCounts[phase] = { total: 0, completed: 0 };
    phaseCounts[phase].total++;
    if (item.completed) phaseCounts[phase].completed++;
  }

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, pending: total - completed, percent, overdueCount, phaseCounts };
}

export interface VendorProgress {
  total: number;
  booked: number;
  contacted: number;
  researching: number;
  declined: number;
  percentBooked: number;
  totalCommittedCost: number;
}

export function calculateVendorProgress(vendorItems: VendorItem[] = []): VendorProgress {
  const total = vendorItems.length;
  let booked = 0;
  let contacted = 0;
  let researching = 0;
  let declined = 0;
  let totalCommittedCost = 0;

  for (const item of vendorItems) {
    if (item.status === 'booked') {
      booked++;
      totalCommittedCost += finiteNonNegative(item.actualCost ?? item.estimatedCost ?? 0);
    } else if (item.status === 'contacted') {
      contacted++;
    } else if (item.status === 'researching') {
      researching++;
    } else if (item.status === 'declined') {
      declined++;
    }
  }

  const percentBooked = total > 0 ? Math.round((booked / total) * 100) : 0;
  return { total, booked, contacted, researching, declined, percentBooked, totalCommittedCost: Math.round(totalCommittedCost) };
}

export function filterTimelineItems(
  items: TimelineItem[] = [],
  filter: {
    phase?: string;
    priority?: string;
    hideCompleted?: boolean;
    searchQuery?: string;
  }
): TimelineItem[] {
  return items.filter((item) => {
    if (filter.phase && filter.phase !== 'ALL' && item.phase !== filter.phase) return false;
    if (filter.priority && filter.priority !== 'ALL' && item.priority !== filter.priority) return false;
    if (filter.hideCompleted && item.completed) return false;
    if (filter.searchQuery && filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase().trim();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });
}

export function sanitizeEventPlan(raw: Partial<EventPlan>): EventPlan {
  const now = new Date().toISOString();
  return {
    id: raw.id || `event-${Date.now()}`,
    title: raw.title?.trim() || 'Untitled Event',
    eventType: raw.eventType || 'other',
    date: raw.date || '2026-12-31',
    targetBudget: Math.max(0, Number(raw.targetBudget) || 5000),
    guestCount: Math.max(1, Number(raw.guestCount) || 50),
    location: raw.location?.trim() || 'To be determined',
    vibeAndTheme: raw.vibeAndTheme?.trim() || 'Warm, memorable & festive celebration',
    colorPalette: Array.isArray(raw.colorPalette) && raw.colorPalette.length > 0
      ? raw.colorPalette
      : [
          { name: 'Sage Green', hex: '#607d67' },
          { name: 'Warm Cream', hex: '#faf7f2' },
          { name: 'Dusty Rose', hex: '#d9989b' },
          { name: 'Champagne Gold', hex: '#d4af37' },
        ],
    summaryStory: raw.summaryStory?.trim() || 'A thoughtfully planned event curated for unforgettable memories.',
    keyHighlights: Array.isArray(raw.keyHighlights) ? raw.keyHighlights : [],
    budgetItems: Array.isArray(raw.budgetItems) ? raw.budgetItems : [],
    timelineItems: Array.isArray(raw.timelineItems) ? raw.timelineItems : [],
    vendorItems: Array.isArray(raw.vendorItems) ? raw.vendorItems : [],
    personalizedIdeas: Array.isArray(raw.personalizedIdeas) ? raw.personalizedIdeas : [],
    customNotes: raw.customNotes || '',
    createdAt: raw.createdAt || now,
    updatedAt: now,
  };
}
