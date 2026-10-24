import type { EventCreationPrompt, EventPlan, PersonalizedIdea } from '../types.ts';

async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string; message?: string };
    return body.error || body.message || `${fallback} (HTTP ${response.status})`;
  } catch {
    return `${fallback} (HTTP ${response.status})`;
  }
}

export async function generateAIEventPlan(params: EventCreationPrompt): Promise<EventPlan> {
  const response = await fetch('/api/ai/generate-event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Server returned error'));
  }

  const data = (await response.json()) as {
    success?: boolean;
    plan?: EventPlan;
    error?: string;
    message?: string;
  };
  if (!data.success || !data.plan) {
    throw new Error(data.error || data.message || 'Failed to generate event plan');
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
    throw new Error(await extractErrorMessage(response, 'Failed to brainstorm ideas'));
  }

  const data = (await response.json()) as { ideas?: PersonalizedIdea[] };
  return Array.isArray(data.ideas) ? data.ideas : [];
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
    throw new Error(await extractErrorMessage(response, 'Failed to fetch vendor advice'));
  }

  const data = (await response.json()) as {
    advice?: {
      questions: string[];
      redFlags?: string[];
      negotiationTip?: string;
    };
  };
  return (
    data.advice || {
      questions: ['What does your package include?', 'What are cancellation terms?'],
      redFlags: ['No contract provided'],
      negotiationTip: 'Ask for off-season discounts.',
    }
  );
}
