import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  Cake,
  Globe,
  PartyPopper,
  X,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Loader2,
  Check,
} from 'lucide-react';
import type { EventCreationPrompt, EventPlan, EventType } from '../types.ts';
import { generateAIEventPlan } from '../services/api.ts';
import { sanitizeEventPlan } from '../utils/eventCalculations.ts';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (plan: EventPlan) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
}) => {
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [title, setTitle] = useState<string>('Enchanted Garden Sunset Wedding');
  const [date, setDate] = useState<string>('2026-10-24');
  const [location, setLocation] = useState<string>('Oakridge Botanical Pavilion, CA');
  const [guestCount, setGuestCount] = useState<number>(100);
  const [targetBudget, setTargetBudget] = useState<number>(25000);
  const [vibe, setVibe] = useState<string>(
    'Warm organic modern with candlelit romance, earthy florals, and acoustic sunset music'
  );
  const [specialRequests, setSpecialRequests] = useState<string>(
    'Include lawn games for cocktail hour, signature herbal spritz drinks, and weather backup plan'
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const eventTypes: { type: EventType; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      type: 'wedding',
      title: 'Wedding',
      desc: 'Romance, timelines, tastings, seating, florists, & ceremony',
      icon: <Heart className="w-5 h-5 text-rose-500" />,
    },
    {
      type: 'birthday',
      title: 'Birthday Celebration',
      desc: 'Milestones, theme parties, cake, DJ, arcades & games',
      icon: <Cake className="w-5 h-5 text-purple-500" />,
    },
    {
      type: 'community',
      title: 'Community Festival',
      desc: 'Neighborhood fairs, block parties, park permits, & volunteers',
      icon: <Globe className="w-5 h-5 text-emerald-500" />,
    },
    {
      type: 'corporate',
      title: 'Corporate / Gala',
      desc: 'Company retreats, fundraisers, award ceremonies, & banquets',
      icon: <PartyPopper className="w-5 h-5 text-blue-500" />,
    },
  ];

  const vibePresets: Record<EventType, string[]> = {
    wedding: [
      'Warm organic modern with candlelit romance, earthy florals, and acoustic sunset music',
      'Timeless Black Tie Elegance with crystal chandeliers, white roses, and jazz big band',
      'Bohemian Desert Sunset with terracotta accents, macrame arches, and starry sky dining',
    ],
    birthday: [
      'Cyberpunk Neon Glow & 80s Synthwave Lounge with Retro Arcades & Craft Cocktails',
      'Golden Hollywood Glamour 40th Soirée with Champagne Towers and Red Carpet Photo Wall',
      'Rustic Backyard Fiesta with artisanal taco bar, mariachi trio, and outdoor cinema',
    ],
    community: [
      'Cozy Autumn Harvest with Floating Eco-Lanterns, Local Makers & Folk Music',
      'Summer Solstice Street Carnival with local food trucks, sidewalk chalk art, and live indie stages',
      'Neighborhood Spring Bloom Garden Fair with plant swaps, kid workshops, and pie competitions',
    ],
    corporate: [
      'Sleek Innovation Showcase with interactive tech demos, networking lounge, and craft canapés',
      'Annual Charity Masquerade Ball with silent auction, string quartet, and keynote address',
    ],
    other: [
      'Vibrant celebration with joyous music, interactive stations, and memorable communal dining',
    ],
  };

  const handleSelectEventType = (type: EventType) => {
    setEventType(type);
    const presets = vibePresets[type] || vibePresets.wedding;
    setVibe(presets[0]);
    if (type === 'wedding') {
      setTitle('Enchanted Garden Sunset Wedding');
      setTargetBudget(28000);
      setGuestCount(110);
    } else if (type === 'birthday') {
      setTitle('Electric Neon 30th Birthday Bash');
      setTargetBudget(6500);
      setGuestCount(45);
    } else if (type === 'community') {
      setTitle('Riverside Harvest & Lantern Festival');
      setTargetBudget(12000);
      setGuestCount(400);
    } else {
      setTitle('Annual Community Gala & Celebration');
      setTargetBudget(15000);
      setGuestCount(150);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Show progressive status messages
    setLoadingStep('Crafting aesthetic concept & color palette...');
    const stepTimer1 = setTimeout(() => {
      setLoadingStep('Balancing budget allocations & category line items...');
    }, 1500);
    const stepTimer2 = setTimeout(() => {
      setLoadingStep('Constructing master timeline & minute-by-minute run of show...');
    }, 3000);
    const stepTimer3 = setTimeout(() => {
      setLoadingStep('Curating vendor checklist & personalized ideas...');
    }, 4500);

    try {
      const prompt: EventCreationPrompt = {
        eventType,
        title,
        date,
        location,
        guestCount: Number(guestCount) || 80,
        targetBudget: Number(targetBudget) || 10000,
        vibe,
        specialRequests,
      };

      const rawPlan = await generateAIEventPlan(prompt);
      const plan = sanitizeEventPlan(rawPlan);
      onEventCreated(plan);
      onClose();
    } catch (err: any) {
      console.error('Error generating event plan:', err);
      setErrorMsg(err.message || 'Failed to generate event plan. Please try again.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 animate-scaleUp my-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900">
                Plan New Event with PlanCraft AI
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Tell us your vision, and AI will build your complete master plan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-stone-400 hover:text-stone-600 p-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center mx-auto text-rose-600 animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 font-serif">
              Generating Master Event Plan...
            </h3>
            <p className="text-sm font-medium text-rose-700 bg-rose-50 inline-block px-4 py-1.5 rounded-full border border-rose-200">
              {loadingStep}
            </p>
            <p className="text-xs text-stone-500 max-w-md mx-auto pt-2">
              Gemini is structuring your budgets, timing run-of-show, vetting questions, and bespoke ideas.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Step 1: Select Event Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                1. Select Event Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {eventTypes.map((t) => (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => handleSelectEventType(t.type)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      eventType === t.type
                        ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-400 shadow-2xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      {t.icon}
                      {eventType === t.type && (
                        <Check className="w-4 h-4 text-rose-600 font-bold" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-stone-900">{t.title}</div>
                      <div className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">{t.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Name & Logistics */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                2. Event Details & Scale
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Event Title / Name</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Elena & Lucas's Vineyard Wedding"
                    className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-rose-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-stone-600 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" /> Event Date
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-stone-600 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" /> Location / Venue
                    </label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Napa Valley, CA or Downtown Loft"
                      className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-stone-600 mb-1 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-stone-400" /> Expected Guest Count
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value) || 1)}
                      className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-stone-600 mb-1 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-stone-400" /> Target Total Budget ($)
                    </label>
                    <input
                      type="number"
                      min="100"
                      required
                      value={targetBudget}
                      onChange={(e) => setTargetBudget(Number(e.target.value) || 1000)}
                      className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-rose-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Vibe & Style */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                3. Vibe, Theme & Aesthetic Concept
              </label>

              {/* Vibe Presets */}
              <div className="space-y-1.5 mb-2">
                <span className="text-[11px] text-stone-500">Quick inspiration presets:</span>
                <div className="flex flex-col gap-1.5">
                  {(vibePresets[eventType] || []).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setVibe(preset)}
                      className={`text-xs text-left p-2 rounded-lg border transition ${
                        vibe === preset
                          ? 'border-rose-400 bg-rose-50 font-semibold text-rose-900'
                          : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      "{preset}"
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  required
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  placeholder="Describe colors, feelings, aesthetic style..."
                  className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-rose-500"
                />
              </div>

              <div className="mt-3">
                <label className="block text-xs text-stone-600 mb-1">
                  Special Requirements, Must-Haves, or Dietary Constraints (Optional)
                </label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g. Lawn games for kids, vegan dessert options, strict 10 PM sound curfew..."
                  className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-rose-500"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {errorMsg}
              </p>
            )}

            {/* Submit Bar */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 hover:opacity-95 rounded-lg shadow-md transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Master Plan with AI</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
