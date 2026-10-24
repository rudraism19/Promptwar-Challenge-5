import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEventCreationInput,
  validateBrainstormInput,
  validateVendorAdviceInput,
  parseModelJson,
  generateFallbackPlan,
  generateFallbackIdeas,
  generateFallbackVendorAdvice,
} from './planGenerators.ts';

describe('planGenerators', () => {
  describe('validateEventCreationInput', () => {
    it('validates and sanitizes valid event creation input', () => {
      const res = validateEventCreationInput({
        eventType: 'birthday',
        title: '  Neon 30th Bash  ',
        date: '2026-11-15',
        location: 'Downtown Loft',
        guestCount: 60,
        targetBudget: 8500,
        vibe: 'Retro synthwave',
      });
      assert.equal(res.valid, true);
      if (res.valid) {
        assert.equal(res.data.eventType, 'birthday');
        assert.equal(res.data.title, 'Neon 30th Bash');
        assert.equal(res.data.guestCount, 60);
        assert.equal(res.data.targetBudget, 8500);
      }
    });

    it('rejects non-object payloads and clamps extreme numeric values', () => {
      assert.equal(validateEventCreationInput(null).valid, false);
      assert.equal(validateEventCreationInput('invalid').valid, false);

      const clamped = validateEventCreationInput({
        eventType: 'invalid_type',
        guestCount: -50,
        targetBudget: 999999999,
      });
      assert.equal(clamped.valid, true);
      if (clamped.valid) {
        assert.equal(clamped.data.eventType, 'other');
        assert.equal(clamped.data.guestCount, 1); // clamped min is 1
        assert.equal(clamped.data.targetBudget, 10000000); // clamped max
      }
    });
  });

  describe('validateBrainstormInput & validateVendorAdviceInput', () => {
    it('requires a non-empty prompt for brainstorming', () => {
      assert.equal(validateBrainstormInput({ prompt: '   ' }).valid, false);
      const ok = validateBrainstormInput({
        eventTitle: 'Garden Wedding',
        eventType: 'wedding',
        prompt: 'Late night snacks',
        category: 'food_drink',
      });
      assert.equal(ok.valid, true);
    });

    it('requires a non-empty vendorCategory for vendor advice', () => {
      assert.equal(validateVendorAdviceInput({ vendorCategory: '' }).valid, false);
      const ok = validateVendorAdviceInput({
        vendorCategory: 'Photography',
        eventType: 'wedding',
        targetBudget: 20000,
      });
      assert.equal(ok.valid, true);
    });
  });

  describe('parseModelJson', () => {
    it('parses raw JSON, markdown-fenced JSON, and embedded JSON objects/arrays', () => {
      assert.deepEqual(parseModelJson<{ a: number }>('{"a": 1}'), { a: 1 });
      assert.deepEqual(parseModelJson<{ a: number }>('```json\n{"a": 2}\n```'), { a: 2 });
      assert.deepEqual(parseModelJson<number[]>('Here is the array:\n[1, 2, 3]\nThanks!'), [1, 2, 3]);
    });

    it('throws on empty or unparseable strings', () => {
      assert.throws(() => parseModelJson(''));
      assert.throws(() => parseModelJson('No JSON here at all'));
    });
  });

  describe('Fallback Generators', () => {
    it('generates complete, realistic plans across wedding, birthday, and community events', () => {
      const weddingPlan = generateFallbackPlan({ eventType: 'wedding', targetBudget: 20000, guestCount: 100 });
      assert.equal(weddingPlan.eventType, 'wedding');
      assert.equal(weddingPlan.targetBudget, 20000);
      assert.ok(weddingPlan.budgetItems.length >= 6);
      assert.ok(weddingPlan.timelineItems.some((t) => t.phase === 'Day-of Schedule'));

      const birthdayPlan = generateFallbackPlan({ eventType: 'birthday', targetBudget: 5000 });
      assert.equal(birthdayPlan.eventType, 'birthday');
      assert.equal(birthdayPlan.colorPalette[0].name, 'Electric Violet');

      const communityPlan = generateFallbackPlan({ eventType: 'community', targetBudget: 15000 });
      assert.equal(communityPlan.eventType, 'community');
      assert.equal(communityPlan.colorPalette[0].name, 'Terracotta');
    });

    it('generates fallback ideas and category-tailored vendor advice', () => {
      const ideas = generateFallbackIdeas('birthday', 'arcade games', 'entertainment_activity');
      assert.equal(ideas.length, 4);
      assert.equal(ideas[0].category, 'entertainment_activity');

      const defaultIdeas = generateFallbackIdeas('wedding', 'welcome drinks');
      assert.equal(defaultIdeas.length, 3);

      const cateringAdvice = generateFallbackVendorAdvice('Catering & Bar');
      assert.ok(cateringAdvice.questions.length >= 4);
      assert.ok(cateringAdvice.redFlags.length >= 2);
      assert.ok(cateringAdvice.negotiationTip.length > 10);
    });
  });
});
