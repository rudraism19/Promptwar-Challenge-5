import React, { useState } from 'react';
import {
  Sparkles,
  Lightbulb,
  Utensils,
  Palette,
  PartyPopper,
  PiggyBank,
  ShieldAlert,
  Send,
  Plus,
  Check,
  Loader2,
  Trash2,
} from 'lucide-react';
import type { EventPlan, IdeaCategory, PersonalizedIdea } from '../types.ts';
import { brainstormIdeas } from '../services/api.ts';

interface AIIdeaLabProps {
  event: EventPlan;
  onUpdateIdeas: (ideas: PersonalizedIdea[]) => void;
  onAddIdeaToBudget?: (idea: PersonalizedIdea) => void;
}

export const AIIdeaLab: React.FC<AIIdeaLabProps> = ({ event, onUpdateIdeas }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Preset chips depending on event type
  const getPromptChips = () => {
    switch (event.eventType) {
      case 'wedding':
        return [
          'Signature cocktail recipes matching our botanical palette',
          'Creative low-cost decor repurposing from ceremony to reception',
          'Unforgettable interactive guestbook & memory alternatives',
          'Late-night comfort snack station ideas (tacos, sliders, pretzels)',
          'Rain & wind weather contingency plan for outdoor venue',
        ];
      case 'birthday':
        return [
          'Interactive party tournament & retro gaming contest ideas',
          'Neon glow & blacklight cocktail concepts',
          'Budget-friendly DIY photo booth backdrop and props',
          'Crowd icebreaker games that don’t feel cheesy',
          'Unique late-night sweet treats & celebration toast ritual',
        ];
      case 'community':
        return [
          'Collaborative community mural or wishing lantern activation',
          'Low-cost family craft stations with zero waste materials',
          'Weather backup strategies for outdoor amphitheater & park',
          'Volunteer recognition rituals and meal voucher perks',
          'Local maker & artisan vendor engagement ideas',
        ];
      default:
        return [
          'Creative interactive experiences for attendees',
          'Budget-friendly decor ideas with high visual impact',
          'Curated menu and beverage station concepts',
          'Contingency plan for sudden schedule delays',
        ];
    }
  };

  const handleGenerate = async (promptToUse?: string) => {
    const prompt = promptToUse || customPrompt;
    if (!prompt.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const newIdeas = await brainstormIdeas({
        eventTitle: event.title,
        eventType: event.eventType,
        vibe: event.vibeAndTheme,
        guestCount: event.guestCount,
        budget: event.targetBudget,
        prompt,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      });

      if (newIdeas.length > 0) {
        // Prepend new ideas with unique ids
        const formatted = newIdeas.map((idea, i) => ({
          ...idea,
          id: `ai-idea-${Date.now()}-${i}`,
          addedToPlan: false,
        }));
        onUpdateIdeas([...formatted, ...event.personalizedIdeas]);
        setCustomPrompt('');
      } else {
        setErrorMsg('No ideas generated, please try a different prompt.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to brainstorm ideas.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAddPlan = (ideaId: string) => {
    const updated = event.personalizedIdeas.map((idea) =>
      idea.id === ideaId ? { ...idea, addedToPlan: !idea.addedToPlan } : idea
    );
    onUpdateIdeas(updated);
  };

  const handleDeleteIdea = (ideaId: string) => {
    const updated = event.personalizedIdeas.filter((idea) => idea.id !== ideaId);
    onUpdateIdeas(updated);
  };

  const getCategoryDetails = (cat: IdeaCategory | string) => {
    switch (cat) {
      case 'food_drink':
        return {
          icon: <Utensils className="w-3.5 h-3.5" />,
          label: 'Food & Beverage',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'theme_decor':
        return {
          icon: <Palette className="w-3.5 h-3.5" />,
          label: 'Theme & Decor',
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
        };
      case 'entertainment_activity':
        return {
          icon: <PartyPopper className="w-3.5 h-3.5" />,
          label: 'Entertainment & Fun',
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
        };
      case 'budget_saver':
        return {
          icon: <PiggyBank className="w-3.5 h-3.5" />,
          label: 'Cost Saver',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'contingency_backup':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5" />,
          label: 'Contingency & Plan B',
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
        };
      default:
        return {
          icon: <Lightbulb className="w-3.5 h-3.5" />,
          label: 'Creative Idea',
          bg: 'bg-stone-50 text-stone-800 border-stone-200',
        };
    }
  };

  const filteredIdeas = event.personalizedIdeas.filter((idea) => {
    if (selectedCategory !== 'ALL' && idea.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & AI Brainstorm Box */}
      <div className="bg-gradient-to-br from-stone-900 via-rose-950 to-stone-900 text-white p-6 sm:p-8 rounded-2xl shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/30 text-rose-300 border border-rose-500/40">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
              GenAI Ideation Engine
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-white">
            Personalized Inspiration & Problem Solver
          </h2>

          <p className="text-sm sm:text-base text-stone-300 font-light leading-relaxed">
            Brainstorm bespoke signature details tailored specifically to{' '}
            <strong className="text-white font-medium">"{event.title}"</strong> ({event.guestCount}{' '}
            guests, ${event.targetBudget.toLocaleString()} budget).
          </p>

          {/* Quick Prompt Chips */}
          <div className="pt-2">
            <div className="text-xs font-semibold text-stone-400 mb-2">Try a prompt idea:</div>
            <div className="flex flex-wrap gap-2">
              {getPromptChips().map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleGenerate(chip)}
                  disabled={loading}
                  className="text-xs font-medium bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/15 px-3 py-1.5 rounded-lg text-stone-200 transition text-left disabled:opacity-50"
                >
                  "{chip}"
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
            className="flex flex-col sm:flex-row gap-2 pt-2"
          >
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="E.g., Give me 3 budget-friendly favors that guests will actually keep..."
              className="flex-1 bg-white/15 border border-white/25 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 backdrop-blur-xs"
            />
            <button
              type="submit"
              disabled={loading || !customPrompt.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 font-bold text-sm text-white rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Brainstorm</span>
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <p className="text-xs text-rose-300 bg-rose-900/40 p-2 rounded border border-rose-700/50">
              {errorMsg}
            </p>
          )}
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mr-1">
            Filter Ideas:
          </span>
          {[
            { id: 'ALL', label: 'All Ideas' },
            { id: 'food_drink', label: 'Food & Drink' },
            { id: 'theme_decor', label: 'Theme & Decor' },
            { id: 'entertainment_activity', label: 'Entertainment' },
            { id: 'budget_saver', label: 'Cost Savers' },
            { id: 'contingency_backup', label: 'Contingency' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                selectedCategory === cat.id
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-stone-500 font-medium">
          Showing {filteredIdeas.length} of {event.personalizedIdeas.length} curated ideas
        </div>
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredIdeas.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl p-8 text-center text-stone-500 border border-stone-200">
            <Lightbulb className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="font-medium text-stone-700">No ideas in this category yet.</p>
            <p className="text-xs text-stone-400 mt-1">
              Select one of the AI prompt chips above to generate ideas!
            </p>
          </div>
        ) : (
          filteredIdeas.map((idea) => {
            const cat = getCategoryDetails(idea.category);
            return (
              <div
                key={idea.id}
                className={`bg-white rounded-xl p-5 border transition flex flex-col justify-between space-y-4 shadow-2xs ${
                  idea.addedToPlan
                    ? 'border-emerald-300 ring-1 ring-emerald-300 bg-emerald-50/10'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${cat.bg}`}
                    >
                      {cat.icon}
                      {cat.label}
                    </span>

                    <button
                      onClick={() => handleDeleteIdea(idea.id)}
                      className="text-stone-300 hover:text-red-500 p-1"
                      aria-label="Delete this idea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-stone-900 font-serif mb-1">
                    {idea.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                    {idea.description}
                  </p>

                  {/* Why it fits theme */}
                  {idea.whyItFitsTheme && (
                    <div className="mt-3 p-3 bg-stone-50 rounded-lg border border-stone-200/60 text-xs text-stone-700">
                      <strong className="text-stone-900 font-semibold block mb-0.5">
                        Why this shines for your event:
                      </strong>
                      <p className="leading-snug">{idea.whyItFitsTheme}</p>
                    </div>
                  )}

                  {/* Estimated Cost impact */}
                  {idea.estimatedCostImpact && (
                    <div className="mt-2 text-xs font-semibold text-stone-600 flex items-center gap-1.5">
                      <span className="text-stone-400">Estimated Cost Impact:</span>
                      <span className="text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                        {idea.estimatedCostImpact}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Action: Toggle Added to Plan */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleAddPlan(idea.id)}
                    className={`w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg transition ${
                      idea.addedToPlan
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-stone-900 text-white hover:bg-stone-800 shadow-2xs'
                    }`}
                  >
                    {idea.addedToPlan ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-700" />
                        <span>Included in Event Master Plan</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add to My Event Plan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
