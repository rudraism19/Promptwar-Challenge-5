import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBudgetTotals,
  calculateDaysUntilEvent,
  calculateTimelineProgress,
  calculateVendorProgress,
  filterBudgetItems,
  filterTimelineItems,
  filterVendorItems,
  sanitizeEventPlan,
} from './eventCalculations.ts';
import { SEED_EVENTS } from '../data/seedEvents.ts';
import type { BudgetItem, TimelineItem, VendorItem } from '../types.ts';

test('calculateBudgetTotals computes planned, spent, and categories accurately', () => {
  const items: BudgetItem[] = [
    { id: '1', category: 'Venue', name: 'Main Hall', plannedCost: 2000, actualCost: 2100, paid: true },
    { id: '2', category: 'Venue', name: 'Security Deposit', plannedCost: 500, actualCost: 500, paid: true },
    { id: '3', category: 'Catering', name: 'Buffet Dinner', plannedCost: 3000, actualCost: 2800, paid: false },
    { id: '4', category: 'Decor', name: 'Florals', plannedCost: 800, actualCost: 0, paid: false },
  ];
  const result = calculateBudgetTotals(items, 6500);
  assert.equal(result.totalPlanned, 6300);
  assert.equal(result.totalSpent, 5400);
  assert.equal(result.totalPaid, 2600);
  assert.equal(result.remainingTarget, 1100);
  assert.equal(result.isOverBudget, false);
  assert.equal(result.variancePlannedVsTarget, 200);
  assert.equal(result.categories.length, 3);
  assert.equal(result.categories[0].category, 'Catering');
  assert.equal(result.categories[0].planned, 3000);
  assert.equal(result.categories[1].category, 'Venue');
  assert.equal(result.categories[1].planned, 2500);
});

test('calculateBudgetTotals flags over budget correctly', () => {
  const items: BudgetItem[] = [
    { id: '1', category: 'General', name: 'Stage', plannedCost: 1000, actualCost: 1500, paid: true },
  ];
  const result = calculateBudgetTotals(items, 1200);
  assert.equal(result.isOverBudget, true);
  assert.equal(result.remainingTarget, -300);
});

test('calculateBudgetTotals handles empty items, zero targets and invalid costs safely', () => {
  const empty = calculateBudgetTotals([], 0);
  assert.equal(empty.totalPlanned, 0);
  assert.equal(empty.totalSpent, 0);
  assert.equal(empty.percentSpent, 0);
  assert.equal(empty.isOverBudget, false);

  const items = [
    { id: '1', category: '  ', name: 'Misc', plannedCost: Number.NaN, actualCost: Number.POSITIVE_INFINITY, paid: false },
  ] as BudgetItem[];
  const result = calculateBudgetTotals(items, -50);
  assert.equal(result.targetBudget, 0);
  assert.equal(result.totalPlanned, 0);
  assert.equal(result.totalSpent, 0);
  assert.equal(result.categories[0].category, 'General');
});

test('calculateTimelineProgress calculates completion percentage and overdue counts', () => {
  const items: TimelineItem[] = [
    { id: 't1', title: 'Book venue', description: 'Confirm deposit', phase: '6-9 Months', dueDate: '2026-05-01', completed: true, priority: 'high' },
    { id: 't2', title: 'Tasting session', description: 'Sample menu items', phase: '3-5 Months', dueDate: '2026-08-01', completed: false, priority: 'medium' },
    { id: 't3', title: 'Send invitations', description: 'Digital and paper', phase: '1-2 Months', dueDate: '2026-10-01', completed: false, priority: 'high' },
  ];
  const result = calculateTimelineProgress(items, '2026-09-01');
  assert.equal(result.total, 3);
  assert.equal(result.completed, 1);
  assert.equal(result.pending, 2);
  assert.equal(result.percent, 33);
  assert.equal(result.overdueCount, 1);
});

