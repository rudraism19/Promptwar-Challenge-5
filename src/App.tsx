import { useState, useEffect } from 'react';
import {
  Sparkles,
  LayoutDashboard,
  DollarSign,
  Clock,
  Briefcase,
  Lightbulb,
} from 'lucide-react';
import type { BudgetItem, EventPlan, PersonalizedIdea, TimelineItem, VendorItem } from './types.ts';
import { SEED_EVENTS } from './data/seedEvents.ts';
import { sanitizeEventPlan } from './utils/eventCalculations.ts';
import {
  convertIdeaToBudgetItem,
  convertIdeaToTimelineItem,
} from './utils/exportFormatters.ts';
import { Header } from './components/Header.tsx';
import { EventOverview } from './components/EventOverview.tsx';
import { BudgetTracker } from './components/BudgetTracker.tsx';
import { TimelineView } from './components/TimelineView.tsx';
import { VendorChecklist } from './components/VendorChecklist.tsx';
import { AIIdeaLab } from './components/AIIdeaLab.tsx';
import { CreateEventModal } from './components/CreateEventModal.tsx';
import { ExportModal } from './components/ExportModal.tsx';
import { DemoVideoModal } from './components/DemoVideoModal.tsx';

const STORAGE_KEY_EVENTS = 'plancraft_events_v1';
const STORAGE_KEY_ACTIVE_ID = 'plancraft_active_id_v1';

