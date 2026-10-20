import type { EventCreationPrompt, EventPlan, PersonalizedIdea } from '../types.ts';

export async function generateAIEventPlan(params: EventCreationPrompt): Promise<EventPlan> {
  const response = await fetch('/api/ai/generate-event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Server returned error ${response.status}`);
  }

  const data = await response.json();
  if (!data.success || !data.plan) {
    throw new Error(data.message || 'Failed to generate event plan');
  }

  return data.plan;
}

export async function brainstormIdeas(params: {
  eventTitle: string;
  eventType: string;
  vibe: string;
  guestCount: number;
  budget: number;
  prompt: string;
  category?: string;
}): Promise<PersonalizedIdea[]> {
  const response = await fetch('/api/ai/brainstorm-ideas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  const data = await response.json();
  return data.ideas || [];
}

export async function getVendorAdvice(params: {
  vendorCategory: string;
  eventType: string;
  targetBudget: number;
  specialRequirements?: string;
}): Promise<{
  questions: string[];
  redFlags?: string[];
  negotiationTip?: string;
}> {
  const response = await fetch('/api/ai/vendor-advice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  const data = await response.json();
  return (
    data.advice || {
      questions: ['What does your package include?', 'What are cancellation terms?'],
      redFlags: ['No contract provided'],
      negotiationTip: 'Ask for off-season discounts.',
    }
  );
}
