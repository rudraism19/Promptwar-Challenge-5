import type { BudgetItem, ColorSwatch, EventPlan, TimelineItem, VendorItem } from '../types.ts';

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

  const categories: CategorySummary[] = Array.from(categoryMap.entries())
    .map(([cat, val]) => ({
      category: cat,
      planned: Math.round(val.planned),
      actual: Math.round(val.actual),
      count: val.count,
      percentOfBudget: safeTarget > 0 ? Math.round((val.planned / safeTarget) * 100) : 0,
    }))
    .sort((a, b) => b.planned - a.planned);

  const remainingTarget = safeTarget - totalSpent;
  const isOverBudget = safeTarget > 0 && totalSpent > safeTarget;
  const percentSpent =
    safeTarget > 0 ? Math.min(100, Math.round((totalSpent / safeTarget) * 100)) : 0;

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
      if (!Number.isNaN(dueTime) && !Number.isNaN(refTime) && dueTime < refTime) {
        overdueCount++;
      }
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
  return {
    total,
    booked,
    contacted,
    researching,
    declined,
    percentBooked,
    totalCommittedCost: Math.round(totalCommittedCost),
  };
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
      const matchAssigned = item.assignedTo?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAssigned) return false;
    }
    return true;
  });
}

export function filterBudgetItems(
  items: BudgetItem[] = [],
  filter: {
    category?: string;
    searchQuery?: string;
  }
): BudgetItem[] {
  return items.filter((item) => {
    if (filter.category && filter.category !== 'ALL' && item.category !== filter.category) {
      return false;
    }
    if (filter.searchQuery && filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      if (!matchName && !matchNotes && !matchCat) return false;
    }
    return true;
  });
}

export function filterVendorItems(
  items: VendorItem[] = [],
  filter: {
    status?: string;
    category?: string;
    searchQuery?: string;
  }
): VendorItem[] {
  return items.filter((vendor) => {
    if (filter.status && filter.status !== 'ALL' && vendor.status !== filter.status) {
      return false;
    }
    if (filter.category && filter.category !== 'ALL' && vendor.category !== filter.category) {
      return false;
    }
    if (filter.searchQuery && filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase().trim();
      const matchName = vendor.name.toLowerCase().includes(q);
      const matchCat = vendor.category.toLowerCase().includes(q);
      const matchRole = vendor.roleDescription.toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchRole) return false;
    }
    return true;
  });
}

export interface DaysUntilEventResult {
  days: number | null;
  label: string;
}

export function calculateDaysUntilEvent(
  eventDateStr: string,
  referenceDateStr?: string
): DaysUntilEventResult {
  if (!eventDateStr) return { days: null, label: '' };
  const target = new Date(eventDateStr).getTime();
  const now = referenceDateStr ? new Date(referenceDateStr).getTime() : Date.now();
  if (Number.isNaN(target) || Number.isNaN(now)) return { days: null, label: '' };
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { days: 0, label: 'Past event' };
  if (diffDays === 0) return { days: 0, label: 'Today!' };
  if (diffDays === 1) return { days: 1, label: '1 day away' };
  return { days: diffDays, label: `${diffDays} days away` };
}

const DEFAULT_COLOR_PALETTE: ColorSwatch[] = [
  { name: 'Sage Green', hex: '#607d67' },
  { name: 'Warm Cream', hex: '#faf7f2' },
  { name: 'Dusty Rose', hex: '#d9989b' },
  { name: 'Champagne Gold', hex: '#d4af37' },
];

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{3,8}$/;

export function sanitizeEventPlan(rawInput: Partial<EventPlan> | null | undefined): EventPlan {
  const raw: Partial<EventPlan> =
    rawInput && typeof rawInput === 'object' ? rawInput : {};
  const now = new Date().toISOString();

  const validPalette: ColorSwatch[] = Array.isArray(raw.colorPalette)
    ? raw.colorPalette
        .filter((sw): sw is ColorSwatch => Boolean(sw && typeof sw === 'object'))
        .map((sw, idx) => ({
          name:
            typeof sw.name === 'string' && sw.name.trim()
              ? sw.name.trim()
              : `Accent ${idx + 1}`,
          hex:
            typeof sw.hex === 'string' && HEX_COLOR_REGEX.test(sw.hex.trim())
              ? sw.hex.trim()
              : DEFAULT_COLOR_PALETTE[idx % DEFAULT_COLOR_PALETTE.length].hex,
        }))
    : [];

  const sanitizedBudget: BudgetItem[] = Array.isArray(raw.budgetItems)
    ? raw.budgetItems
        .filter((b): b is BudgetItem => Boolean(b && typeof b === 'object'))
        .map((b, idx) => ({
          id: typeof b.id === 'string' && b.id.trim() ? b.id : `b-${idx + 1}`,
          category:
            typeof b.category === 'string' && b.category.trim()
              ? b.category.trim()
              : 'General',
          name:
            typeof b.name === 'string' && b.name.trim()
              ? b.name.trim()
              : `Expense Item ${idx + 1}`,
          plannedCost: Math.round(finiteNonNegative(b.plannedCost)),
          actualCost: Math.round(finiteNonNegative(b.actualCost)),
          paid: Boolean(b.paid),
          notes: typeof b.notes === 'string' ? b.notes : undefined,
        }))
    : [];

  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `event-${Date.now()}`,
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : 'Untitled Event',
    eventType: raw.eventType || 'other',
    date: typeof raw.date === 'string' && raw.date.trim() ? raw.date.trim() : '2026-12-31',
    targetBudget: Math.max(0, Number(raw.targetBudget) || 5000),
    guestCount: Math.max(1, Number(raw.guestCount) || 50),
    location:
      typeof raw.location === 'string' && raw.location.trim()
        ? raw.location.trim()
        : 'To be determined',
    vibeAndTheme:
      typeof raw.vibeAndTheme === 'string' && raw.vibeAndTheme.trim()
        ? raw.vibeAndTheme.trim()
        : 'Warm, memorable & festive celebration',
    colorPalette: validPalette.length > 0 ? validPalette : DEFAULT_COLOR_PALETTE,
    summaryStory:
      typeof raw.summaryStory === 'string' && raw.summaryStory.trim()
        ? raw.summaryStory.trim()
        : 'A thoughtfully planned event curated for unforgettable memories.',
    keyHighlights: Array.isArray(raw.keyHighlights)
      ? raw.keyHighlights.filter((h): h is string => typeof h === 'string' && h.trim().length > 0)
      : [],
    budgetItems: sanitizedBudget,
    timelineItems: Array.isArray(raw.timelineItems) ? raw.timelineItems : [],
    vendorItems: Array.isArray(raw.vendorItems) ? raw.vendorItems : [],
    personalizedIdeas: Array.isArray(raw.personalizedIdeas) ? raw.personalizedIdeas : [],
    customNotes: typeof raw.customNotes === 'string' ? raw.customNotes : '',
    createdAt: typeof raw.createdAt === 'string' && raw.createdAt ? raw.createdAt : now,
    updatedAt: now,
  };
}
