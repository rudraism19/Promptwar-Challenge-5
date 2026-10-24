import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeCsvCell,
  formatBudgetToCsv,
  formatEventDossierMarkdown,
  parseEstimatedCostImpact,
  convertIdeaToBudgetItem,
  convertIdeaToTimelineItem,
} from './exportFormatters.ts';
import type { EventPlan, PersonalizedIdea } from '../types.ts';

describe('exportFormatters', () => {
  describe('sanitizeCsvCell', () => {
    it('prefixes formula-injection characters (=, +, -, @, tab, CR) with single quote', () => {
      assert.equal(sanitizeCsvCell('=SUM(A1:A10)'), '"\'=SUM(A1:A10)"');
      assert.equal(sanitizeCsvCell("+cmd|' /C calc'!A0"), "\"'+cmd|' /C calc'!A0\"");
      assert.equal(sanitizeCsvCell('-200'), '"\'-200"');
      assert.equal(sanitizeCsvCell('@import'), '"\'@import"');
    });

    it('escapes internal double quotes according to RFC 4180', () => {
      assert.equal(sanitizeCsvCell('DJ " groove " set'), '"DJ "" groove "" set"');
      assert.equal(sanitizeCsvCell(null), '""');
    });
  });

  const sampleEvent: EventPlan = {
    id: 'evt-1',
    title: 'Starlight Gala',
    eventType: 'wedding',
    date: '2026-10-24',
    location: 'Grand Conservatory',
    guestCount: 120,
    targetBudget: 25000,
    vibeAndTheme: 'Celestial Black Tie',
    colorPalette: [{ name: 'Midnight', hex: '#191970' }],
    summaryStory: 'An unforgettable evening.',
    keyHighlights: ['String quartet prelude', 'Champagne tower'],
    budgetItems: [
      {
        id: 'b1',
        category: 'Venue',
        name: 'Botanical Hall',
        plannedCost: 8000,
        actualCost: 8000,
        paid: true,
        notes: 'Includes chairs, tables',
      },
      {
        id: 'b2',
        category: 'Catering',
        name: '=HYPERLINK("http://evil.example")',
        plannedCost: 4000,
        actualCost: 0,
        paid: false,
        notes: '',
      },
    ],
    timelineItems: [
      {
        id: 't1',
        title: 'Doors Open',
        description: 'Welcome cocktails',
        phase: 'Day-of Schedule',
        timeOfDay: '05:00 PM',
        completed: false,
        priority: 'high',
        dayOfOrder: 1,
      },
    ],
    vendorItems: [
      {
        id: 'v1',
        category: 'Venue',
        name: 'Grand Conservatory',
        roleDescription: 'Main hall',
        estimatedCost: 10000,
        actualCost: 10000,
        status: 'booked',
        questionsToAsk: [],
      },
    ],
    personalizedIdeas: [],
    customNotes: 'VIP guests arrive via North Gate.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  describe('formatBudgetToCsv', () => {
    it('formats budget line items and summary row into RFC 4180 CSV with headers', () => {
      const csv = formatBudgetToCsv(sampleEvent);
      const lines = csv.split('\n');
      assert.equal(lines.length, 4); // header + 2 items + 1 summary row
      assert.equal(
        lines[0],
        'Category,Item Name,Planned Cost ($),Actual Cost ($),Paid Status,Notes'
      );
      assert.ok(lines[1].includes('"Venue","Botanical Hall",8000,8000,"Paid","Includes chairs, tables"'));
      assert.ok(lines[2].includes('"\'=HYPERLINK(""http://evil.example"")"'));
      assert.ok(lines[3].includes('"TOTAL SUMMARY"'));
    });
  });

  describe('formatEventDossierMarkdown', () => {
    it('generates structured Markdown summary including highlights, budget, run of show, vendors, and custom notes', () => {
      const md = formatEventDossierMarkdown(sampleEvent);
      assert.ok(md.includes('# Starlight Gala'));
      assert.ok(md.includes('**Event Type:** WEDDING'));
      assert.ok(md.includes('1. String quartet prelude'));
      assert.ok(md.includes('- [x] **Venue**: Botanical Hall'));
      assert.ok(md.includes('- **05:00 PM**: Doors Open — Welcome cocktails'));
      assert.ok(md.includes('## Planner Notes\nVIP guests arrive via North Gate.'));
    });
  });

  describe('parseEstimatedCostImpact & Idea Converters', () => {
    it('extracts numeric cost from estimatedCostImpact strings and returns 0 for savings', () => {
      assert.equal(parseEstimatedCostImpact('+$180 for dispensers'), 180);
      assert.equal(parseEstimatedCostImpact('~$1,250 for live band'), 1250);
      assert.equal(parseEstimatedCostImpact('Saves ~$350 on florals'), 0);
      assert.equal(parseEstimatedCostImpact(undefined), 0);
    });

    it('converts a PersonalizedIdea into a valid BudgetItem and TimelineItem', () => {
      const idea: PersonalizedIdea = {
        id: 'idea-99',
        title: 'Rosemary Citrus Spritz Tap',
        category: 'food_drink',
        description: 'Self-serve beverage station',
        whyItFitsTheme: 'Interactive refreshment',
        estimatedCostImpact: '+$220 for dispensers',
        addedToPlan: false,
      };

      const budgetItem = convertIdeaToBudgetItem(idea, 'budget-idea-1000');
      assert.equal(budgetItem.id, 'budget-idea-1000');
      assert.equal(budgetItem.category, 'Catering & Bar');
      assert.equal(budgetItem.name, 'Rosemary Citrus Spritz Tap');
      assert.equal(budgetItem.plannedCost, 220);
      assert.equal(budgetItem.paid, false);

      const timelineItem = convertIdeaToTimelineItem(idea, 'timeline-idea-1000');
      assert.equal(timelineItem.id, 'timeline-idea-1000');
      assert.equal(timelineItem.phase, '1-2 Months');
      assert.equal(timelineItem.priority, 'medium');
      assert.ok(timelineItem.title.includes('Rosemary Citrus Spritz Tap'));
    });
  });
});
