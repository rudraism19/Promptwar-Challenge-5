import type {
  ColorSwatch,
  EventCreationPrompt,
  EventPlan,
  EventType,
  IdeaCategory,
  PersonalizedIdea,
} from '../types.ts';

const VALID_EVENT_TYPES: readonly EventType[] = [
  'wedding',
  'birthday',
  'community',
  'corporate',
  'other',
];

const VALID_IDEA_CATEGORIES: readonly IdeaCategory[] = [
  'theme_decor',
  'food_drink',
  'entertainment_activity',
  'budget_saver',
  'contingency_backup',
];

export type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string };

function clampString(val: unknown, fallback: string, maxLen = 500): string {
  if (typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLen) : fallback;
}

function clampNumber(val: unknown, fallback: number, min: number, max: number): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Math.round(num)));
}

export function validateEventCreationInput(body: unknown): ValidationResult<EventCreationPrompt> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Request payload must be a JSON object.' };
  }

  const raw = body as Record<string, unknown>;
  const rawType = typeof raw.eventType === 'string' ? raw.eventType.trim().toLowerCase() : 'wedding';
  const eventType: EventType = VALID_EVENT_TYPES.includes(rawType as EventType)
    ? (rawType as EventType)
    : 'other';

  const defaultTitle =
    eventType === 'wedding'
      ? 'Sunset Garden Romance'
      : eventType === 'birthday'
      ? 'Milestone Celebration'
      : eventType === 'community'
      ? 'Neighborhood Block Festival'
      : 'Signature Celebration';

  const title = clampString(raw.title, defaultTitle, 140);
  const date = clampString(raw.date, '2026-10-24', 30);
  const location = clampString(raw.location, 'Riverfront Pavilion & Courtyard', 160);
  const guestCount = clampNumber(raw.guestCount, 80, 1, 100000);
  const targetBudget = clampNumber(raw.targetBudget, 12000, 100, 10000000);
  const vibe = clampString(raw.vibe, 'Warm, inviting, and unforgettable', 400);
  const specialRequests = clampString(raw.specialRequests, '', 600);

  return {
    valid: true,
    data: {
      eventType,
      title,
      date,
      location,
      guestCount,
      targetBudget,
      vibe,
      specialRequests,
    },
  };
}

export interface BrainstormInput {
  eventTitle: string;
  eventType: EventType;
  vibe: string;
  guestCount: number;
  budget: number;
  prompt: string;
  category?: IdeaCategory;
}

export function validateBrainstormInput(body: unknown): ValidationResult<BrainstormInput> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Request payload must be a JSON object.' };
  }
  const raw = body as Record<string, unknown>;
  const prompt = clampString(raw.prompt, '', 400);
  if (!prompt) {
    return { valid: false, error: 'A non-empty prompt is required to brainstorm ideas.' };
  }

  const rawType = typeof raw.eventType === 'string' ? raw.eventType.trim().toLowerCase() : 'other';
  const eventType: EventType = VALID_EVENT_TYPES.includes(rawType as EventType)
    ? (rawType as EventType)
    : 'other';

  const rawCat = typeof raw.category === 'string' ? raw.category.trim() : '';
  const category = VALID_IDEA_CATEGORIES.includes(rawCat as IdeaCategory)
    ? (rawCat as IdeaCategory)
    : undefined;

  return {
    valid: true,
    data: {
      eventTitle: clampString(raw.eventTitle, 'Celebration', 140),
      eventType,
      vibe: clampString(raw.vibe, 'Festive and memorable', 300),
      guestCount: clampNumber(raw.guestCount, 80, 1, 100000),
      budget: clampNumber(raw.budget, 10000, 100, 10000000),
      prompt,
      category,
    },
  };
}

export interface VendorAdviceInput {
  vendorCategory: string;
  eventType: EventType;
  targetBudget: number;
  specialRequirements: string;
}

