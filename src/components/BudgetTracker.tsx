import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Tag,
  Search,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import type { BudgetItem, EventPlan } from '../types.ts';
import { calculateBudgetTotals } from '../utils/eventCalculations.ts';

interface BudgetTrackerProps {
  event: EventPlan;
  onUpdateBudgetItems: (items: BudgetItem[], newTargetBudget?: number) => void;
  onNavigateToIdeas: () => void;
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({
  event,
  onUpdateBudgetItems,
  onNavigateToIdeas,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isEditingTarget, setIsEditingTarget] = useState<boolean>(false);
  const [tempTarget, setTempTarget] = useState<string>(event.targetBudget.toString());

  // Modal for Add / Edit
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [formData, setFormData] = useState<{
    category: string;
    name: string;
    plannedCost: number;
    actualCost: number;
    paid: boolean;
    notes: string;
  }>({
    category: 'Venue',
    name: '',
    plannedCost: 0,
    actualCost: 0,
    paid: false,
    notes: '',
  });

  const totals = calculateBudgetTotals(event.budgetItems, event.targetBudget);

  const handleTogglePaid = (itemId: string) => {
    const updated = event.budgetItems.map((item) => {
      if (item.id === itemId) {
        const nextPaid = !item.paid;
        return {
          ...item,
          paid: nextPaid,
          // If marking paid and actualCost is 0, default actual to planned
          actualCost: nextPaid && item.actualCost === 0 ? item.plannedCost : item.actualCost,
        };
      }
      return item;
    });
    onUpdateBudgetItems(updated);
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to remove this budget line item?')) {
      const updated = event.budgetItems.filter((item) => item.id !== itemId);
      onUpdateBudgetItems(updated);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      category: totals.categories[0]?.category || 'General',
      name: '',
      plannedCost: 500,
      actualCost: 0,
      paid: false,
      notes: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: BudgetItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      name: item.name,
      plannedCost: item.plannedCost,
      actualCost: item.actualCost,
      paid: item.paid,
      notes: item.notes || '',
    });
    setModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingItem) {
      // Edit
      const updated = event.budgetItems.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              category: formData.category.trim(),
              name: formData.name.trim(),
              plannedCost: Number(formData.plannedCost) || 0,
              actualCost: Number(formData.actualCost) || 0,
              paid: formData.paid,
              notes: formData.notes.trim(),
            }
          : it
      );
      onUpdateBudgetItems(updated);
    } else {
      // Add
      const newItem: BudgetItem = {
        id: `budget-${Date.now()}`,
        category: formData.category.trim(),
        name: formData.name.trim(),
        plannedCost: Number(formData.plannedCost) || 0,
        actualCost: Number(formData.actualCost) || 0,
        paid: formData.paid,
        notes: formData.notes.trim(),
      };
      onUpdateBudgetItems([...event.budgetItems, newItem]);
    }

    setModalOpen(false);
  };

  const handleSaveTarget = () => {
    const parsed = Math.max(0, Number(tempTarget) || 0);
    onUpdateBudgetItems(event.budgetItems, parsed);
    setIsEditingTarget(false);
  };

  // Filtered items
  const filteredItems = event.budgetItems.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      if (!matchName && !matchNotes && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Section: Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Target Budget Card */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-semibold uppercase tracking-wider mb-1">
            <span>Target Budget</span>
            <DollarSign className="w-4 h-4 text-stone-400" />
          </div>
          {isEditingTarget ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                value={tempTarget}
                onChange={(e) => setTempTarget(e.target.value)}
                className="w-full text-lg font-bold border border-stone-300 rounded px-2 py-1 text-stone-900 focus:outline-rose-500"
              />
              <button
                onClick={handleSaveTarget}
                className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                aria-label="Save Target Budget"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsEditingTarget(false)}
                className="p-1.5 rounded bg-stone-200 text-stone-700 hover:bg-stone-300"
                aria-label="Cancel editing"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-extrabold text-stone-900 font-serif">
                ${totals.targetBudget.toLocaleString()}
              </span>
              <button
                onClick={() => {
                  setTempTarget(event.targetBudget.toString());
                  setIsEditingTarget(true);
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium"
              >
                Edit Target
              </button>
            </div>
          )}
          <p className="text-xs text-stone-500 mt-2">
            Planned allocation:{' '}
            <strong className="text-stone-800">${totals.totalPlanned.toLocaleString()}</strong>
          </p>
        </div>

        {/* Total Spent Card */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-semibold uppercase tracking-wider mb-1">
            <span>Total Actual Spent</span>
            <CheckCircle className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900 font-serif mt-1">
            ${totals.totalSpent.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-xs mt-2 text-stone-600">
            <span>Paid: ${totals.totalPaid.toLocaleString()}</span>
            <span>Unpaid: ${(totals.totalSpent - totals.totalPaid).toLocaleString()}</span>
          </div>
        </div>

        {/* Remaining Balance Card */}
        <div
          className={`p-5 rounded-xl border shadow-2xs ${
            totals.isOverBudget
              ? 'bg-red-50/50 border-red-200 text-red-950'
              : 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-1">
            <span>{totals.isOverBudget ? 'Over Budget By' : 'Remaining To Spend'}</span>
            <AlertCircle
              className={`w-4 h-4 ${totals.isOverBudget ? 'text-red-500' : 'text-emerald-600'}`}
            />
          </div>
          <div
            className={`text-2xl font-extrabold font-serif mt-1 ${
              totals.isOverBudget ? 'text-red-700' : 'text-emerald-700'
            }`}
          >
            ${Math.abs(totals.remainingTarget).toLocaleString()}
          </div>
          <p className="text-xs mt-2 opacity-80">
            {totals.isOverBudget
              ? 'Action needed: trim category items or raise target'
              : `${100 - totals.percentSpent}% of budget still available`}
          </p>
        </div>

        {/* AI Savings Action Card */}
        <div className="bg-gradient-to-br from-amber-50 to-rose-50 p-5 rounded-xl border border-amber-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>AI Budget Optimization</span>
            </div>
            <p className="text-xs text-amber-950 mt-1 leading-snug">
              Need to cut costs without sacrificing vibe? Explore smart hacks.
            </p>
          </div>
          <button
            onClick={onNavigateToIdeas}
            className="mt-3 w-full py-1.5 px-3 bg-white text-stone-800 hover:text-rose-600 text-xs font-bold rounded-lg border border-amber-300 shadow-2xs transition"
          >
            Explore Cost-Saving Ideas →
          </button>
        </div>
      </div>

      {/* Category Allocation Visual Breakdown */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-2xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-4">
          Category Allocation Breakdown
        </h3>
        <div className="space-y-3">
          {totals.categories.map((cat) => {
            const pct = totals.totalPlanned > 0 ? Math.round((cat.planned / totals.totalPlanned) * 100) : 0;
            return (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-stone-800">{cat.category}</span>
                  <div className="flex items-center gap-3 text-stone-600">
                    <span>
                      Planned: <strong>${cat.planned.toLocaleString()}</strong> ({pct}%)
                    </span>
                    <span className="text-stone-400">|</span>
                    <span className={cat.actual > cat.planned ? 'text-red-600 font-semibold' : ''}>
                      Actual: ${cat.actual.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden flex">
                  <div
                    className="bg-amber-600 h-2.5 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                    title={`${cat.category}: ${pct}% of planned budget`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls & Table Toolbar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Selector Filter */}
            <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700">
              <Tag className="w-3.5 h-3.5 text-stone-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter expenses by category"
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Categories ({event.budgetItems.length})</option>
                {totals.categories.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.category} ({c.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search expense..."
                aria-label="Search expense line items"
                className="pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-rose-500 w-44 sm:w-56"
              />
            </div>
          </div>

          {/* Add Expense Button */}
          <button
            onClick={handleOpenAdd}
            aria-label="Add Budget Line Item"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="text-[11px] font-bold uppercase tracking-wider text-stone-500 bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Line Item & Notes</th>
                <th className="py-3 px-3 text-right">Planned</th>
                <th className="py-3 px-3 text-right">Actual</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-500">
                    No budget items match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/70 transition">
                    {/* Paid Toggle Checkbox */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePaid(item.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                          item.paid
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                        title={item.paid ? 'Mark as Unpaid' : 'Mark as Paid'}
                        aria-label={`Toggle paid status for ${item.name}`}
                      >
                        <CheckCircle className={`w-3.5 h-3.5 ${item.paid ? 'text-emerald-600' : 'text-stone-400'}`} />
                        <span>{item.paid ? 'Paid' : 'Pending'}</span>
                      </button>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded text-xs">
                        {item.category}
                      </span>
                    </td>

                    {/* Name & Notes */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-stone-900">{item.name}</div>
                      {item.notes && <div className="text-xs text-stone-500 line-clamp-1">{item.notes}</div>}
                    </td>

                    {/* Planned */}
                    <td className="py-3 px-3 text-right font-medium text-stone-700">
                      ${item.plannedCost.toLocaleString()}
                    </td>

                    {/* Actual */}
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`font-semibold ${
                          item.actualCost > item.plannedCost
                            ? 'text-red-600'
                            : item.actualCost > 0
                            ? 'text-stone-900'
                            : 'text-stone-400'
                        }`}
                      >
                        ${item.actualCost.toLocaleString()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-lg text-stone-900">
                {editingItem ? 'Edit Expense Item' : 'Add New Expense Item'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Category
                </label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Venue, Catering, Decor"
                  className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Item Description / Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Reception DJ Sound System"
                  className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Planned Cost ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.plannedCost}
                    onChange={(e) =>
                      setFormData({ ...formData, plannedCost: Number(e.target.value) || 0 })
                    }
                    className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Actual Cost ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.actualCost}
                    onChange={(e) =>
                      setFormData({ ...formData, actualCost: Number(e.target.value) || 0 })
                    }
                    className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="paid-checkbox"
                  checked={formData.paid}
                  onChange={(e) => setFormData({ ...formData, paid: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded border-stone-300 focus:ring-rose-500"
                />
                <label htmlFor="paid-checkbox" className="text-sm font-medium text-stone-800">
                  Mark as fully paid / deposited
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Contract / Memo Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional details, vendor deposit deadlines, terms..."
                  className="w-full text-sm border border-stone-300 rounded-lg p-2 focus:outline-rose-500"
                />
              </div>

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
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition"
                >
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
