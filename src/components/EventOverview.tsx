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
  Video,
  FileText,
  Edit2,
  X,
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
  onOpenDemoModal?: () => void;
  onUpdateEventDetails?: (updates: Partial<Pick<EventPlan, 'title' | 'date' | 'location' | 'guestCount' | 'customNotes'>>) => void;
}

export const EventOverview: React.FC<EventOverviewProps> = ({
  event,
  onNavigateTab,
  onOpenCreateModal,
  onOpenDemoModal,
  onUpdateEventDetails,
}) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [notesDraft, setNotesDraft] = useState<string>(event.customNotes || '');
  const [isEditingMeta, setIsEditingMeta] = useState<boolean>(false);
  const [metaDraft, setMetaDraft] = useState({
    title: event.title,
    date: event.date,
    location: event.location,
    guestCount: event.guestCount,
  });

  const budget = calculateBudgetTotals(event.budgetItems, event.targetBudget);
  const timeline = calculateTimelineProgress(event.timelineItems, new Date().toISOString());
  const vendors = calculateVendorProgress(event.vendorItems);

  const copyToClipboard = (hex: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hex);
    }
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEventDetails?.({ customNotes: notesDraft.trim() });
    setIsEditingNotes(false);
  };

  const handleSaveMeta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!metaDraft.title.trim()) return;
    onUpdateEventDetails?.({
      title: metaDraft.title.trim(),
      date: metaDraft.date,
      location: metaDraft.location.trim(),
      guestCount: Math.max(1, Number(metaDraft.guestCount) || 1),
    });
    setIsEditingMeta(false);
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
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              {event.eventType} Master Plan
            </span>
            <span className="text-xs text-stone-400">Created with PlanCraft AI</span>
            {onUpdateEventDetails && !isEditingMeta && (
              <button
                type="button"
                onClick={() => {
                  setMetaDraft({
                    title: event.title,
                    date: event.date,
                    location: event.location,
                    guestCount: event.guestCount,
                  });
                  setIsEditingMeta(true);
                }}
                className="inline-flex items-center gap-1 text-xs text-stone-300 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition ml-auto"
                aria-label="Edit event logistics"
              >
                <Edit2 className="w-3 h-3" aria-hidden="true" />
                <span>Edit Details</span>
              </button>
            )}
          </div>

          {isEditingMeta ? (
            <form onSubmit={handleSaveMeta} className="bg-black/40 p-4 rounded-xl border border-white/15 space-y-3 mb-4">
              <div>
                <label htmlFor="overview-edit-title" className="block text-xs font-semibold text-stone-300 mb-1">
                  Event Title
                </label>
                <input
                  id="overview-edit-title"
                  type="text"
                  required
                  value={metaDraft.title}
                  onChange={(e) => setMetaDraft({ ...metaDraft, title: e.target.value })}
                  className="w-full text-sm bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="overview-edit-date" className="block text-xs font-semibold text-stone-300 mb-1">
                    Event Date
                  </label>
                  <input
                    id="overview-edit-date"
                    type="date"
                    required
                    value={metaDraft.date}
                    onChange={(e) => setMetaDraft({ ...metaDraft, date: e.target.value })}
                    className="w-full text-sm bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="overview-edit-location" className="block text-xs font-semibold text-stone-300 mb-1">
                    Location
                  </label>
                  <input
                    id="overview-edit-location"
                    type="text"
                    required
                    value={metaDraft.location}
                    onChange={(e) => setMetaDraft({ ...metaDraft, location: e.target.value })}
                    className="w-full text-sm bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="overview-edit-guests" className="block text-xs font-semibold text-stone-300 mb-1">
                    Guest Count
                  </label>
                  <input
                    id="overview-edit-guests"
                    type="number"
                    min="1"
                    required
                    value={metaDraft.guestCount}
                    onChange={(e) => setMetaDraft({ ...metaDraft, guestCount: Number(e.target.value) || 1 })}
                    className="w-full text-sm bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingMeta(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-300 hover:text-white bg-white/10 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
                >
                  Save Details
                </button>
              </div>
            </form>
          ) : (
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-serif text-white mb-4 leading-tight">
              {event.title}
            </h1>
          )}

          <p className="text-base sm:text-lg text-stone-300 font-light leading-relaxed mb-6">
            {event.summaryStory}
          </p>

          {/* Quick Details Chips */}
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-stone-200">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
              <Calendar className="w-4 h-4 text-rose-400" aria-hidden="true" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
              <MapPin className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
              <Users className="w-4 h-4 text-indigo-400" aria-hidden="true" />
              <span>{event.guestCount} Guests</span>
            </div>
            {onOpenDemoModal && (
              <button
                type="button"
                onClick={onOpenDemoModal}
                className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500/90 to-amber-500/90 hover:from-rose-500 hover:to-amber-500 text-white font-semibold px-3.5 py-1.5 rounded-lg backdrop-blur-xs transition shadow-sm cursor-pointer ml-auto"
              >
                <Video className="w-4 h-4" aria-hidden="true" />
                <span>Watch Product Demo</span>
              </button>
            )}
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
              <Sparkles className="w-5 h-5 text-amber-600" aria-hidden="true" />
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
            <button
              type="button"
              onClick={() => onNavigateTab('budget')}
              className="group cursor-pointer bg-white p-5 rounded-xl border border-stone-200 hover:border-emerald-300 hover:shadow-md transition text-left w-full"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <DollarSign className="w-5 h-5" aria-hidden="true" />
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-stone-900 text-base">Budget & Expenses</h3>
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
              <div
                role="progressbar"
                aria-label="Budget spent percentage"
                aria-valuenow={Math.min(100, budget.percentSpent)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="w-full bg-stone-100 rounded-full h-2 mt-2 overflow-hidden"
              >
                <div
                  className={`h-2 rounded-full ${
                    budget.isOverBudget ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, budget.percentSpent)}%` }}
                />
              </div>
            </button>

            {/* Timeline Hub Card */}
            <button
              type="button"
              onClick={() => onNavigateTab('timeline')}
              className="group cursor-pointer bg-white p-5 rounded-xl border border-stone-200 hover:border-indigo-300 hover:shadow-md transition text-left w-full"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
                  <Clock className="w-5 h-5" aria-hidden="true" />
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-stone-900 text-base">Timeline & Run-of-Show</h3>
              <p className="text-xs text-stone-500 mt-1 mb-3">
                Month-by-month planning phases & minute-by-minute day schedule.
              </p>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-stone-700">
                  {timeline.completed} of {timeline.total} milestones done
                </span>
                <span className="text-indigo-700">{timeline.percent}% ready</span>
              </div>
              <div
                role="progressbar"
                aria-label="Timeline completion percentage"
                aria-valuenow={timeline.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="w-full bg-stone-100 rounded-full h-2 mt-2 overflow-hidden"
              >
                <div
                  className="h-2 rounded-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${timeline.percent}%` }}
                />
              </div>
            </button>
          </div>

          {/* Planner Notes & Special Instructions Card */}
          <div className="bg-white rounded-xl p-6 border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-base">
                <FileText className="w-4 h-4 text-rose-600" aria-hidden="true" />
                <h3>Planner Notes & Day-of Directives</h3>
              </div>
              {!isEditingNotes && (
                <button
                  type="button"
                  onClick={() => {
                    setNotesDraft(event.customNotes || '');
                    setIsEditingNotes(true);
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{event.customNotes ? 'Edit Notes' : 'Add Notes'}</span>
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <form onSubmit={handleSaveNotes} className="space-y-3">
                <label htmlFor="planner-custom-notes" className="sr-only">
                  Planner Notes and Day-of Directives
                </label>
                <textarea
                  id="planner-custom-notes"
                  rows={3}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Record VIP seating notes, dietary counts, rain-plan triggers, or load-in gate codes..."
                  className="w-full text-xs sm:text-sm border border-stone-300 rounded-lg p-3 text-stone-800 focus:outline-rose-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingNotes(false)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    Save Notes
                  </button>
                </div>
              </form>
            ) : event.customNotes ? (
              <p className="text-xs sm:text-sm text-stone-700 whitespace-pre-line bg-stone-50 p-3.5 rounded-lg border border-stone-200/70">
                {event.customNotes}
              </p>
            ) : (
              <p className="text-xs text-stone-500 italic">
                No custom coordinator notes added yet. Click &ldquo;Add Notes&rdquo; to record dietary restrictions, VIP arrival notes, or venue access instructions.
              </p>
            )}
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
                  type="button"
                  onClick={() => copyToClipboard(color.hex)}
                  aria-label={`Copy ${color.name} hex code ${color.hex}`}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-stone-200/70 hover:border-stone-300 bg-stone-50/50 hover:bg-stone-50 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-lg shadow-2xs border border-black/10 flex-shrink-0"
                      style={{ backgroundColor: color.hex }}
                      aria-hidden="true"
                    />
                    <div>
                      <div className="text-xs font-semibold text-stone-900">{color.name}</div>
                      <div className="text-[11px] font-mono text-stone-500">{color.hex}</div>
                    </div>
                  </div>
                  <div className="text-stone-400 hover:text-stone-700">
                    {copiedHex === color.hex ? (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" aria-hidden="true" /> Copied
                      </span>
                    ) : (
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Vendors & Ideas Quick Links */}
          <div className="bg-white rounded-xl p-6 border border-stone-200/80 shadow-2xs space-y-4">
            <button
              type="button"
              onClick={() => onNavigateTab('vendors')}
              className="w-full cursor-pointer group flex items-center justify-between p-3.5 rounded-lg bg-stone-50 hover:bg-stone-100 transition border border-stone-200/60 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-purple-100 text-purple-700">
                  <Briefcase className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-bold text-stone-900">Vendors & Checklist</div>
                  <div className="text-xs text-stone-500">
                    {vendors.booked} booked · {vendors.contacted} contacted · {vendors.researching} in research
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-purple-600 group-hover:translate-x-1 transition" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('ideas')}
              className="w-full cursor-pointer group flex items-center justify-between p-3.5 rounded-lg bg-rose-50/60 hover:bg-rose-50 transition border border-rose-100 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-rose-100 text-rose-700">
                  <Lightbulb className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-bold text-rose-950">AI Creative Lab</div>
                  <div className="text-xs text-rose-700">
                    {event.personalizedIdeas.length} personalized ideas ready to explore
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-rose-400 group-hover:text-rose-700 group-hover:translate-x-1 transition" aria-hidden="true" />
            </button>

            {/* AI Regeneration prompt */}
            <div className="pt-2 border-t border-stone-100 text-center">
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                Create Another Event or Try New Theme
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