export default function App() {
  const [events, setEvents] = useState<EventPlan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((ev) => sanitizeEventPlan(ev));
        }
      }
    } catch (e) {
      console.error('Failed to parse saved events:', e);
    }
    return SEED_EVENTS;
  });

  const [activeEventId, setActiveEventId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (savedId) return savedId;
    } catch {
      // Ignore storage access errors in restricted environments
    }
    return SEED_EVENTS[0].id;
  });

  const [currentTab, setCurrentTab] = useState<'overview' | 'budget' | 'timeline' | 'vendors' | 'ideas'>('overview');
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [demoModalOpen, setDemoModalOpen] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
    } catch (e) {
      console.error('Error saving events to localStorage:', e);
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeEventId);
    } catch {
      // Ignore storage access errors
    }
  }, [activeEventId]);

  // Find active event
  const currentEvent = events.find((e) => e.id === activeEventId) || events[0] || SEED_EVENTS[0];

  // Helper to update active event in array
  const updateCurrentEvent = (updater: (prev: EventPlan) => EventPlan) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === currentEvent.id) {
          const updated = updater(e);
          return { ...updated, updatedAt: new Date().toISOString() };
        }
        return e;
      })
    );
  };

  const handleUpdateEventDetails = (
    updates: Partial<Pick<EventPlan, 'title' | 'date' | 'location' | 'guestCount' | 'customNotes'>>
  ) => {
    updateCurrentEvent((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleUpdateBudgetItems = (items: BudgetItem[], newTargetBudget?: number) => {
    updateCurrentEvent((prev) => ({
      ...prev,
      budgetItems: items,
      targetBudget: newTargetBudget !== undefined ? newTargetBudget : prev.targetBudget,
    }));
  };

  const handleUpdateTimelineItems = (items: TimelineItem[]) => {
    updateCurrentEvent((prev) => ({
      ...prev,
      timelineItems: items,
    }));
  };

  const handleUpdateVendorItems = (items: VendorItem[]) => {
    updateCurrentEvent((prev) => ({
      ...prev,
      vendorItems: items,
    }));
  };

  const handleUpdateIdeas = (ideas: PersonalizedIdea[]) => {
    updateCurrentEvent((prev) => ({
      ...prev,
      personalizedIdeas: ideas,
    }));
  };

  const handleAddIdeaToBudget = (idea: PersonalizedIdea) => {
    const newBudgetItem = convertIdeaToBudgetItem(idea);
    updateCurrentEvent((prev) => ({
      ...prev,
      budgetItems: [newBudgetItem, ...prev.budgetItems],
      personalizedIdeas: prev.personalizedIdeas.map((it) =>
        it.id === idea.id ? { ...it, addedToPlan: true } : it
      ),
    }));
  };

  const handleAddIdeaToTimeline = (idea: PersonalizedIdea) => {
    const newTimelineItem = convertIdeaToTimelineItem(idea);
    updateCurrentEvent((prev) => ({
      ...prev,
      timelineItems: [newTimelineItem, ...prev.timelineItems],
      personalizedIdeas: prev.personalizedIdeas.map((it) =>
        it.id === idea.id ? { ...it, addedToPlan: true } : it
      ),
    }));
  };

  const handleEventCreated = (newPlan: EventPlan) => {
    setEvents((prev) => [newPlan, ...prev]);
    setActiveEventId(newPlan.id);
    setCurrentTab('overview');
  };

  const navTabs = [
    { id: 'overview', label: 'Event Overview', icon: <LayoutDashboard className="w-4 h-4" aria-hidden="true" /> },
    { id: 'budget', label: 'Budget & Expenses', icon: <DollarSign className="w-4 h-4" aria-hidden="true" /> },
    { id: 'timeline', label: 'Timeline & Run-of-Show', icon: <Clock className="w-4 h-4" aria-hidden="true" /> },
    { id: 'vendors', label: 'Vendors & Checklist', icon: <Briefcase className="w-4 h-4" aria-hidden="true" /> },
    { id: 'ideas', label: 'AI Idea Lab', icon: <Lightbulb className="w-4 h-4" aria-hidden="true" /> },
  ] as const;

  return (
    <div className="min-h-screen bg-stone-100/70 font-sans text-stone-900 flex flex-col">
      {/* Skip to Main Content Link for Keyboard Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-rose-600 focus:text-white focus:font-bold focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Top Header */}
      <Header
        events={events}
        currentEvent={currentEvent}
        onSelectEvent={(id) => setActiveEventId(id)}
        onOpenCreateModal={() => setCreateModalOpen(true)}
        onOpenExportModal={() => setExportModalOpen(true)}
        onOpenDemoModal={() => setDemoModalOpen(true)}
      />

      {/* Main Tab Navigation Bar */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 no-scrollbar" aria-label="Main Navigation">
            {navTabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-rose-50 text-rose-700 shadow-2xs font-bold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <span className={isActive ? 'text-rose-600' : 'text-stone-400'}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Body Content */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'overview' && (
          <EventOverview
            event={currentEvent}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onOpenCreateModal={() => setCreateModalOpen(true)}
            onOpenDemoModal={() => setDemoModalOpen(true)}
            onUpdateEventDetails={handleUpdateEventDetails}
          />
        )}

        {currentTab === 'budget' && (
          <BudgetTracker
            event={currentEvent}
            onUpdateBudgetItems={handleUpdateBudgetItems}
            onNavigateToIdeas={() => setCurrentTab('ideas')}
          />
        )}

        {currentTab === 'timeline' && (
          <TimelineView
            event={currentEvent}
            onUpdateTimelineItems={handleUpdateTimelineItems}
          />
        )}

        {currentTab === 'vendors' && (
          <VendorChecklist
            event={currentEvent}
            onUpdateVendorItems={handleUpdateVendorItems}
          />
        )}

        {currentTab === 'ideas' && (
          <AIIdeaLab
            event={currentEvent}
            onUpdateIdeas={handleUpdateIdeas}
            onAddIdeaToBudget={handleAddIdeaToBudget}
            onAddIdeaToTimeline={handleAddIdeaToTimeline}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 font-medium text-stone-700">
            <Sparkles className="w-4 h-4 text-rose-500" aria-hidden="true" />
            <span>PlanCraft AI — Intelligent Wedding, Birthday & Community Event Producer</span>
          </div>
          <div>
            Built with Google GenAI & Tailwind CSS · All rights reserved.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateEventModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onEventCreated={handleEventCreated}
      />

      {exportModalOpen && (
        <ExportModal
          event={currentEvent}
          onClose={() => setExportModalOpen(false)}
        />
      )}

      {demoModalOpen && (
        <DemoVideoModal
          isOpen={demoModalOpen}
          onClose={() => setDemoModalOpen(false)}
          onNavigateToTab={(tab) => setCurrentTab(tab)}
        />
      )}
    </div>
  );
}
