import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBudgetTotals,
  calculateTimelineProgress,
  calculateVendorProgress,
  filterTimelineItems,
  sanitizeEventPlan,
} from './eventCalculations.ts';
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

  // Check categories grouped and sorted
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

test('calculateTimelineProgress calculates completion percentage and overdue counts', () => {
  const items: TimelineItem[] = [
    {
      id: 't1',
      title: 'Book venue',
      description: 'Confirm deposit',
      phase: '6-9 Months',
      dueDate: '2026-05-01',
      completed: true,
      priority: 'high',
    },
    {
      id: 't2',
      title: 'Tasting session',
      description: 'Sample menu items',
      phase: '3-5 Months',
      dueDate: '2026-08-01',
      completed: false,
      priority: 'medium',
    },
    {
      id: 't3',
      title: 'Send invitations',
      description: 'Digital and paper',
      phase: '1-2 Months',
      dueDate: '2026-10-01',
      completed: false,
      priority: 'high',
    },
  ];

  // Using a test reference date where 2026-08-01 is overdue (e.g., 2026-09-01)
  const result = calculateTimelineProgress(items, '2026-09-01');
  assert.equal(result.total, 3);
  assert.equal(result.completed, 1);
  assert.equal(result.pending, 2);
  assert.equal(result.percent, 33);
  assert.equal(result.overdueCount, 1); // t2 is overdue, t3 is not yet overdue
});

test('calculateVendorProgress handles booked and pending vendor counts', () => {
  const vendors: VendorItem[] = [
    {
      id: 'v1',
      category: 'Photography',
      name: 'Lens & Light Studio',
      roleDescription: 'Full day coverage',
      estimatedCost: 1500,
      actualCost: 1600,
      status: 'booked',
      questionsToAsk: ['Are raw files included?'],
    },
    {
      id: 'v2',
      category: 'DJ',
      name: 'Soundwave Beats',
      roleDescription: 'Reception audio',
      estimatedCost: 800,
      status: 'contacted',
      questionsToAsk: ['Do you bring backup equipment?'],
    },
    {
      id: 'v3',
      category: 'Florist',
      name: 'Petal Haven',
      roleDescription: 'Centerpieces',
      estimatedCost: 600,
      status: 'researching',
      questionsToAsk: [],
    },
  ];

  const result = calculateVendorProgress(vendors);
  assert.equal(result.total, 3);
  assert.equal(result.booked, 1);
  assert.equal(result.contacted, 1);
  assert.equal(result.researching, 1);
  assert.equal(result.percentBooked, 33);
  assert.equal(result.totalCommittedCost, 1600);
});

test('filterTimelineItems correctly filters by phase and search query', () => {
  const items: TimelineItem[] = [
    { id: '1', title: 'Find DJ', description: 'Search local DJs', phase: '6-9 Months', completed: false, priority: 'medium' },
    { id: '2', title: 'Finalize Seating', description: 'Table chart', phase: 'Final Weeks', completed: true, priority: 'high' },
    { id: '3', title: 'Rehearsal Dinner', description: 'Reserve venue table', phase: 'Final Weeks', completed: false, priority: 'high' },
  ];

  const phaseFiltered = filterTimelineItems(items, { phase: 'Final Weeks' });
  assert.equal(phaseFiltered.length, 2);

  const searchFiltered = filterTimelineItems(items, { searchQuery: 'chart' });
  assert.equal(searchFiltered.length, 1);
  assert.equal(searchFiltered[0].id, '2');

  const hideCompletedFiltered = filterTimelineItems(items, { phase: 'Final Weeks', hideCompleted: true });
  assert.equal(hideCompletedFiltered.length, 1);
  assert.equal(hideCompletedFiltered[0].id, '3');
});

test('sanitizeEventPlan returns valid EventPlan defaults on missing fields', () => {
  const plan = sanitizeEventPlan({
    title: 'Spring Garden Party',
    eventType: 'birthday',
  });

  assert.equal(plan.title, 'Spring Garden Party');
  assert.equal(plan.eventType, 'birthday');
  assert.ok(plan.targetBudget > 0);
  assert.ok(plan.guestCount > 0);
  assert.ok(Array.isArray(plan.colorPalette));
  assert.ok(plan.colorPalette.length > 0);
  assert.ok(Array.isArray(plan.budgetItems));
  assert.ok(Array.isArray(plan.timelineItems));
  assert.ok(Array.isArray(plan.vendorItems));
});
