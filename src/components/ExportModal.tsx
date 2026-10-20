import React, { useState } from 'react';
import {
  FileDown,
  Printer,
  Copy,
  Check,
  X,
  FileSpreadsheet,
  Calendar,
  Users,
  MapPin,
  DollarSign,
} from 'lucide-react';
import type { EventPlan } from '../types.ts';
import { calculateBudgetTotals } from '../utils/eventCalculations.ts';

interface ExportModalProps {
  event: EventPlan;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ event, onClose }) => {
  const [copied, setCopied] = useState(false);
  const totals = calculateBudgetTotals(event.budgetItems, event.targetBudget);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const headers = ['Category', 'Item Name', 'Planned Cost ($)', 'Actual Cost ($)', 'Paid Status', 'Notes'];
    const rows = event.budgetItems.map((item) => [
      `"${item.category.replace(/"/g, '""')}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      item.plannedCost,
      item.actualCost,
      item.paid ? 'Paid' : 'Pending',
      `"${(item.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}_Budget.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyMarkdown = () => {
    let md = `# ${event.title}\n`;
    md += `**Event Type:** ${event.eventType.toUpperCase()} | **Date:** ${event.date} | **Guests:** ${event.guestCount} | **Budget:** $${event.targetBudget.toLocaleString()}\n`;
    md += `**Location:** ${event.location}\n`;
    md += `**Aesthetic & Vibe:** ${event.vibeAndTheme}\n\n`;

    md += `## Signature Highlights\n`;
    event.keyHighlights.forEach((h, i) => {
      md += `${i + 1}. ${h}\n`;
    });

    md += `\n## Budget Summary ($${totals.totalSpent} spent of $${totals.targetBudget})\n`;
    event.budgetItems.forEach((b) => {
      md += `- [${b.paid ? 'x' : ' '}] **${b.category}**: ${b.name} — Planned: $${b.plannedCost}, Actual: $${b.actualCost} (${b.paid ? 'PAID' : 'PENDING'})\n`;
    });

    md += `\n## Day-of Run of Show\n`;
    event.timelineItems
      .filter((t) => t.phase === 'Day-of Schedule')
      .sort((a, b) => (a.dayOfOrder || 0) - (b.dayOfOrder || 0))
      .forEach((t) => {
        md += `- **${t.timeOfDay || 'Time TBD'}**: ${t.title} — ${t.description}\n`;
      });

    md += `\n## Vendors\n`;
    event.vendorItems.forEach((v) => {
      md += `- **${v.category}**: ${v.name} (${v.status.toUpperCase()}) — $${v.actualCost || v.estimatedCost}\n`;
    });

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-scaleUp my-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-stone-900 text-white">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-stone-900">
                Export Event Dossier
              </h2>
              <p className="text-xs text-stone-500">
                Print a ready-to-share run sheet or export data to spreadsheet.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 py-4 border-b border-stone-100">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
          >
            <Printer className="w-4 h-4 text-stone-600" />
            <span>Print / Save as PDF</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Download Budget CSV</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-stone-600" />
                <span>Copy Summary Markdown</span>
              </>
            )}
          </button>
        </div>

        {/* Printable Dossier Preview */}
        <div className="mt-5 p-6 bg-stone-50 rounded-xl border border-stone-200 text-stone-800 text-xs sm:text-sm space-y-6 print:bg-white print:border-none print:p-0">
          {/* Header */}
          <div className="border-b border-stone-200 pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
              {event.eventType} Master Plan
            </span>
            <h1 className="text-2xl font-bold font-serif text-stone-900 mt-1">{event.title}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-stone-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" /> {event.date}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" /> {event.location}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-stone-400" /> {event.guestCount} Guests
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-stone-400" /> $
                {event.targetBudget.toLocaleString()} Budget
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-3 italic">{event.vibeAndTheme}</p>
          </div>

          {/* Budget Recap */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-stone-900 mb-2">
              Budget & Expense Line Items
            </h3>
            <div className="space-y-1.5">
              {event.budgetItems.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between text-xs py-1 border-b border-stone-200/50"
                >
                  <span className="text-stone-800">
                    <strong>{b.category}:</strong> {b.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-stone-500">Planned: ${b.plannedCost}</span>
                    <span className="font-semibold text-stone-900">Actual: ${b.actualCost}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        b.paid ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {b.paid ? 'PAID' : 'PENDING'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Day of Schedule */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-stone-900 mb-2">
              Day-of Run of Show
            </h3>
            <div className="space-y-2">
              {event.timelineItems
                .filter((t) => t.phase === 'Day-of Schedule')
                .sort((a, b) => (a.dayOfOrder || 0) - (b.dayOfOrder || 0))
                .map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-white rounded-lg border border-stone-200 flex items-start gap-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{item.timeOfDay}</span>
                        <span className="text-stone-700 font-semibold">{item.title}</span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-stone-500 mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Vendors */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-stone-900 mb-2">
              Vendor Directory
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {event.vendorItems.map((v) => (
                <div key={v.id} className="p-2.5 bg-white rounded border border-stone-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900">{v.name}</span>
                    <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                      {v.status}
                    </span>
                  </div>
                  <div className="text-stone-500 mt-0.5">{v.category} — {v.roleDescription}</div>
                  <div className="text-stone-700 font-semibold mt-1">
                    Cost: ${v.actualCost || v.estimatedCost}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-100 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