export function validateVendorAdviceInput(body: unknown): ValidationResult<VendorAdviceInput> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Request payload must be a JSON object.' };
  }
  const raw = body as Record<string, unknown>;
  const vendorCategory = clampString(raw.vendorCategory, '', 100);
  if (!vendorCategory) {
    return { valid: false, error: 'vendorCategory is required.' };
  }

  const rawType = typeof raw.eventType === 'string' ? raw.eventType.trim().toLowerCase() : 'other';
  const eventType: EventType = VALID_EVENT_TYPES.includes(rawType as EventType)
    ? (rawType as EventType)
    : 'other';

  return {
    valid: true,
    data: {
      vendorCategory,
      eventType,
      targetBudget: clampNumber(raw.targetBudget, 10000, 100, 10000000),
      specialRequirements: clampString(raw.specialRequirements, 'Standard full-service coverage', 400),
    },
  };
}

/**
 * Safely parses JSON from raw model text, stripping markdown code fences if present.
 */
export function parseModelJson<T>(rawText: string): T {
  const trimmed = (rawText || '').trim();
  if (!trimmed) {
    throw new Error('Model returned empty response');
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const fenced = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    try {
      return JSON.parse(fenced) as T;
    } catch {
      const objMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (objMatch) {
        return JSON.parse(objMatch[1]) as T;
      }
      throw new Error('Failed to parse valid JSON from model output');
    }
  }
}

