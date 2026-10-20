import React, { useState } from 'react';
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Check,
  Copy,
  ArrowRight,
  DollarSign,
  Clock,
  Briefcase,
  Lightbulb,
} from 'lucide-react';
import type { EventPlan } from '../types.ts';
import {
  calculateBudgetTotals,
  calculateTimelineProgress,
  calculateVendorProgress,
} from '../utils/eventCalculations.ts';

interface EventOverviewProps {
  event: EventPlan;
  onNavigateTab: (tabId: 'overview' | 'budget' | 'timeline' | 'vendors' | 'ideas') => void;
  onOpenCreateModal: () => void;
}

export const EventOverview: React.FC<EventOverviewProps> = ({
  event,
  onNavigateTab,
  onOpenCreateModal,
}) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const budget = calculateBudgetTotals(event.budgetItems, event.targetBudget);
  const timeline = calculateTimelineProgress(event.timelineItems, new Date().toISOString());
  const vendors = calculateVendorProgress(event.vendorItems);

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Banner / Aesthetic Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-white p-6 sm:p-8 lg:p-10 shadow-md">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-gradient-to-br from-rose-500/20 to-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <Sparkles className="w-3 h-3" />
              {event.eventType} Master Plan
            </span>
            <span className="text-xs text-stone-400">Created with PlanCraft AI</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-serif text-white mb-4 leading-tight">
            {event.title}
          </h1>

          <p className="text-base sm:text-lg text-stone-300 font-light leading-relaxed mb-6">
            {event.summaryStory}
          </p>

          {/* Quick Details Chips */}
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-stone-200">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
              <Calendar className="w-4 h-4 text-rose-400" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>{event.guestCount} Guests</span>
            </div>
          </div>
        </div>
      </div>

      {/* Aesthetic Mood & Color Palette */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Vibe & Key Highlights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Aesthetic Concept Card */}
          <div className="bg-white rounded-xl p-6 border border-stone-200/80 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 text-stone-900 font-bold text-lg">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h2>Aesthetic Vibe & Design Concept</h2>
            </div>
            <p className="text-stone-700 text-base leading-relaxed bg-amber-50/50 p-4 rounded-lg border border-amber-100">
              {event.vibeAndTheme}
            </p>

            {/* Signature Highlights */}
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">
                Signature Event Highlights & Moments
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.keyHighlights.map((highlight, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3.5 rounded-lg bg-stone-50 hover:bg-stone-100/70 border border-stone-200/60 transition"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-stone-800 font-medium leading-snug">
                      {highlight}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Hub Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Budget Hub Card */}
            <div
              onClick={() => onNavigateTab('budget')}
              className="group cursor-pointer bg-white p-5 rounded-xl border border-stone-200 hover:border-emerald-300 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <DollarSign className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
              </div>
              <h4 className="font-bold text-stone-900 text-base">Budget & Expenses</h4>
              <p className="text-xs text-stone-500 mt-1 mb-3">
                Track category allocations, deposits, and payment statuses.
              </p>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-stone-700">
                  ${budget.totalSpent.toLocaleString()} spent
                </span>
                <span className="text-emerald-700">
                  ${budget.remainingTarget.toLocaleString()} left
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-stone-100 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${
                    budget.isOverBudget ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, budget.percentSpent)}%` }}
                />
              </div>
            </div>

            {/* Timeline Hub Card */}
            <div
              onClick={() => onNavigateTab('timeline')}
              className="group cursor-pointer bg-white p-5 rounded-xl border border-stone-200 hover:border-indigo-300 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
                  <Clock className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
              </div>
              <h4 className="font-bold text-stone-900 text-base">Timeline & Run-of-Show</h4>
              <p className="text-xs text-stone-500 mt-1 mb-3">
                Month-by-month planning phases & minute-by-minute day schedule.
              </p>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-stone-700">
                  {timeline.completed} of {timeline.total} milestones done
                </span>
                <span className="text-indigo-700">{timeline.percent}% ready</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${timeline.percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Color Palette, Vendors & AI Ideas Preview */}
        <div className="space-y-6">
          {/* Color Palette Card */}
          <div className="bg-white rounded-xl p-6 border border-stone-200/80 shadow-2xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-1">
              Curated Color Palette
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Click any color swatch to copy hex code for decor & stationery.
            </p>

            <div className="space-y-3">
              {event.colorPalette.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => copyToClipboard(color.hex)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-stone-200/70 hover:border-stone-300 bg-stone-50/50 hover:bg-stone-50 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-lg shadow-2xs border border-black/10 flex-shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div>
                      <div className="text-xs font-semibold text-stone-900">{color.name}</div>
                      <div className="text-[11px] font-mono text-stone-500">{color.hex}</div>
                    </div>
                  </div>
                  <div className="text-stone-400 hover:text-stone-700">
                    {copiedHex === color.hex ? (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Copied
                      </span>
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Vendors & Ideas Quick Links */}
          <div className="bg-white rounded-xl p-6 border border-stone-200/80 shadow-2xs space-y-4">
            <div
              onClick={() => onNavigateTab('vendors')}
              className="cursor-pointer group flex items-center justify-between p-3.5 rounded-lg bg-stone-50 hover:bg-stone-100 transition border border-stone-200/60"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-purple-100 text-purple-700">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-stone-900">Vendors & Checklist</div>
                  <div className="text-xs text-stone-500">
                    {vendors.booked} booked · {vendors.contacted} contacted · {vendors.researching} in research
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-purple-600 group-hover:translate-x-1 transition" />
            </div>

            <div
              onClick={() => onNavigateTab('ideas')}
              className="cursor-pointer group flex items-center justify-between p-3.5 rounded-lg bg-rose-50/60 hover:bg-rose-50 transition border border-rose-100"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-rose-100 text-rose-700">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-rose-950">AI Creative Lab</div>
                  <div className="text-xs text-rose-700">
                    {event.personalizedIdeas.length} personalized ideas ready to explore
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-rose-400 group-hover:text-rose-700 group-hover:translate-x-1 transition" />
            </div>

            {/* AI Regeneration prompt */}
            <div className="pt-2 border-t border-stone-100 text-center">
              <button
                onClick={onOpenCreateModal}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Create Another Event or Try New Theme
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