test('calculateTimelineProgress handles empty lists, invalid dates and completed overdue items', () => {
  assert.deepEqual(calculateTimelineProgress([], '2026-01-01'), {
    total: 0,
    completed: 0,
    pending: 0,
    percent: 0,
    overdueCount: 0,
    phaseCounts: {},
  });
  const items: TimelineItem[] = [
    {
      id: 'a',
      title: 'Invalid date',
      description: '',
      phase: '' as unknown as TimelineItem['phase'],
      dueDate: 'not-a-date',
      completed: false,
      priority: 'low',
    },
    { id: 'b', title: 'Done', description: '', phase: 'Final Weeks', dueDate: '2020-01-01', completed: true, priority: 'low' },
  ];
  const result = calculateTimelineProgress(items, '2026-01-01');
  assert.equal(result.overdueCount, 0);
  assert.equal(result.completed, 1);
  assert.equal(result.phaseCounts.Unscheduled.total, 1);
});

test('calculateVendorProgress handles booked and pending vendor counts', () => {
  const vendors: VendorItem[] = [
    { id: 'v1', category: 'Photography', name: 'Lens & Light Studio', roleDescription: 'Full day coverage', estimatedCost: 1500, actualCost: 1600, status: 'booked', questionsToAsk: ['Are raw files included?'] },
    { id: 'v2', category: 'DJ', name: 'Soundwave Beats', roleDescription: 'Reception audio', estimatedCost: 800, status: 'contacted', questionsToAsk: ['Do you bring backup equipment?'] },
    { id: 'v3', category: 'Florist', name: 'Petal Haven', roleDescription: 'Centerpieces', estimatedCost: 600, status: 'researching', questionsToAsk: [] },
  ];
  const result = calculateVendorProgress(vendors);
  assert.equal(result.total, 3);
  assert.equal(result.booked, 1);
  assert.equal(result.contacted, 1);
  assert.equal(result.researching, 1);
  assert.equal(result.percentBooked, 33);
  assert.equal(result.totalCommittedCost, 1600);
});

test('calculateVendorProgress handles empty vendors and uses estimated booked cost', () => {
  assert.equal(calculateVendorProgress([]).percentBooked, 0);
  const items: VendorItem[] = [
    { id: 'v1', category: 'Catering', name: 'Caterer', roleDescription: '', estimatedCost: 2500, status: 'booked', questionsToAsk: [] },
    { id: 'v2', category: 'Venue', name: 'Venue', roleDescription: '', estimatedCost: 1000, status: 'declined', questionsToAsk: [] },
  ];
  const result = calculateVendorProgress(items);
  assert.equal(result.booked, 1);
  assert.equal(result.declined, 1);
  assert.equal(result.totalCommittedCost, 2500);
});

test('filterTimelineItems correctly filters by phase, priority, assignee, and search query', () => {
  const items: TimelineItem[] = [
    { id: '1', title: 'Find DJ', description: 'Search local DJs', phase: '6-9 Months', completed: false, priority: 'medium', assignedTo: 'Alex' },
    { id: '2', title: 'Finalize Seating', description: 'Table chart', phase: 'Final Weeks', completed: true, priority: 'high', assignedTo: 'Jordan' },
    { id: '3', title: 'Rehearsal Dinner', description: 'Reserve venue table', phase: 'Final Weeks', completed: false, priority: 'high' },
  ];
  assert.equal(filterTimelineItems(items, { phase: 'Final Weeks' }).length, 2);
  const searchFiltered = filterTimelineItems(items, { searchQuery: 'chart' });
  assert.equal(searchFiltered.length, 1);
  assert.equal(searchFiltered[0].id, '2');
  assert.equal(filterTimelineItems(items, { searchQuery: 'jordan' }).length, 1);
  assert.equal(filterTimelineItems(items, { phase: 'Final Weeks', hideCompleted: true }).length, 1);
  assert.equal(filterTimelineItems(items, { priority: 'medium' }).length, 1);
});