export function generateFallbackPlan(rawParams: Partial<EventCreationPrompt>): EventPlan {
  const validated = validateEventCreationInput(rawParams);
  const params: EventCreationPrompt = validated.valid
    ? validated.data
    : {
        eventType: 'wedding',
        title: 'Sunset Garden Romance',
        date: '2026-10-24',
        location: 'Riverfront Pavilion & Courtyard',
        guestCount: 80,
        targetBudget: 12000,
        vibe: 'Warm, inviting, and unforgettable',
        specialRequests: '',
      };

  const { eventType, title, date, location, guestCount, targetBudget, vibe, specialRequests } = params;
  const isWedding = eventType === 'wedding';
  const isBirthday = eventType === 'birthday';
  const isCommunity = eventType === 'community';

  const colorPalette: ColorSwatch[] = isWedding
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
    : isCommunity
    ? [
        { name: 'Terracotta', hex: '#e2725b' },
        { name: 'Forest Green', hex: '#228b22' },
        { name: 'Sunny Amber', hex: '#ffbf00' },
        { name: 'Sky Cyan', hex: '#4682b4' },
      ]
    : [
        { name: 'Royal Indigo', hex: '#2e3192' },
        { name: 'Champagne', hex: '#f7e7ce' },
        { name: 'Slate Silver', hex: '#708090' },
        { name: 'Amber Gold', hex: '#ffbf00' },
      ];

  const venueCost = Math.round(targetBudget * 0.32);
  const cateringCost = Math.round(targetBudget * 0.35);
  const photoCost = Math.round(targetBudget * 0.12);
  const decorCost = Math.round(targetBudget * 0.09);
  const entertainmentCost = Math.round(targetBudget * 0.07);
  const contingencyCost = Math.max(
    0,
    targetBudget - (venueCost + cateringCost + photoCost + decorCost + entertainmentCost)
  );

  const specialHighlight = specialRequests
    ? `Custom Feature: ${specialRequests}`
    : 'Vibrant celebration finale with custom lighting and signature treats';

  const now = new Date().toISOString();

  return {
    id: `event-${Date.now()}`,
    title,
    eventType,
    date,
    targetBudget,
    guestCount,
    location,
    vibeAndTheme: vibe,
    colorPalette,
    summaryStory: `A thoughtfully crafted ${eventType} experience at ${location} tailored for ${guestCount} guests, balancing memorable design, seamless guest flow, and relaxed sophistication.`,
    keyHighlights: [
      isCommunity
        ? 'Community welcome plaza with local artisan makers & live acoustic stage'
        : 'Welcome drinks & live ambient prelude music as guests arrive',
      `Artisanal dining & refreshments curated for ${guestCount} attendees`,
      'Interactive focal station designed for shared memories and candid photos',
      specialHighlight,
    ],
    budgetItems: [
      {
        id: 'b1',
        category: isCommunity ? 'City Permits & Parks' : 'Venue',
        name: isCommunity ? 'Park Reservation, Permits & Infrastructure' : 'Main Venue Rental & Setup Access',
        plannedCost: venueCost,
        actualCost: venueCost,
        paid: true,
        notes: 'Includes tables, chairs, and facility access',
      },
      {
        id: 'b2',
        category: 'Catering & Bar',
        name: 'Catering, Beverages & Service Staff',
        plannedCost: cateringCost,
        actualCost: 0,
        paid: false,
        notes: `Curated dining and beverage service for ${guestCount} guests`,
      },
      {
        id: 'b3',
        category: 'Photo & Video',
        name: 'Event Photographer & Digital Gallery',
        plannedCost: photoCost,
        actualCost: photoCost,
        paid: true,
        notes: 'High-res gallery delivery within 2 weeks',
      },
      {
        id: 'b4',
        category: 'Decor & Florals',
        name: 'Tablescapes, Backdrop & Feature Lighting',
        plannedCost: decorCost,
        actualCost: 0,
        paid: false,
        notes: `Styled around theme: ${vibe.slice(0, 60)}`,
      },
      {
        id: 'b5',
        category: 'Entertainment',
        name: 'Live DJ / Musician & Audio Setup',
        plannedCost: entertainmentCost,
        actualCost: 0,
        paid: false,
        notes: '4 hours coverage with wireless microphones',
      },
      {
        id: 'b6',
        category: 'Contingency',
        name: 'Emergency Buffer & Miscellaneous',
        plannedCost: contingencyCost,
        actualCost: 0,
        paid: false,
        notes: specialRequests ? `Includes notes: ${specialRequests}` : 'Kept in reserve for unforeseen items',
      },
    ],
    timelineItems: [
      {
        id: 't1',
        title: isCommunity ? 'Submit Municipal Park & Sound Permit Application' : 'Confirm & Sign Venue Contract',
        description: 'Review load-in restrictions, insurance policies, and curfew times.',
        phase: '6-9 Months',
        dueDate: '2026-04-15',
        completed: true,
        priority: 'high',
        assignedTo: 'Lead Planner',
      },
      {
        id: 't2',
        title: 'Hire Primary Vendors (Catering, Photo, Music)',
        description: 'Collect bids and compare tastings or portfolio samples.',
        phase: '3-5 Months',
        dueDate: '2026-06-15',
        completed: true,
        priority: 'high',
        assignedTo: 'Lead Planner',
      },
      {
        id: 't3',
        title: 'Distribute Invitations & Launch RSVP Portal',
        description: 'Track headcounts, meal preferences, and accessibility requirements.',
        phase: '1-2 Months',
        dueDate: '2026-08-20',
        completed: false,
        priority: 'high',
        assignedTo: 'Host',
      },
      {
        id: 't4',
        title: 'Final Vendor Coordination Walkthrough',
        description: 'Review floor plans, electrical outlet locations, and run-of-show timing.',
        phase: 'Final Weeks',
        dueDate: '2026-10-05',
        completed: false,
        priority: 'medium',
        assignedTo: 'Coordinator',
      },
      {
        id: 't5',
        title: '01:00 PM - Vendor Load-In & Decor Setup',
        description: 'Sound checks, tables set, floral arrangements delivered.',
        phase: 'Day-of Schedule',
        timeOfDay: '01:00 PM - 03:00 PM',
        completed: false,
        priority: 'high',
        dayOfOrder: 1,
      },
      {
        id: 't6',
        title: '04:00 PM - Guest Arrival & Welcome Refreshments',
        description: 'Ambient music playing, welcome signage, hospitality greeting.',
        phase: 'Day-of Schedule',
        timeOfDay: '04:00 PM - 04:45 PM',
        completed: false,
        priority: 'high',
        dayOfOrder: 2,
      },
      {
        id: 't7',
        title: isWedding
          ? '05:00 PM - Main Ceremony & Vow Exchange'
          : isBirthday
          ? '05:00 PM - Milestone Welcome Toast & Interactive Showcase'
          : '05:00 PM - Main Program & Keynote Celebration',
        description: 'The emotional centerpiece of the gathering.',
        phase: 'Day-of Schedule',
        timeOfDay: '05:00 PM - 06:00 PM',
        completed: false,
        priority: 'high',
        dayOfOrder: 3,
      },
      {
        id: 't8',
        title: '06:15 PM - Dinner Service & Toasts',
        description: 'Food stations or plated service; structured heartfelt speeches.',
        phase: 'Day-of Schedule',
        timeOfDay: '06:15 PM - 07:45 PM',
        completed: false,
        priority: 'medium',
        dayOfOrder: 4,
      },
      {
        id: 't9',
        title: '08:00 PM - Celebration Party, Dancing & Dessert',
        description: 'Tempo picks up; dessert station opens.',
        phase: 'Day-of Schedule',
        timeOfDay: '08:00 PM - 10:30 PM',
        completed: false,
        priority: 'medium',
        dayOfOrder: 5,
      },
    ],
    vendorItems: [
      {
        id: 'v1',
        category: 'Venue',
        name: location,
        roleDescription: 'Primary indoor/outdoor event space with full guest amenities.',
        estimatedCost: venueCost,
        actualCost: venueCost,
        status: 'booked',
        questionsToAsk: ['Are outside caterers permitted?', 'What is the exact sound curfew?'],
      },
      {
        id: 'v2',
        category: 'Catering',
        name: 'Artisan Feast Culinary Group',
        roleDescription: `Full-service catering and beverage stations for ${guestCount} guests.`,
        estimatedCost: cateringCost,
        status: 'contacted',
        questionsToAsk: ['Do you handle tableware rentals?', 'What is your server-to-guest ratio?'],
      },
      {
        id: 'v3',
        category: 'Photography',
        name: 'Vivid Memory Studios',
        roleDescription: 'Full coverage candid photojournalism with high-resolution gallery.',
        estimatedCost: photoCost,
        actualCost: photoCost,
        status: 'booked',
        questionsToAsk: ['When is the sneak-peek gallery available?'],
      },
    ],
    personalizedIdeas: [
      {
        id: 'i1',
        title: 'Custom Mocktail & Cocktail Tap Station',
        category: 'food_drink',
        description: 'Self-serve barrel taps with infused rosemary citrus soda and spiked peach spritz.',
        whyItFitsTheme: `Complements the "${vibe}" aesthetic while preventing bar lines.`,
        estimatedCostImpact: '+$180 for barrel dispensers & herbal sprigs',
        addedToPlan: false,
      },
      {
        id: 'i2',
        title: 'Illuminated Memory Archway Entrance',
        category: 'theme_decor',
        description: 'Twinkling fairylights woven through botanical garlands over the entry door.',
        whyItFitsTheme: 'Immerses guests into the celebration atmosphere the second they walk in.',
        estimatedCostImpact: '~$95 DIY materials',
        addedToPlan: false,
      },
      {
        id: 'i3',
        title: 'Dual-Purpose Ceremony & Reception Decor Strategy',
        category: 'budget_saver',
        description: 'Repurpose welcome and ceremony floral pillars to frame the dessert and toast station.',
        whyItFitsTheme: 'Maximizes visual impact across the venue while saving on floral orders.',
        estimatedCostImpact: 'Saves ~$450 on florals',
        addedToPlan: true,
      },
    ],
    customNotes: specialRequests || '',
    createdAt: now,
    updatedAt: now,
  };
}

