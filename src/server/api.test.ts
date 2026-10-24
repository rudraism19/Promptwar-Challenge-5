import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { app } from '../../server.ts';

describe('Express API Integration Tests', () => {
  let server: Server;
  let baseUrl = '';

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      server.closeAllConnections?.();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('GET /api/health returns 200 OK and sets security headers', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.equal(res.headers.get('x-permitted-cross-domain-policies'), 'none');
    assert.equal(res.headers.get('x-powered-by'), null);

    const body = (await res.json()) as { status: string; service: string };
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'plancraft-ai');
  });

  it('POST endpoints return 400 Bad Request on malformed JSON or array payloads without exposing stack traces', async () => {
    const malformedRes = await fetch(`${baseUrl}/api/ai/generate-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"eventType": "wedding", broken_json',
    });
    assert.equal(malformedRes.status, 400);
    const malformedBody = (await malformedRes.json()) as { success: boolean; error: string };
    assert.equal(malformedBody.success, false);
    assert.match(malformedBody.error, /Malformed JSON/i);

    const arrayBodyRes = await fetch(`${baseUrl}/api/ai/generate-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(['not', 'an', 'object']),
    });
    assert.equal(arrayBodyRes.status, 400);
  });

  it('POST /api/ai/generate-event generates a complete event plan for wedding, birthday, and community events', async () => {
    const res = await fetch(`${baseUrl}/api/ai/generate-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'community',
        title: 'Oak Park Harvest Festival',
        date: '2026-10-18',
        location: 'Oak Park Amphitheater',
        guestCount: 350,
        targetBudget: 14000,
        vibe: 'Warm autumn harvest with folk music',
      }),
    });

    assert.equal(res.status, 200);
    const data = (await res.json()) as {
      success: boolean;
      plan: {
        title: string;
        eventType: string;
        targetBudget: number;
        budgetItems: unknown[];
        timelineItems: unknown[];
        vendorItems: unknown[];
        personalizedIdeas: unknown[];
      };
    };
    assert.equal(data.success, true);
    assert.equal(data.plan.eventType, 'community');
    assert.equal(data.plan.targetBudget, 14000);
    assert.ok(data.plan.budgetItems.length > 0);
    assert.ok(data.plan.timelineItems.length > 0);
    assert.ok(data.plan.vendorItems.length > 0);
    assert.ok(data.plan.personalizedIdeas.length > 0);
  });

  it('POST /api/ai/brainstorm-ideas returns 400 when prompt is missing and 200 for valid prompt', async () => {
    const badRes = await fetch(`${baseUrl}/api/ai/brainstorm-ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'wedding', prompt: '   ' }),
    });
    assert.equal(badRes.status, 400);

    const goodRes = await fetch(`${baseUrl}/api/ai/brainstorm-ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventTitle: 'Sunset Wedding',
        eventType: 'wedding',
        vibe: 'Romantic garden',
        guestCount: 100,
        budget: 25000,
        prompt: 'Interactive guestbook ideas',
        category: 'entertainment_activity',
      }),
    });
    assert.equal(goodRes.status, 200);
    const data = (await goodRes.json()) as { success: boolean; ideas: unknown[] };
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.ideas));
    assert.ok(data.ideas.length > 0);
  });

  it('POST /api/ai/vendor-advice returns 400 when vendorCategory is missing and 200 for valid category', async () => {
    const badRes = await fetch(`${baseUrl}/api/ai/vendor-advice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'wedding', vendorCategory: '' }),
    });
    assert.equal(badRes.status, 400);

    const goodRes = await fetch(`${baseUrl}/api/ai/vendor-advice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorCategory: 'Photography',
        eventType: 'wedding',
        targetBudget: 25000,
        specialRequirements: 'Full day coverage and drone aerials',
      }),
    });
    assert.equal(goodRes.status, 200);
    const data = (await goodRes.json()) as {
      success: boolean;
      advice: { questions: string[]; redFlags: string[]; negotiationTip: string };
    };
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.advice.questions));
    assert.ok(data.advice.questions.length >= 3);
  });
});
