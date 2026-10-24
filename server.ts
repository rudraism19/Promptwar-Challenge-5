import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import type { EventPlan, PersonalizedIdea } from './src/types.ts';
import { sanitizeEventPlan } from './src/utils/eventCalculations.ts';
import {
  generateFallbackIdeas,
  generateFallbackPlan,
  generateFallbackVendorAdvice,
  parseModelJson,
  validateBrainstormInput,
  validateEventCreationInput,
  validateVendorAdviceInput,
  type VendorAdviceResult,
} from './src/utils/planGenerators.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

export const app = express();

// Security & hardening headers
app.disable('x-powered-by');
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  next();
});

// Keep API payloads bounded: event inputs are structured text, not file uploads
app.use(express.json({ limit: '256kb' }));

// Handle malformed JSON request bodies cleanly without exposing stack traces
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON in request body.',
    });
  }
  return next(err);
});

const apiKey =
  process.env.NODE_ENV === 'test' ? undefined : process.env.GEMINI_API_KEY?.trim();
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'plancraft-ai',
    aiConfigured: Boolean(ai),
  });
});

// Endpoint: Generate full AI event plan
app.post('/api/ai/generate-event', async (req: Request, res: Response) => {
  const validation = validateEventCreationInput(req.body ?? {});
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: validation.error,
    });
  }

  const input = validation.data;

  try {
    if (!ai) {
      const fallbackPlan = generateFallbackPlan(input);
      return res.json({ success: true, plan: fallbackPlan, source: 'fallback' });
    }

    const systemPrompt = `You are PlanCraft AI, an organized event planning director specializing in weddings, birthdays, and community festivals.
Create a personalized event plan as STRICT JSON. The total target budget is $${input.targetBudget}.
Include title, vibeAndTheme, colorPalette (4-5 {name,hex} items), summaryStory, keyHighlights (4),
budgetItems (7-10 items with id, category, name, plannedCost, actualCost, paid, notes; planned costs should total about the budget),
timelineItems (9-14 milestones and at least 5 sequential day-of items),
vendorItems (4-6 vendor recommendations with questionsToAsk),
and personalizedIdeas (4-5 ideas across food_drink, theme_decor, entertainment_activity, budget_saver, contingency_backup).
Return ONLY valid JSON without markdown fences.`;

    const userPrompt = `Event Request:
- Type: ${input.eventType}
- Name/Concept: ${input.title}
- Target Date: ${input.date}
- Location: ${input.location}
- Expected Guests: ${input.guestCount}
- Target Total Budget: $${input.targetBudget}
- Desired Vibe/Style: ${input.vibe}
- Special Notes / Must-Haves: ${input.specialRequests || 'None provided; surprise with thoughtful touches.'}

Generate the complete JSON event plan.`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      }),
      12000,
      'AI event generation timed out'
    );

    const parsed = parseModelJson<Partial<EventPlan>>(response.text || '');
    const plan = sanitizeEventPlan({
      ...parsed,
      id: `event-${Date.now()}`,
      title: parsed.title || input.title,
      eventType: input.eventType,
      targetBudget: input.targetBudget,
      guestCount: input.guestCount,
      date: input.date,
      location: input.location,
    });

    return res.json({ success: true, plan, source: 'gemini' });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'AI generation fallback triggered';
    const fallbackPlan = generateFallbackPlan(input);
    return res.json({
      success: true,
      plan: fallbackPlan,
      source: 'fallback',
      note: errMsg,
    });
  }
});

// Endpoint: AI brainstorming for ideas
app.post('/api/ai/brainstorm-ideas', async (req: Request, res: Response) => {
  const validation = validateBrainstormInput(req.body);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: validation.error,
    });
  }

  const input = validation.data;

  try {
    if (!ai) {
      return res.json({
        success: true,
        ideas: generateFallbackIdeas(input.eventType, input.prompt, input.category),
        source: 'fallback',
      });
    }

    const systemPrompt = `You are a visionary event experience designer. Generate 3 to 4 innovative, practical event ideas as a JSON array.
Each idea must include id, title, category (theme_decor|food_drink|entertainment_activity|budget_saver|contingency_backup), description, whyItFitsTheme, estimatedCostImpact, addedToPlan=false. Return ONLY JSON.`;

    const userPrompt = `Event: "${input.eventTitle}" (${input.eventType}), Vibe: "${input.vibe}", Guests: ${input.guestCount}, Budget: $${input.budget}.
User Request: ${input.prompt}
Focus Category: ${input.category || 'any'}`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      }),
      6000,
      'Brainstorm timed out'
    );

    const parsed = parseModelJson<PersonalizedIdea[]>(response.text || '[]');
    const ideas = Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : generateFallbackIdeas(input.eventType, input.prompt, input.category);

    return res.json({ success: true, ideas, source: 'gemini' });
  } catch {
    return res.json({
      success: true,
      ideas: generateFallbackIdeas(input.eventType, input.prompt, input.category),
      source: 'fallback',
    });
  }
});

// Endpoint: AI vendor interview questions and advice
app.post('/api/ai/vendor-advice', async (req: Request, res: Response) => {
  const validation = validateVendorAdviceInput(req.body);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: validation.error,
    });
  }

  const input = validation.data;

  try {
    if (!ai) {
      return res.json({
        success: true,
        advice: generateFallbackVendorAdvice(
          input.vendorCategory,
          input.eventType,
          input.targetBudget
        ),
        source: 'fallback',
      });
    }

    const systemPrompt = `You are a seasoned event production manager. Provide sharp vendor vetting advice for a ${input.vendorCategory} for a ${input.eventType} (Budget: $${input.targetBudget}).
Return JSON with questions (array of 4), redFlags (array of 2-3), and negotiationTip (string).`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Category: ${input.vendorCategory}. Special considerations: ${input.specialRequirements}`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      }),
      6000,
      'AI vendor advice timed out'
    );

    const parsed = parseModelJson<VendorAdviceResult>(response.text || '{}');
    const advice: VendorAdviceResult =
      parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0
        ? parsed
        : generateFallbackVendorAdvice(
            input.vendorCategory,
            input.eventType,
            input.targetBudget
          );

    return res.json({ success: true, advice, source: 'gemini' });
  } catch {
    return res.json({
      success: true,
      advice: generateFallbackVendorAdvice(
        input.vendorCategory,
        input.eventType,
        input.targetBudget
      ),
      source: 'fallback',
    });
  }
});

export async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  return app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `PlanCraft AI Server listening on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`
    );
  });
}

const isDirectRun =
  process.env.NODE_ENV !== 'test' &&
  process.argv[1] &&
  path.resolve(process.argv[1]) === __filename;

if (isDirectRun) {
  startServer();
}