export function generateFallbackIdeas(
  eventType: EventType = 'other',
  promptText: string = '',
  preferredCategory?: IdeaCategory
): PersonalizedIdea[] {
  const cleanPrompt = promptText.trim() || ' memorable guest experiences';
  const ts = Date.now();

  const allIdeas: PersonalizedIdea[] = [
    {
      id: `idea-${ts}-1`,
      title: `Interactive ${eventType === 'wedding' ? 'Audio Guestbook & Polaroid' : 'Portrait & Memory'} Wall`,
      category: preferredCategory || 'entertainment_activity',
      description: `Inspired by "${cleanPrompt.slice(0, 60)}": equip two instant cameras and a vintage audio recorder where attendees snap portraits and leave voice memories.`,
      whyItFitsTheme: `Tailored for your ${eventType} to combine guest entertainment with a lasting keepsake.`,
      estimatedCostImpact: '~$120 for film and props',
      addedToPlan: false,
    },
    {
      id: `idea-${ts}-2`,
      title: 'Signature Infused Beverage & Late-Night Bite Bar',
      category: preferredCategory || 'food_drink',
      description: 'Serve warm gourmet sliders or soft pretzels paired with botanical citrus spritzers an hour before the finale.',
      whyItFitsTheme: 'Re-energizes guests during the evening celebration without requiring a full second meal.',
      estimatedCostImpact: '+$220 for 80 guests',
      addedToPlan: false,
    },
    {
      id: `idea-${ts}-3`,
      title: 'Modular Focal Backdrop & Repurposed Uplighting',
      category: preferredCategory || 'budget_saver',
      description: 'Use movable warm LED uplights and modular greenery frames that shift from the welcome area to the main party floor.',
      whyItFitsTheme: 'Delivers high-end ambiance while cutting duplicate decor rental costs.',
      estimatedCostImpact: 'Saves ~$350 on decor rentals',
      addedToPlan: false,
    },
    {
      id: `idea-${ts}-4`,
      title: 'All-Weather Canopy & Acoustic Indoor Backup Plan',
      category: preferredCategory || 'contingency_backup',
      description: 'Pre-map an indoor lounge layout and hold a 48-hour refundable clear-top tent reservation in case of rain or high wind.',
      whyItFitsTheme: 'Guarantees zero stress if weather shifts on the day of the event.',
      estimatedCostImpact: '~$150 refundable hold deposit',
      addedToPlan: false,
    },
  ];

  if (preferredCategory) {
    return allIdeas.map((idea) => ({ ...idea, category: preferredCategory }));
  }
  return allIdeas.slice(0, 3);
}

