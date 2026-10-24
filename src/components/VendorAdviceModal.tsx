import React, { useState, useEffect } from 'react';
import { Sparkles, HelpCircle, AlertOctagon, Lightbulb, X, Copy, Check, Loader2 } from 'lucide-react';
import { getVendorAdvice } from '../services/api.ts';
import type { EventPlan, VendorItem } from '../types.ts';

interface VendorAdviceModalProps {
  vendor: VendorItem;
  event: EventPlan;
  onClose: () => void;
  onAddQuestionToVendor: (vendorId: string, question: string) => void;
}

export const VendorAdviceModal: React.FC<VendorAdviceModalProps> = ({
  vendor,
  event,
  onClose,
  onAddQuestionToVendor,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [advice, setAdvice] = useState<{
    questions: string[];
    redFlags?: string[];
    negotiationTip?: string;
  } | null>(null);
  const [copiedQuestion, setCopiedQuestion] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let isMounted = true;
    async function fetchAdvice() {
      setLoading(true);
      try {
        const result = await getVendorAdvice({
          vendorCategory: vendor.category,
          eventType: event.eventType,
          targetBudget: event.targetBudget,
          specialRequirements: vendor.roleDescription,
        });
        if (isMounted) {
          setAdvice(result);
        }
      } catch (err) {
        console.error('Failed to load vendor advice', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAdvice();
    return () => {
      isMounted = false;
    };
  }, [vendor.category, event.eventType, event.targetBudget, vendor.roleDescription]);

  const handleCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedQuestion(text);
    setTimeout(() => setCopiedQuestion(null), 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vendor-advice-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="vendor-advice-modal-title" className="font-bold text-lg text-stone-900">
                AI Vendor Guide: {vendor.category}
              </h3>
              <p className="text-xs text-stone-500">{vendor.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-stone-500 space-y-3" role="status">
            <Loader2 className="w-8 h-8 animate-spin text-rose-600" aria-hidden="true" />
            <p className="text-sm font-medium">Analyzing vendor vetting strategies & contract tips...</p>
          </div>
        ) : advice ? (
          <div className="mt-5 space-y-5">
            {/* Must-Ask Interview Questions */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                <HelpCircle className="w-4 h-4 text-rose-600" aria-hidden="true" />
                <span>Sharp Interview & Vetting Questions</span>
              </div>
              <div className="space-y-2">
                {advice.questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 flex items-start justify-between gap-3 text-xs sm:text-sm text-stone-800"
                  >
                    <p className="leading-relaxed">&ldquo;{q}&rdquo;</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(q)}
                        className="p-1 text-stone-400 hover:text-stone-700 rounded"
                        title="Copy question"
                        aria-label={`Copy question: ${q}`}
                      >
                        {copiedQuestion === q ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onAddQuestionToVendor(vendor.id, q);
                          onClose();
                        }}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-white border border-rose-200 px-2 py-0.5 rounded shadow-2xs"
                      >
                        + Add to Vendor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Red Flags to Watch */}
            {advice.redFlags && advice.redFlags.length > 0 && (
              <div className="p-4 bg-red-50/60 rounded-xl border border-red-200/70">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-900 mb-2">
                  <AlertOctagon className="w-4 h-4 text-red-600" aria-hidden="true" />
                  <span>Contract Red Flags to Watch</span>
                </div>
                <ul className="space-y-1.5 text-xs text-red-900 list-disc list-inside">
                  {advice.redFlags.map((flag, idx) => (
                    <li key={idx} className="leading-snug">
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Negotiation Tip */}
            {advice.negotiationTip && (
              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
                  <Lightbulb className="w-4 h-4 text-amber-600" aria-hidden="true" />
                  <span>Negotiation Leverage Tip</span>
                </div>
                <p className="text-xs text-amber-950 leading-relaxed font-medium">
                  {advice.negotiationTip}
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-2xs transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
