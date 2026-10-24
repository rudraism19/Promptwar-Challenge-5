import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Mail,
  Phone,
  Globe,
  HelpCircle,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import type { EventPlan, VendorItem, VendorStatus } from '../types.ts';
import { calculateVendorProgress } from '../utils/eventCalculations.ts';
import { VendorAdviceModal } from './VendorAdviceModal.tsx';

interface VendorChecklistProps {
  event: EventPlan;
  onUpdateVendorItems: (items: VendorItem[]) => void;
}

export const VendorChecklist: React.FC<VendorChecklistProps> = ({ event, onUpdateVendorItems }) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // AI Advice Modal state
  const [adviceVendor, setAdviceVendor] = useState<VendorItem | null>(null);

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<VendorItem | null>(null);
  const [formData, setFormData] = useState<{
    category: string;
    name: string;
    roleDescription: string;
    estimatedCost: number;
    actualCost?: number;
    status: VendorStatus;
    contactName: string;
    email: string;
    phone: string;
    website: string;
    notes: string;
    questionsToAsk: string[];
  }>({
    category: 'Catering',
    name: '',
    roleDescription: '',
    estimatedCost: 1500,
    actualCost: undefined,
    status: 'researching',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    notes: '',
    questionsToAsk: [],
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

  const progress = calculateVendorProgress(event.vendorItems);

  // Categories list
  const categories = Array.from(new Set(event.vendorItems.map((v) => v.category)));

  const handleStatusChange = (vendorId: string, nextStatus: VendorStatus) => {
    const updated = event.vendorItems.map((item) =>
      item.id === vendorId ? { ...item, status: nextStatus } : item
    );
    onUpdateVendorItems(updated);
  };

  const handleConfirmDelete = (vendorId: string) => {
    const updated = event.vendorItems.filter((item) => item.id !== vendorId);
    onUpdateVendorItems(updated);
    setPendingDeleteId(null);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      category: 'Venue',
      name: '',
      roleDescription: '',
      estimatedCost: 1000,
      actualCost: undefined,
      status: 'researching',
      contactName: '',
      email: '',
      phone: '',
      website: '',
      notes: '',
      questionsToAsk: [
        'What is your cancellation and deposit refund policy?',
        'Are there any overtime fees if the event runs late?',
      ],
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (vendor: VendorItem) => {
    setEditingItem(vendor);
    setFormData({
      category: vendor.category,
      name: vendor.name,
      roleDescription: vendor.roleDescription,
      estimatedCost: vendor.estimatedCost,
      actualCost: vendor.actualCost,
      status: vendor.status,
      contactName: vendor.contactName || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      website: vendor.website || '',
      notes: vendor.notes || '',
      questionsToAsk: vendor.questionsToAsk || [],
    });
    setModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingItem) {
      const updated = event.vendorItems.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              category: formData.category.trim(),
              name: formData.name.trim(),
              roleDescription: formData.roleDescription.trim(),
              estimatedCost: Math.max(0, Number(formData.estimatedCost) || 0),
              actualCost: formData.actualCost !== undefined ? Math.max(0, Number(formData.actualCost)) : undefined,
              status: formData.status,
              contactName: formData.contactName.trim() || undefined,
              email: formData.email.trim() || undefined,
              phone: formData.phone.trim() || undefined,
              website: formData.website.trim() || undefined,
              notes: formData.notes.trim() || undefined,
              questionsToAsk: formData.questionsToAsk,
            }
          : item
      );
      onUpdateVendorItems(updated);
    } else {
      const newVendor: VendorItem = {
        id: `vendor-${Date.now()}`,
        category: formData.category.trim(),
        name: formData.name.trim(),
        roleDescription: formData.roleDescription.trim(),
        estimatedCost: Math.max(0, Number(formData.estimatedCost) || 0),
        actualCost: formData.actualCost !== undefined ? Math.max(0, Number(formData.actualCost)) : undefined,
        status: formData.status,
        contactName: formData.contactName.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        website: formData.website.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        questionsToAsk: formData.questionsToAsk,
      };
      onUpdateVendorItems([...event.vendorItems, newVendor]);
    }

    setModalOpen(false);
  };

  const handleAddQuestionToVendor = (vendorId: string, question: string) => {
    const updated = event.vendorItems.map((item) => {
      if (item.id === vendorId) {
        const existing = item.questionsToAsk || [];
        if (!existing.includes(question)) {
          return { ...item, questionsToAsk: [...existing, question] };
        }
      }
      return item;
    });
    onUpdateVendorItems(updated);
  };

  // Filtered vendors
  const filteredVendors = event.vendorItems.filter((v) => {
    if (selectedStatus !== 'ALL' && v.status !== selectedStatus) return false;
    if (selectedCategory !== 'ALL' && v.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = v.name.toLowerCase().includes(q);
      const matchCat = v.category.toLowerCase().includes(q);
      const matchRole = v.roleDescription.toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchRole) return false;
    }
    return true;
  });

  const getStatusBadge = (status: VendorStatus) => {
    switch (status) {
      case 'booked':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Booked',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'contacted':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
          label: 'Contacted',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'researching':
        return {
          icon: <Search className="w-3.5 h-3.5 text-indigo-600" />,
          label: 'Researching',
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        };
      case 'declined':
        return {
          icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
          label: 'Declined',
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
        };
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Procurement Metrics */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold font-serif text-stone-900">
              Vendor Checklist & Procurement Directory
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Organize contracts, compare proposals, track costs, and get tailored AI vetting advice.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-2xs transition"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add New Vendor</span>
          </button>
        </div>

        {/* Vendor Status Meters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-stone-100 text-xs">
          <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100">
            <span className="font-semibold text-emerald-900 block">Booked & Confirmed</span>
            <span className="text-xl font-bold text-emerald-700 font-serif">
              {progress.booked} / {progress.total}
            </span>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-100">
            <span className="font-semibold text-amber-900 block">In Discussions</span>
            <span className="text-xl font-bold text-amber-700 font-serif">
              {progress.contacted} contacted
            </span>
          </div>
          <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100">
            <span className="font-semibold text-indigo-900 block">To Research</span>
            <span className="text-xl font-bold text-indigo-700 font-serif">
              {progress.researching} candidates
            </span>
          </div>
          <div className="p-3 bg-stone-100/70 rounded-lg border border-stone-200">
            <span className="font-semibold text-stone-700 block">Committed Spend</span>
            <span className="text-xl font-bold text-stone-900 font-serif">
              ${progress.totalCommittedCost.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor or role..."
              aria-label="Search vendors by name, category, or role"
              className="pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-purple-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-700 font-medium">
            <span className="text-stone-500 font-semibold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter vendors by booking status"
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses ({event.vendorItems.length})</option>
              <option value="booked">Booked</option>
              <option value="contacted">Contacted</option>
              <option value="researching">Researching</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-700 font-medium">
            <span className="text-stone-500 font-semibold">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter vendors by category"
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vendors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredVendors.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl p-8 text-center text-stone-500 border border-stone-200">
            <Briefcase className="w-8 h-8 text-stone-300 mx-auto mb-2" aria-hidden="true" />
            <p className="font-medium text-stone-700">No vendors found matching your criteria.</p>
            <p className="text-xs text-stone-400 mt-1">Try clearing filters or click &ldquo;Add New Vendor&rdquo;.</p>
          </div>
        ) : (
          filteredVendors.map((vendor) => {
            const badge = getStatusBadge(vendor.status);
            return (
              <div
                key={vendor.id}
                className="bg-white rounded-xl p-5 border border-stone-200/90 shadow-2xs hover:shadow transition flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top line: Category, Status, Actions */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                      {vendor.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Status Selector */}
                      <div className="relative">
                        <select
                          value={vendor.status}
                          onChange={(e) =>
                            handleStatusChange(vendor.id, e.target.value as VendorStatus)
                          }
                          aria-label={`Change status for ${vendor.name}`}
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border cursor-pointer ${badge.bg}`}
                        >
                          <option value="researching">Researching</option>
                          <option value="contacted">Contacted</option>
                          <option value="booked">Booked</option>
                          <option value="declined">Declined</option>
                        </select>
                      </div>

                      {/* Edit & Delete */}
                      {pendingDeleteId === vendor.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleConfirmDelete(vendor.id)}
                            className="px-2 py-0.5 text-[11px] font-bold bg-red-600 text-white rounded hover:bg-red-700"
                            aria-label={`Confirm delete ${vendor.name}`}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(null)}
                            className="px-2 py-0.5 text-[11px] font-medium bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
                            aria-label="Cancel delete vendor"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(vendor)}
                            className="p-1 text-stone-400 hover:text-stone-700 rounded"
                            aria-label={`Edit ${vendor.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(vendor.id)}
                            className="p-1 text-stone-400 hover:text-red-600 rounded"
                            aria-label={`Delete ${vendor.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Vendor Name & Role */}
                  <h3 className="text-base font-bold text-stone-900 font-serif">{vendor.name}</h3>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {vendor.roleDescription}
                  </p>

                  {/* Pricing info */}
                  <div className="mt-3 flex items-center justify-between text-xs p-2.5 rounded-lg bg-stone-50 border border-stone-100">
                    <span className="text-stone-500 font-medium">Estimated:</span>
                    <span className="font-bold text-stone-900 font-serif">
                      ${vendor.estimatedCost.toLocaleString()}
                    </span>
                    {vendor.actualCost !== undefined && (
                      <>
                        <span className="text-stone-300">|</span>
                        <span className="text-stone-500 font-medium">Contracted:</span>
                        <span className="font-bold text-emerald-700 font-serif">
                          ${vendor.actualCost.toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Contact details */}
                  {(vendor.contactName || vendor.email || vendor.phone || vendor.website) && (
                    <div className="mt-3 space-y-1 text-xs text-stone-600">
                      {vendor.contactName && (
                        <div className="font-medium text-stone-800">
                          Contact: {vendor.contactName}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-stone-500 pt-0.5">
                        {vendor.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-stone-400" aria-hidden="true" />
                            {vendor.email}
                          </span>
                        )}
                        {vendor.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-stone-400" aria-hidden="true" />
                            {vendor.phone}
                          </span>
                        )}
                        {vendor.website && (
                          <span className="flex items-center gap-1 text-indigo-600 underline">
                            <Globe className="w-3 h-3" aria-hidden="true" />
                            {vendor.website}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Interview Questions */}
                  {vendor.questionsToAsk && vendor.questionsToAsk.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-stone-100">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1 mb-1.5">
                        <HelpCircle className="w-3 h-3 text-purple-600" aria-hidden="true" />
                        <span>Key Questions to Ask</span>
                      </div>
                      <ul className="space-y-1 text-xs text-stone-700">
                        {vendor.questionsToAsk.map((q, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-purple-500 font-bold" aria-hidden="true">•</span>
                            <span className="leading-snug">{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Card Footer: AI Vendor Guide Trigger */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setAdviceVendor(vendor)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Get AI Vetting Guide & Questions</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* AI Advice Modal */}
      {adviceVendor && (
        <VendorAdviceModal
          vendor={adviceVendor}
          event={event}
          onClose={() => setAdviceVendor(null)}
          onAddQuestionToVendor={handleAddQuestionToVendor}
        />
      )}

      {/* Add / Edit Vendor Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="vendor-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 id="vendor-modal-title" className="font-bold text-lg text-stone-900">
                {editingItem ? 'Edit Vendor Details' : 'Add New Vendor'}
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
                <label htmlFor="vendor-name-input" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Vendor / Business Name
                </label>
                <input
                  id="vendor-name-input"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Heirloom Culinary Co."
                  className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="vendor-category-input" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Category
                  </label>
                  <input
                    id="vendor-category-input"
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Photography, Venue, DJ"
                    className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="vendor-status-select" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Status
                  </label>
                  <select
                    id="vendor-status-select"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as VendorStatus })
                    }
                    className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-purple-500"
                  >
                    <option value="researching">Researching</option>
                    <option value="contacted">Contacted</option>
                    <option value="booked">Booked</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="vendor-role-input" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Role / Deliverables Description
                </label>
                <textarea
                  id="vendor-role-input"
                  rows={2}
                  value={formData.roleDescription}
                  onChange={(e) => setFormData({ ...formData, roleDescription: e.target.value })}
                  placeholder="e.g. Full day wedding photojournalism + drone video highlight"
                  className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="vendor-estimated-input" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Estimated Cost ($)
                  </label>
                  <input
                    id="vendor-estimated-input"
                    type="number"
                    min="0"
                    required
                    value={formData.estimatedCost}
                    onChange={(e) =>
                      setFormData({ ...formData, estimatedCost: Number(e.target.value) || 0 })
                    }
                    className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="vendor-actual-input" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Contracted / Actual Cost ($)
                  </label>
                  <input
                    id="vendor-actual-input"
                    type="number"
                    min="0"
                    value={formData.actualCost !== undefined ? formData.actualCost : ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        actualCost: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Leave blank if estimating"
                    className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="vendor-contact-input" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Contact Person
                  </label>
                  <input
                    id="vendor-contact-input"
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="vendor-email-input" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Email
                  </label>
                  <input
                    id="vendor-email-input"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@studio.com"
                    className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="vendor-phone-input" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Phone
                  </label>
                  <input
                    id="vendor-phone-input"
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="vendor-website-input" className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Website
                  </label>
                  <input
                    id="vendor-website-input"
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="studio.com"
                    className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-purple-500"
                  />
                </div>
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
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-2xs transition"
                >
                  {editingItem ? 'Save Changes' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
