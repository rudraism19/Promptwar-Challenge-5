import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
// Keep API payloads small: event inputs are structured text, not file uploads.
app.use(express.json({ limit: '256kb' }));

const apiKey = process.env.GEMINI_API_KEY;
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

// Endpoint: Generate full AI event plan
app.post('/api/ai/generate-event', async (req, res) => {
  try {
    const {
      eventType = 'wedding',
      title = 'Celebration',
      date = '2026-10-24',
      location = 'Local Venue',
      guestCount = 100,
      targetBudget = 15000,
      vibe = 'Festive, elegant, and joyful',
      specialRequests = '',
    } = req.body;

    if (!ai) {
      const fallbackPlan = generateFallbackPlan({
        eventType, title, date, location, guestCount, targetBudget, vibe, specialRequests,
      });
      return res.json({ success: true, plan: fallbackPlan, source: 'fallback' });
    }

    const systemPrompt = `You are PlanCraft AI, an organized event planning director specializing in weddings, birthdays, and community festivals.
Create a personalized event plan as STRICT JSON. The total target budget is $${targetBudget}.
Include title, vibeAndTheme, colorPalette (4-5 {name,hex} items), summaryStory, keyHighlights (4),
budgetItems (7-10 items with id, category, name, plannedCost, actualCost, paid, notes; planned costs should total about the budget),
timelineItems (9-14 milestones and at least 5 sequential day-of items),
vendorItems (4-6 vendor recommendations with questionsToAsk),
and personalizedIdeas (4-5 ideas across food_drink, theme_decor, entertainment_activity, budget_saver, contingency_backup).
Return ONLY valid JSON without markdown fences.`;

    const userPrompt = `Event Request:
- Type: ${eventType}
- Name/Concept: ${title}
- Target Date: ${date}
- Location: ${location}
- Expected Guests: ${guestCount}
- Target Total Budget: $${targetBudget}
- Desired Vibe/Style: ${vibe}
- Special Notes / Must-Haves: ${specialRequests || 'None provided; surprise with thoughtful touches.'}

Generate the complete JSON event plan.`;

    const aiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: { systemInstruction: systemPrompt, responseMimeType: 'application/json', temperature: 0.7 },
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI event generation timed out')), 12000)
    );
    const response: any = await Promise.race([aiCall, timeoutPromise]);
    const text = response.text || '';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error('Failed to parse model JSON output');
    }

    parsed.id = `event-${Date.now()}`;
    parsed.eventType = eventType;
    parsed.targetBudget = Number(targetBudget);
    parsed.guestCount = Number(guestCount);
    parsed.date = date;
    parsed.location = location;
    parsed.createdAt = new Date().toISOString();
    parsed.updatedAt = new Date().toISOString();
    return res.json({ success: true, plan: parsed, source: 'gemini' });
  } catch (error: any) {
    console.error('Gemini generate event error, utilizing fallback:', error);
    return res.json({ success: true, plan: generateFallbackPlan(req.body || {}), source: 'fallback', note: error?.message });
  }
});

// Endpoint: AI brainstorming for ideas
app.post('/api/ai/brainstorm-ideas', async (req, res) => {
  try {
    const { eventTitle, eventType, vibe, guestCount, budget, prompt, category } = req.body;
    if (!ai) {
      return res.json({ success: true, ideas: generateFallbackIdeas(eventType, prompt) });
    }
    const systemPrompt = `You are a visionary event experience designer. Generate 3 to 4 innovative, practical event ideas as a JSON array.
Each idea must include id, title, category (theme_decor|food_drink|entertainment_activity|budget_saver|contingency_backup), description, whyItFitsTheme, estimatedCostImpact, addedToPlan=false. Return ONLY JSON.`;
    const userPrompt = `Event: "${eventTitle}" (${eventType}), Vibe: "${vibe}", Guests: ${guestCount}, Budget: $${budget}.
User Request: ${prompt}
Focus Category: ${category || 'any'}`;
    const aiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: { systemInstruction: systemPrompt, responseMimeType: 'application/json' },
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Brainstorm timed out')), 6000)
    );
    const response: any = await Promise.race([aiCall, timeoutPromise]);
    return res.json({ success: true, ideas: JSON.parse(response.text || '[]') });
  } catch (err: any) {
    console.error('AI brainstorm error:', err);
    return res.json({ success: true, ideas: generateFallbackIdeas(req.body?.eventType, req.body?.prompt) });
  }
});