export interface VendorAdviceResult {
  questions: string[];
  redFlags: string[];
  negotiationTip: string;
}

export function generateFallbackVendorAdvice(
  vendorCategory: string,
  eventType: EventType = 'wedding',
  targetBudget: number = 15000
): VendorAdviceResult {
  const cat = (vendorCategory || 'Vendor').toLowerCase();

  if (cat.includes('venue')) {
    return {
      questions: [
        'What is the exact sound curfew and decibel limit for outdoor/indoor music?',
        'Are outside caterers and bar services permitted without a landmark surcharge?',
        'What is the weather contingency space and how many hours prior is the call made?',
        'What is the earliest load-in time and latest teardown window included in the rental?',
      ],
      redFlags: [
        'Mandatory exclusive vendor lists with undisclosed 15-20% commission markups',
        'Vague force-majeure or weather rescheduling clauses in the contract',
      ],
      negotiationTip: `For a $${targetBudget.toLocaleString()} ${eventType} budget, ask the venue to waive the ceremony/setup hour fee or include existing bistro lighting and farmhouse tables at no extra charge.`,
    };
  }

  if (cat.includes('cater') || cat.includes('food') || cat.includes('bar')) {
    return {
      questions: [
        'What is your server-to-guest ratio for plated versus buffet service?',
        'Are tableware, linen napkins, and bar glassware included or rented separately?',
        'How do you handle severe food allergies, vegan plates, and vendor crew meals?',
        'When is the final guaranteed headcount locked in before the event?',
      ],
      redFlags: [
        'Uncapped service charges or automatic gratuities not itemized in the initial quote',
        'No tasting session offered prior to finalizing the menu selection',
      ],
      negotiationTip: 'Ask to switch from a full open top-shelf bar to beer, wine, and 2 signature pre-batched cocktails to save 20-25% on beverage costs.',
    };
  }

  return {
    questions: [
      `What is your standard cancellation and weather rescheduling policy for a ${eventType}?`,
      'What backup equipment and backup staffing do you have on standby for emergencies?',
      'What are the exact electrical power, meal, and space requirements you need from the venue?',
      'How do you handle schedule delays or overtime fees on the day of the event?',
    ],
    redFlags: [
      'No written contract with itemized deliverables and delivery timelines',
      'Reluctance to provide proof of general liability insurance or recent client references',
    ],
    negotiationTip: 'Inquire about off-peak or bundled package discounts, or request complimentary add-on hours in lieu of a cash discount.',
  };
}
