import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { generateAIEventPlan, brainstormIdeas, getVendorAdvice } from './api.ts';
import { generateFallbackPlan } from '../utils/planGenerators.ts';

describe('Frontend API Service Layer (src/services/api.ts)', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('generateAIEventPlan returns plan on 200 OK and throws descriptive error on HTTP 400 or missing plan', async () => {
    const mockPlan = generateFallbackPlan({ eventType: 'wedding', title: 'Test Wedding' });
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ success: true, plan: mockPlan }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    const result = await generateAIEventPlan({
      eventType: 'wedding',
      title: 'Test Wedding',
      date: '2026-10-10',
      location: 'Botanical Conservatory',
      guestCount: 100,
      targetBudget: 20000,
      vibe: 'Romantic garden',
    });
    assert.equal(result.title, 'Test Wedding');

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ success: false, error: 'Invalid event payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });

    await assert.rejects(
      () =>
        generateAIEventPlan({
          eventType: 'wedding',
          title: 'Bad Request',
          date: '2026-10-10',
          location: 'Venue',
          guestCount: 50,
          targetBudget: 5000,
          vibe: 'Modern',
        }),
      /Invalid event payload/
    );

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ success: false, message: 'Missing plan object' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    await assert.rejects(
      () =>
        generateAIEventPlan({
          eventType: 'wedding',
          title: 'Missing Plan',
          date: '2026-10-10',
          location: 'Venue',
          guestCount: 50,
          targetBudget: 5000,
          vibe: 'Modern',
        }),
      /Missing plan object/
    );
  });

  it('brainstormIdeas returns ideas array and handles non-JSON error status codes gracefully', async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          success: true,
          ideas: [
            {
              id: 'idea-1',
              title: 'Acoustic Trio Welcome',
              category: 'entertainment_activity',
              description: 'String trio during arrival.',
              whyItFitsTheme: 'Elegant ambiance.',
              estimatedCostImpact: '+$450',
              addedToPlan: false,
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    const ideas = await brainstormIdeas({
      eventTitle: 'Gala',
      eventType: 'wedding',
      vibe: 'Classic',
      guestCount: 120,
      budget: 25000,
      prompt: 'Music ideas',
    });
    assert.equal(ideas.length, 1);
    assert.equal(ideas[0].title, 'Acoustic Trio Welcome');

    globalThis.fetch = async () => new Response('Internal Server Error', { status: 500 });
    await assert.rejects(
      () =>
        brainstormIdeas({
          eventTitle: 'Gala',
          eventType: 'wedding',
          vibe: 'Classic',
          guestCount: 120,
          budget: 25000,
          prompt: 'Music ideas',
        }),
      /HTTP 500/
    );
  });

  it('getVendorAdvice returns server advice or default fallback structure when advice property is omitted', async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          success: true,
          advice: {
            questions: ['Do you carry backup cameras?'],
            redFlags: ['No contract'],
            negotiationTip: 'Book weekday package.',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    const advice = await getVendorAdvice({
      vendorCategory: 'Photography',
      eventType: 'wedding',
      targetBudget: 15000,
    });
    assert.equal(advice.questions[0], 'Do you carry backup cameras?');

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    const fallbackAdvice = await getVendorAdvice({
      vendorCategory: 'Photography',
      eventType: 'wedding',
      targetBudget: 15000,
    });
    assert.ok(fallbackAdvice.questions.length >= 2);
  });
});