// Endpoint: AI vendor interview questions and advice
app.post('/api/ai/vendor-advice', async (req, res) => {
  try {
    const { vendorCategory, eventType, targetBudget, specialRequirements } = req.body;
    if (!ai) {
      return res.json({
        success: true,
        advice: {
          questions: [
            'What is your standard cancellation and refund policy if weather forces rescheduling?',
            'What is explicitly included in your base package versus add-on surcharges?',
            'Who will be our primary contact on the actual day of the event?',
          ],
          redFlags: ['Reluctance to provide proof of liability insurance', 'Unclear overtime rates beyond contracted hours'],
          negotiationTip: 'Ask if booking off-peak hours or bundling services yields a package discount.',
        },
      });
    }
    const systemPrompt = `You are a seasoned event production manager. Provide sharp vendor vetting advice for a ${vendorCategory} for a ${eventType} (Budget: $${targetBudget}).
Return JSON with questions (array of 4), redFlags (array of 2-3), and negotiationTip (string).`;
    const aiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Category: ${vendorCategory}. Special considerations: ${specialRequirements || 'None'}`,
      config: { systemInstruction: systemPrompt, responseMimeType: 'application/json' },
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI generation timed out')), 6000)
    );
    const response: any = await Promise.race([aiCall, timeoutPromise]);
    return res.json({ success: true, advice: JSON.parse(response.text || '{}') });
  } catch (err) {
    console.warn('Vendor advice using fallback:', err);
    return res.json({
      success: true,
      advice: {
        questions: [
          'What is your standard cancellation and weather rescheduling policy?',
          'What backup equipment or backup staffing do you have in place for emergencies?',
          'What are the exact electrical power and space requirements you need from the venue?',
          'How do you handle schedule delays or overtime fees on the day of the event?',
        ],
        redFlags: ['No written contract with defined deliverables', 'Unwillingness to show recent client references'],
        negotiationTip: 'Inquire about seasonal package discounts or complimentary upgrades in lieu of cash discounts.',
      },
    });
  }
});

// High quality fallback plan generator
function generateFallbackPlan(params: any) {
  const targetBudget = Number(params.targetBudget) || 12000;
  const guestCount = Number(params.guestCount) || 80;
  const isWedding = params.eventType === 'wedding';
  const isBirthday = params.eventType === 'birthday';
  const isCommunity = params.eventType === 'community';

  const title = params.title || (isWedding ? 'Sunset Garden Romance' : isBirthday ? 'Milestone Celebration' : 'Neighborhood Block Festival');
  const vibe = params.vibe || 'Warm, inviting, and unforgettable';

  const budgetRatio = targetBudget / 10000;

  return {
    id: `event-${Date.now()}`,
    title,
    eventType: params.eventType || 'wedding',
    date: params.date || '2026-10-17',
    targetBudget,
    guestCount,
    location: params.location || 'Riverfront Pavilion & Courtyard',
    vibeAndTheme: vibe,
    colorPalette: isWedding
      ? [
          { name: 'Champagne Rose', hex: '#eed9d7' },
          { name: 'Sage Green', hex: '#7a9a83' },
          { name: 'Warm Ivory', hex: '#fcfaf5' },
          { name: 'Soft Gold', hex: '#d4af37' },
        ]
      : isBirthday
      ? [
          { name: 'Electric Violet', hex: '#8a2be2' },
          { name: 'Vibrant Coral', hex: '#ff6f61' },
          { name: 'Midnight Blue', hex: '#191970' },
          { name: 'Gold Spark', hex: '#ffd700' },
        ]
      : [
          { name: 'Terracotta', hex: '#e2725b' },
          { name: 'Forest Green', hex: '#228b22' },
          { name: 'Sunny Amber', hex: '#ffbf00' },
          { name: 'Sky Cyan', hex: '#4682b4' },
        ],
    summaryStory: `A thoughtfully crafted ${params.eventType} experience tailored for ${guestCount} guests, balancing memorable design, seamless guest flow, and relaxed sophistication.`,
    keyHighlights: [
      'Welcome drinks & live ambient prelude music as guests arrive',
      'Artisanal dining curated with seasonal local flavors',
      'Interactive focal station designed for shared memories and candid photos',
      'Vibrant celebration finale with custom lighting and signature treats',
    ],
    budgetItems: [
      { id: 'b1', category: 'Venue', name: 'Main Venue Rental & Setup Access', plannedCost: Math.round(targetBudget * 0.32), actualCost: Math.round(targetBudget * 0.32), paid: true, notes: 'Includes tables, chairs, and cleaning fee' },
      { id: 'b2', category: 'Catering & Bar', name: 'Catering, Beverages & Service Staff', plannedCost: Math.round(targetBudget * 0.35), actualCost: 0, paid: false, notes: `Buffet or plated dining for ${guestCount} guests` },
      { id: 'b3', category: 'Photo & Video', name: 'Event Photographer & Digital Gallery', plannedCost: Math.round(targetBudget * 0.12), actualCost: Math.round(targetBudget * 0.12), paid: true, notes: 'High-res gallery delivery within 2 weeks' },
      { id: 'b4', category: 'Decor & Florals', name: 'Tablescapes, Backdrop & Feature Lighting', plannedCost: Math.round(targetBudget * 0.09), actualCost: 0, paid: false, notes: 'Seasonal florals and accent candles' },
      { id: 'b5', category: 'Entertainment', name: 'Live DJ / Musician & Audio Setup', plannedCost: Math.round(targetBudget * 0.07), actualCost: 0, paid: false, notes: '4 hours coverage with wireless microphones' },
      { id: 'b6', category: 'Contingency', name: 'Emergency Buffer & Miscellaneous', plannedCost: Math.round(targetBudget * 0.05), actualCost: 0, paid: false, notes: 'Kept in reserve for unforeseen items' },
    ],
    timelineItems: [
      { id: 't1', title: 'Confirm & Sign Venue Contract', description: 'Review load-in restrictions, insurance policies, and curfew times.', phase: '6-9 Months', dueDate: '2026-04-15', completed: true, priority: 'high' },
      { id: 't2', title: 'Hire Primary Vendors (Catering, Photo, Music)', description: 'Collect bids and compare tastings or portfolio samples.', phase: '3-5 Months', dueDate: '2026-06-15', completed: true, priority: 'high' },
      { id: 't3', title: 'Distribute Invitations & Launch RSVP Portal', description: 'Track headcounts, meal preferences, and accessibility requirements.', phase: '1-2 Months', dueDate: '2026-08-20', completed: false, priority: 'high' },
      { id: 't4', title: 'Final Vendor Coordination Walkthrough', description: 'Review floor plans, electrical outlet locations, and run-of-show timing.', phase: 'Final Weeks', dueDate: '2026-10-05', completed: false, priority: 'medium' },
      { id: 't5', title: '01:00 PM - Vendor Load-In & Decor Setup', description: 'Sound checks, tables set, floral arrangements delivered.', phase: 'Day-of Schedule', timeOfDay: '01:00 PM - 03:00 PM', completed: false, priority: 'high', dayOfOrder: 1 },
      { id: 't6', title: '04:00 PM - Guest Arrival & Welcome Refreshments', description: 'Ambient music playing, welcome signage, coat check.', phase: 'Day-of Schedule', timeOfDay: '04:00 PM - 04:45 PM', completed: false, priority: 'high', dayOfOrder: 2 },
      { id: 't7', title: '05:00 PM - Main Program / Ceremony / Presentation', description: 'The emotional centerpiece of the gathering.', phase: 'Day-of Schedule', timeOfDay: '05:00 PM - 06:00 PM', completed: false, priority: 'high', dayOfOrder: 3 },
      { id: 't8', title: '06:15 PM - Dinner Service & Toasts', description: 'Food stations or plated service; structured heartfelt speeches.', phase: 'Day-of Schedule', timeOfDay: '06:15 PM - 07:45 PM', completed: false, priority: 'medium', dayOfOrder: 4 },
      { id: 't9', title: '08:00 PM - Celebration Party, Dancing & Dessert', description: 'Tempo picks up; dessert station opens.', phase: 'Day-of Schedule', timeOfDay: '08:00 PM - 10:30 PM', completed: false, priority: 'medium', dayOfOrder: 5 },
    ],
    vendorItems: [
      { id: 'v1', category: 'Venue', name: 'The Pavilion & Courtyard', roleDescription: 'Private indoor/outdoor event space with historic brick walls and courtyard.', estimatedCost: Math.round(targetBudget * 0.32), actualCost: Math.round(targetBudget * 0.32), status: 'booked', questionsToAsk: ['Are outside caterers permitted?', 'What is the exact curfew?'] },
      { id: 'v2', category: 'Catering', name: 'Artisan Feast Culinary Group', roleDescription: 'Full-service catering with bartender, passed appetizers, and dinner.', estimatedCost: Math.round(targetBudget * 0.35), status: 'contacted', questionsToAsk: ['Do you handle plate rentals?', 'What is your staffing ratio?'] },
      { id: 'v3', category: 'Photography', name: 'Vivid Memory Studios', roleDescription: 'Full coverage candid photojournalism with drone aerials.', estimatedCost: Math.round(targetBudget * 0.12), actualCost: Math.round(targetBudget * 0.12), status: 'booked', questionsToAsk: ['When is the sneak-peek gallery available?'] },
    ],
    personalizedIdeas: [
      { id: 'i1', title: 'Custom Mocktail & Cocktail Tap Station', category: 'food_drink', description: 'Self-serve barrel taps with infused rosemary citrus soda and spiked peach spritz.', whyItFitsTheme: 'Prevents bar bottlenecks and creates an interactive visual centerpiece.', estimatedCostImpact: '+$180 for barrel dispensers & herbal sprigs', addedToPlan: false },
      { id: 'i2', title: 'Illuminated Memory Archway Entrance', category: 'theme_decor', description: 'Twinkling fairylights woven through botanical eucalyptus garlands over the entry door.', whyItFitsTheme: 'Immerses guests into the celebration atmosphere the second they walk through the door.', estimatedCostImpact: '~$95 DIY materials', addedToPlan: false },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function generateFallbackIdeas(eventType: string, promptText: string) {
  return [
    {
      id: `idea-${Date.now()}-1`,
      title: 'Interactive Guest Polaroid Keepsake Wall',
      category: 'entertainment_activity',
      description: 'Equip two instant cameras with metallic pens where attendees snap portraits and write memories to hang on a fairy-lit twine lattice.',
      whyItFitsTheme: 'Combines an activity and a physical guestbook that you keep forever.',
      estimatedCostImpact: '~$120 for film and cameras',
      addedToPlan: false,
    },
    {
      id: 'idea-2',
      title: 'Late-Night Gourmet Pretzel & Cider Bar',
      category: 'food_drink',
      description: 'Bring out warm Bavarian soft pretzels with hot beer cheese and spiced apple cider one hour before farewell.',
      whyItFitsTheme: 'Energizes guests as the evening winds down without requiring a full second meal.',
      estimatedCostImpact: '~$200 for 80 guests',
      addedToPlan: false,
    },
    {
      id: 'idea-3',
      title: 'Repurposed ceremony greenery for dessert buffet',
      category: 'budget_saver',
      description: 'Have coordinators move ceremony aisle markers to border the dessert and gift table.',
      whyItFitsTheme: 'Delivers high visual density without spending an extra dime on table runner flowers.',
      estimatedCostImpact: 'Saves ~$350 on florals',
      addedToPlan: false,
    },
  ];
}

// Dev & Production serving
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PlanCraft AI Server listening on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();