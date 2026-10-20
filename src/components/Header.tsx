import React from 'react';
import {
  Sparkles,
  Calendar,
  Users,
  DollarSign,
  PlusCircle,
  FileDown,
  CheckCircle2,
  ChevronDown,
  Heart,
  Cake,
  Globe,
  PartyPopper,
  Video,
} from 'lucide-react';
import type { EventPlan, EventType } from '../types.ts';
import { calculateBudgetTotals, calculateTimelineProgress } from '../utils/eventCalculations.ts';

interface HeaderProps {
  events: EventPlan[];
  currentEvent: EventPlan;
  onSelectEvent: (eventId: string) => void;
  onOpenCreateModal: () => void;
  onOpenExportModal: () => void;
  onOpenDemoModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  events,
  currentEvent,
  onSelectEvent,
  onOpenCreateModal,
  onOpenExportModal,
  onOpenDemoModal,
}) => {
  const budgetTotals = calculateBudgetTotals(currentEvent.budgetItems, currentEvent.targetBudget);
  const timelineProgress = calculateTimelineProgress(currentEvent.timelineItems, new Date().toISOString());

  // Days until event calculation
  const getDaysUntil = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    const today = new Date().getTime();
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    if (isNaN(diff)) return null;
    if (diff < 0) return `${Math.abs(diff)} days ago`;
    if (diff === 0) return 'Today!';
    return `${diff} days away`;
  };

  const daysUntil = getDaysUntil(currentEvent.date);

  const getEventBadge = (type: EventType) => {
    switch (type) {
      case 'wedding':
        return {
          icon: <Heart className="w-3.5 h-3.5 text-rose-500" />,
          label: 'Wedding',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'birthday':
        return {
          icon: <Cake className="w-3.5 h-3.5 text-purple-500" />,
          label: 'Birthday',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'community':
        return {
          icon: <Globe className="w-3.5 h-3.5 text-emerald-500" />,
          label: 'Community',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      default:
        return {
          icon: <PartyPopper className="w-3.5 h-3.5 text-blue-500" />,
          label: 'Event',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
        };
    }
  };

  const badge = getEventBadge(currentEvent.eventType);

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-stone-900 font-serif">
                PlanCraft <span className="text-rose-600">AI</span>
              </span>
              <p className="text-xs text-stone-500 hidden sm:block">
                Master Event & Celebration Planner
              </p>
            </div>
          </div>

          {/* Event Switcher & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Event Switcher Dropdown */}
            <div className="relative">
              <label htmlFor="event-selector" className="sr-only">
                Select Active Event
              </label>
              <div className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200/80 rounded-lg px-2.5 py-1.5 transition text-stone-800 text-sm font-medium border border-stone-200/60">
                {badge.icon}
                <select
                  id="event-selector"
                  value={currentEvent.id}
                  onChange={(e) => onSelectEvent(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm font-semibold text-stone-800 focus:outline-none cursor-pointer pr-4 truncate max-w-[140px] sm:max-w-[200px] md:max-w-[240px]"
                >
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} ({evt.eventType})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500 -ml-3 pointer-events-none" />
              </div>
            </div>

            {/* Watch Demo Video button */}
            <button
              onClick={onOpenDemoModal}
              aria-label="Watch Demo Video and Product Walkthrough"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg shadow-2xs transition"
            >
              <Video className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Demo Video</span>
            </button>

            {/* Export Dossier button */}
            <button
              onClick={onOpenExportModal}
              aria-label="Export Event Dossier or Print"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg shadow-2xs transition"
            >
              <FileDown className="w-4 h-4 text-stone-600" />
              <span className="hidden md:inline">Export Dossier</span>
            </button>

            {/* New Event AI Generator Button */}
            <button
              onClick={onOpenCreateModal}
              aria-label="Create New Event with AI"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 rounded-lg shadow-sm hover:shadow transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Plan with AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-header Quick Metrics Bar */}
      <div className="bg-stone-50 border-t border-stone-200/80 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
          {/* Title & Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg}`}
            >
              {badge.icon}
              {badge.label}
            </span>
            <span className="font-bold text-stone-900 text-sm truncate max-w-[220px] sm:max-w-md">
              {currentEvent.title}
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            {/* Date */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>{currentEvent.date}</span>
              {daysUntil && (
                <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                  {daysUntil}
                </span>
              )}
            </div>

            {/* Guests */}
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-stone-500" />
              <span>
                <strong className="text-stone-900">{currentEvent.guestCount}</strong> guests
              </span>
            </div>

            {/* Budget */}
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-stone-500" />
              <span>
                Spent: <strong className="text-stone-900">${budgetTotals.totalSpent.toLocaleString()}</strong> / ${budgetTotals.targetBudget.toLocaleString()}
              </span>
              <span
                className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                  budgetTotals.isOverBudget
                    ? 'bg-red-100 text-red-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {budgetTotals.isOverBudget
                  ? `+$${(budgetTotals.totalSpent - budgetTotals.targetBudget).toLocaleString()} over`
                  : `$${budgetTotals.remainingTarget.toLocaleString()} left`}
              </span>
            </div>

            {/* Timeline Completion */}
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Tasks:{' '}
                <strong className="text-stone-900">
                  {timelineProgress.completed}/{timelineProgress.total}
                </strong>{' '}
                ({timelineProgress.percent}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
