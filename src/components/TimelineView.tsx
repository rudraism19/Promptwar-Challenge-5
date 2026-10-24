import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Calendar,
  User,
  Search,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';
import type { EventPlan, TimelineItem, TimelinePhase } from '../types.ts';
import { calculateTimelineProgress, filterTimelineItems } from '../utils/eventCalculations.ts';

interface TimelineViewProps {
  event: EventPlan;
  onUpdateTimelineItems: (items: TimelineItem[]) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ event, onUpdateTimelineItems }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'phases' | 'day_of'>('phases');
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [hideCompleted, setHideCompleted] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    phase: TimelinePhase;
    dueDate: string;
    timeOfDay: string;
    priority: 'high' | 'medium' | 'low';
    assignedTo: string;
    dayOfOrder?: number;
  }>({
    title: '',
    description: '',
    phase: '1-2 Months',
    dueDate: '',
    timeOfDay: '',
    priority: 'medium',
    assignedTo: '',
    dayOfOrder: 1,
  });

  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  const progress = calculateTimelineProgress(event.timelineItems, new Date().toISOString());

  const handleToggleComplete = (itemId: string) => {
    const updated = event.timelineItems.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdateTimelineItems(updated);
  };

  const handleConfirmDelete = (itemId: string) => {
    const updated = event.timelineItems.filter((item) => item.id !== itemId);
    onUpdateTimelineItems(updated);
    setPendingDeleteId(null);
  };

  const handleOpenAdd = (defaultPhase?: TimelinePhase) => {
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
      phase: defaultPhase || (activeTab === 'day_of' ? 'Day-of Schedule' : '1-2 Months'),
      dueDate: '',
      timeOfDay: activeTab === 'day_of' ? '12:00 PM - 01:00 PM' : '',
      priority: 'high',
      assignedTo: '',
      dayOfOrder: event.timelineItems.filter((i) => i.phase === 'Day-of Schedule').length + 1,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: TimelineItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      phase: item.phase,
      dueDate: item.dueDate || '',
      timeOfDay: item.timeOfDay || '',
      priority: item.priority,
      assignedTo: item.assignedTo || '',
      dayOfOrder: item.dayOfOrder || 1,
    });
    setModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingItem) {
      const updated = event.timelineItems.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              title: formData.title.trim(),
              description: formData.description.trim(),
              phase: formData.phase,
              dueDate: formData.dueDate || undefined,
              timeOfDay: formData.timeOfDay || undefined,
              priority: formData.priority,
              assignedTo: formData.assignedTo.trim() || undefined,
              dayOfOrder: formData.dayOfOrder,
            }
          : item
      );
      onUpdateTimelineItems(updated);
    } else {
      const newItem: TimelineItem = {
        id: `timeline-${Date.now()}`,
        title: formData.title.trim(),
        description: formData.description.trim(),
        phase: formData.phase,
        dueDate: formData.dueDate || undefined,
        timeOfDay: formData.timeOfDay || undefined,
        completed: false,
        priority: formData.priority,
        assignedTo: formData.assignedTo.trim() || undefined,
        dayOfOrder: formData.dayOfOrder,
      };
      onUpdateTimelineItems([...event.timelineItems, newItem]);
    }

    setModalOpen(false);
  };

  // Base list filtered by tab
  let baseItems = event.timelineItems;
  if (activeTab === 'day_of') {
    baseItems = event.timelineItems.filter((i) => i.phase === 'Day-of Schedule');
  } else if (activeTab === 'phases') {
    baseItems = event.timelineItems.filter((i) => i.phase !== 'Day-of Schedule');
  }

  const filteredItems = filterTimelineItems(baseItems, {
    phase: selectedPhase,
    priority: selectedPriority,
    hideCompleted,
    searchQuery,
  });

  // Sort day-of items by dayOfOrder
  if (activeTab === 'day_of') {
    filteredItems.sort((a, b) => (a.dayOfOrder || 0) - (b.dayOfOrder || 0));
  }

  const phasesList: TimelinePhase[] = [
    '12+ Months',
    '6-9 Months',
    '3-5 Months',
    '1-2 Months',
    'Final Weeks',
    'Day-of Schedule',
    'Post Event',
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Progress */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold font-serif text-stone-900">
              Master Timeline & Day-of Run of Show
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Keep planning milestones on track and run your celebration with clockwork precision.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenAdd()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add Task / Schedule Item</span>
            </button>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="space-y-2 pt-3 border-t border-stone-100">
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
            <span className="text-stone-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" aria-hidden="true" />
              Overall Progress: {progress.completed} of {progress.total} tasks completed
            </span>
            <span className="text-indigo-600 font-bold">{progress.percent}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Overall timeline task completion"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden"
          >
            <div
              className="bg-indigo-600 h-2.5 transition-all duration-300 rounded-full"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-2">
        <div className="flex items-center gap-2" role="tablist" aria-label="Timeline views">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'phases'}
            onClick={() => {
              setActiveTab('phases');
              setSelectedPhase('ALL');
            }}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition ${
              activeTab === 'phases'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            Planning Phases ({event.timelineItems.filter((i) => i.phase !== 'Day-of Schedule').length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'day_of'}
            onClick={() => {
              setActiveTab('day_of');
              setSelectedPhase('ALL');
            }}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'day_of'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            Day-of Run of Show ({event.timelineItems.filter((i) => i.phase === 'Day-of Schedule').length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            onClick={() => {
              setActiveTab('all');
              setSelectedPhase('ALL');
            }}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition ${
              activeTab === 'all'
                ? 'bg-stone-800 text-white shadow-2xs'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            All Items ({event.timelineItems.length})
          </button>
        </div>

        {/* Hide Completed Toggle */}
        <label className="flex items-center gap-2 text-xs font-medium text-stone-600 cursor-pointer">
          <input
            type="checkbox"
            checked={hideCompleted}
            onChange={(e) => setHideCompleted(e.target.checked)}
            className="w-3.5 h-3.5 text-indigo-600 rounded border-stone-300"
          />
          <span>Hide completed</span>
        </label>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, descriptions, assignees..."
            aria-label="Search timeline tasks, descriptions, or assignees"
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-stone-300 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-indigo-500"
          />
        </div>

        {/* Phase Filter (if activeTab !== 'day_of') */}
        {activeTab !== 'day_of' && (
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-700">
            <span className="font-semibold text-stone-500">Phase:</span>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              aria-label="Filter timeline by phase"
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Phases</option>
              {phasesList
                .filter((p) => p !== 'Day-of Schedule')
                .map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-700">
          <span className="font-semibold text-stone-500">Priority:</span>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            aria-label="Filter timeline by priority"
            className="bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Timeline Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-stone-500 border border-stone-200">
            <Clock className="w-8 h-8 text-stone-300 mx-auto mb-2" aria-hidden="true" />
            <p className="font-medium text-stone-700">No timeline items found.</p>
            <p className="text-xs text-stone-400 mt-1">Try resetting filters or click &ldquo;Add Task&rdquo;.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isDayOf = item.phase === 'Day-of Schedule';
            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl p-4 border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                  item.completed
                    ? 'border-emerald-200 bg-emerald-50/20 opacity-80'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {/* Checkbox & Details */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(item.id)}
                    className="mt-0.5 text-stone-400 hover:text-emerald-600 transition flex-shrink-0"
                    aria-label={`Mark "${item.title}" as ${item.completed ? 'incomplete' : 'completed'}`}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isDayOf && item.dayOfOrder && (
                        <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                          {item.dayOfOrder}
                        </span>
                      )}
                      <h3
                        className={`text-sm sm:text-base font-bold text-stone-900 truncate ${
                          item.completed ? 'line-through text-stone-400' : ''
                        }`}
                      >
                        {item.title}
                      </h3>

                      {/* Phase Badge */}
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200/60">
                        {item.phase}
                      </span>

                      {/* Priority Badge */}
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          item.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : item.priority === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-stone-600 leading-relaxed pr-2">
                        {item.description}
                      </p>
                    )}

                    {/* Meta info tags */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-stone-500">
                      {item.timeOfDay && (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          {item.timeOfDay}
                        </span>
                      )}
                      {item.dueDate && (
                        <span className="inline-flex items-center gap-1 font-medium text-stone-600">
                          <Calendar className="w-3 h-3 text-stone-400" aria-hidden="true" />
                          Due: {item.dueDate}
                        </span>
                      )}
                      {item.assignedTo && (
                        <span className="inline-flex items-center gap-1 font-medium text-stone-600">
                          <User className="w-3 h-3 text-stone-400" aria-hidden="true" />
                          Assigned: {item.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5 pt-2 sm:pt-0 sm:border-l sm:border-stone-100 sm:pl-3">
                  {pendingDeleteId === item.id ? (
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleConfirmDelete(item.id)}
                        className="px-2 py-1 text-[11px] font-bold bg-red-600 text-white rounded hover:bg-red-700"
                        aria-label={`Confirm delete task ${item.title}`}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(null)}
                        className="px-2 py-1 text-[11px] font-medium bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
                        aria-label="Cancel delete task"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded"
                        aria-label={`Edit task ${item.title}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(item.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"
                        aria-label={`Delete task ${item.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Task Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="timeline-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 id="timeline-modal-title" className="font-bold text-lg text-stone-900">
                {editingItem ? 'Edit Task or Schedule Milestone' : 'Add New Task or Schedule Item'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-4 space-y-4">
              <div>
                <label htmlFor="timeline-title-input" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Task / Milestone Title
                </label>
                <input
                  id="timeline-title-input"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Confirm final guest headcount with caterer"
                  className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="timeline-desc-input" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Description / Action Details
                </label>
                <textarea
                  id="timeline-desc-input"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Include vendor contacts, details, notes..."
                  className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="timeline-phase-select" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Phase
                  </label>
                  <select
                    id="timeline-phase-select"
                    value={formData.phase}
                    onChange={(e) => setFormData({ ...formData, phase: e.target.value as TimelinePhase })}
                    className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-indigo-500"
                  >
                    {phasesList.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="timeline-priority-select" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Priority
                  </label>
                  <select
                    id="timeline-priority-select"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as 'high' | 'medium' | 'low' })
                    }
                    className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-indigo-500"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              {formData.phase === 'Day-of Schedule' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="timeline-time-input" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                      Time of Day / Window
                    </label>
                    <input
                      id="timeline-time-input"
                      type="text"
                      value={formData.timeOfDay}
                      onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                      placeholder="e.g. 05:00 PM - 05:45 PM"
                      className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="timeline-order-input" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                      Sequence Order #
                    </label>
                    <input
                      id="timeline-order-input"
                      type="number"
                      min="1"
                      value={formData.dayOfOrder || 1}
                      onChange={(e) =>
                        setFormData({ ...formData, dayOfOrder: Number(e.target.value) || 1 })
                      }
                      className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="timeline-duedate-input" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                      Due Date
                    </label>
                    <input
                      id="timeline-duedate-input"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="timeline-assignee-input" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                      Assigned To
                    </label>
                    <input
                      id="timeline-assignee-input"
                      type="text"
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      placeholder="e.g. Lucas, Coordinator, Elena"
                      className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition"
                >
                  {editingItem ? 'Save Changes' : 'Add Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