describe('Additional filtering, countdown, and seed integrity checks', () => {
  it('filterBudgetItems filters by category and case-insensitive search across name, category, and notes', () => {
    const items: BudgetItem[] = [
      { id: 'b1', category: 'Venue', name: 'Conservatory Hall', plannedCost: 5000, actualCost: 5000, paid: true, notes: 'Includes chairs' },
      { id: 'b2', category: 'Catering', name: 'Harvest Dinner', plannedCost: 4000, actualCost: 0, paid: false, notes: 'Vegan options included' },
    ];
    assert.equal(filterBudgetItems(items, { category: 'ALL' }).length, 2);
    assert.equal(filterBudgetItems(items, { category: 'Venue' }).length, 1);
    assert.equal(filterBudgetItems(items, { searchQuery: 'vegan' }).length, 1);
    assert.equal(filterBudgetItems(items, { searchQuery: 'nonexistent' }).length, 0);
  });

  it('filterVendorItems filters by status, category, and search query', () => {
    const vendors: VendorItem[] = [
      { id: 'v1', category: 'Photography', name: 'Golden Hour Co', roleDescription: 'Candid portraits', estimatedCost: 2200, status: 'booked', questionsToAsk: [] },
      { id: 'v2', category: 'Entertainment', name: 'Vinyl Groove DJ', roleDescription: 'Reception dance floor', estimatedCost: 1200, status: 'researching', questionsToAsk: [] },
    ];
    assert.equal(filterVendorItems(vendors, { status: 'booked' }).length, 1);
    assert.equal(filterVendorItems(vendors, { category: 'Entertainment' }).length, 1);
    assert.equal(filterVendorItems(vendors, { searchQuery: 'candid' }).length, 1);
    assert.equal(filterVendorItems(vendors, { status: 'declined' }).length, 0);
  });

  it('calculateDaysUntilEvent calculates positive countdowns, clamps past dates to 0, and returns null on invalid dates', () => {
    assert.deepEqual(calculateDaysUntilEvent('2026-10-15', '2026-10-05'), {
      days: 10,
      label: '10 days away',
    });
    assert.deepEqual(calculateDaysUntilEvent('2026-10-06', '2026-10-05'), {
      days: 1,
      label: '1 day away',
    });
    assert.deepEqual(calculateDaysUntilEvent('2026-10-05', '2026-10-05'), {
      days: 0,
      label: 'Today!',
    });
    assert.deepEqual(calculateDaysUntilEvent('2026-01-01', '2026-06-01'), {
      days: 0,
      label: 'Past event',
    });
    assert.deepEqual(calculateDaysUntilEvent('', '2026-06-01'), {
      days: null,
      label: '',
    });
    assert.deepEqual(calculateDaysUntilEvent('invalid-date', '2026-06-01'), {
      days: null,
      label: '',
    });
  });

  it('sanitizeEventPlan validates hex colors, trims strings, and handles null/malformed collections', () => {
    const fromNull = sanitizeEventPlan(null);
    assert.equal(fromNull.title, 'Untitled Event');
    assert.ok(fromNull.colorPalette.length >= 4);

    const plan = sanitizeEventPlan({
      title: '  Launch Party  ',
      location: '  Main Hall  ',
      colorPalette: [{ name: 'Bad Hex', hex: 'javascript:alert(1)' }],
      keyHighlights: null as unknown as string[],
      budgetItems: [
        { id: '', category: '  ', name: '  ', plannedCost: -200, actualCost: 300, paid: true },
      ],
      timelineItems: 'invalid' as unknown as TimelineItem[],
      vendorItems: undefined,
    });
    assert.equal(plan.title, 'Launch Party');
    assert.equal(plan.location, 'Main Hall');
    assert.match(plan.colorPalette[0].hex, /^#[0-9a-fA-F]{3,8}$/);
    assert.equal(plan.budgetItems[0].category, 'General');
    assert.equal(plan.budgetItems[0].plannedCost, 0);
    assert.equal(plan.budgetItems[0].actualCost, 300);
    assert.deepEqual(plan.keyHighlights, []);
    assert.deepEqual(plan.timelineItems, []);
    assert.deepEqual(plan.vendorItems, []);
  });

  it('SEED_EVENTS contain valid wedding, birthday, and community events with complete financial and timeline data', () => {
    assert.equal(SEED_EVENTS.length, 3);
    const types = SEED_EVENTS.map((e) => e.eventType);
    assert.deepEqual(types, ['wedding', 'birthday', 'community']);

    for (const event of SEED_EVENTS) {
      const totals = calculateBudgetTotals(event.budgetItems, event.targetBudget);
      assert.ok(totals.totalPlanned > 0);
      assert.ok(event.timelineItems.length >= 5);
      assert.ok(event.vendorItems.length >= 2);
      assert.ok(event.personalizedIdeas.length >= 2);
    }
  });
});
