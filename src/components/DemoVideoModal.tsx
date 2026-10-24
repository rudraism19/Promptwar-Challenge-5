import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Download,
  X,
  Sparkles,
  DollarSign,
  Clock,
  Briefcase,
  Lightbulb,
  FileDown,
} from 'lucide-react';

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: 'overview' | 'budget' | 'timeline' | 'vendors' | 'ideas') => void;
}

export const DemoVideoModal: React.FC<DemoVideoModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeChapter, setActiveChapter] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const chapters = [
    {
      time: 0,
      title: 'Event Master Overview & Palette',
      desc: 'AI-generated design concept, curated 5-swatch color palette with hex codes, and signature event highlights.',
      icon: <Sparkles className="w-4 h-4 text-rose-500" aria-hidden="true" />,
      tab: 'overview' as const,
    },
    {
      time: 6,
      title: 'Smart Budget & Category Allocations',
      desc: 'Planned vs actual costs, interactive visual allocation bars, over-budget alerts, and instant paid toggles.',
      icon: <DollarSign className="w-4 h-4 text-emerald-500" aria-hidden="true" />,
      tab: 'budget' as const,
    },
    {
      time: 14,
      title: 'Master Timeline & Day-of Schedule',
      desc: '12+ month milestone countdown and minute-by-minute day-of run of show with sequence numbers and assignees.',
      icon: <Clock className="w-4 h-4 text-indigo-500" aria-hidden="true" />,
      tab: 'timeline' as const,
    },
    {
      time: 20,
      title: 'Vendor Procurement & AI Vetting Guide',
      desc: 'Booked vendor directory with contracted rates, plus AI-generated interview questions and contract red flags.',
      icon: <Briefcase className="w-4 h-4 text-purple-500" aria-hidden="true" />,
      tab: 'vendors' as const,
    },
    {
      time: 27,
      title: 'Personalized AI Idea Lab',
      desc: 'Instant prompt brainstorming for bespoke signature cocktails, decor hacks, and 1-click plan inclusion.',
      icon: <Lightbulb className="w-4 h-4 text-amber-500" aria-hidden="true" />,
      tab: 'ideas' as const,
    },
    {
      time: 33,
      title: 'Instant Dossier & CSV Export',
      desc: 'Print-ready run sheet for day-of coordinators and CSV export for spreadsheet management.',
      icon: <FileDown className="w-4 h-4 text-stone-600" aria-hidden="true" />,
      tab: 'overview' as const,
    },
  ];

  const jumpToChapter = (index: number) => {
    setActiveChapter(index);
    if (videoRef.current) {
      videoRef.current.currentTime = chapters[index].time;
      videoRef.current.play().catch(() => {
        // Ignore autoplay restrictions in headless browsers
      });
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (current >= chapters[i].time) {
        setActiveChapter(i);
        break;
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-video-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-stone-900 border border-stone-800 text-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto animate-scaleUp flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-sm">
              <Video className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="demo-video-modal-title" className="text-lg sm:text-xl font-bold font-serif text-white flex items-center gap-2">
                PlanCraft AI Product Demo & Walkthrough
              </h2>
              <p className="text-xs text-stone-400">
                A guided feature tour of the GenAI-powered celebration and event planning director.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition"
            aria-label="Close demo modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Section */}
        <div className="relative bg-black aspect-video max-h-[460px] flex items-center justify-center group overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            controls
            onTimeUpdate={handleTimeUpdate}
            aria-label="PlanCraft AI product walkthrough video"
            className="w-full h-full object-contain"
          >
            <source src="/demo-video.mp4" type="video/mp4" />
            <source src="/demo-video.webm" type="video/webm" />
            Your browser does not support HTML5 video playback.
          </video>
        </div>

        {/* Chapters & Highlights Interactive Guide */}
        <div className="p-5 space-y-4 bg-stone-950/70 border-t border-stone-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Demo Chapters & Guided Showcase
            </span>
            <div className="flex items-center gap-2">
              <a
                href="/demo-video.mp4"
                download="PlanCraft_AI_Demo_Video.mp4"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg shadow-2xs transition"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Download Video (.mp4)
              </a>
              <a
                href="/demo-video.webm"
                download="PlanCraft_AI_Demo_Video.webm"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded-lg border border-stone-700 transition"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Download (.webm)
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {chapters.map((chap, idx) => (
              <div
                key={idx}
                role="button"
                tabIndex={0}
                onClick={() => jumpToChapter(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    jumpToChapter(idx);
                  }
                }}
                aria-label={`Jump to chapter ${chap.title} at 0:${chap.time < 10 ? `0${chap.time}` : chap.time}`}
                className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                  activeChapter === idx
                    ? 'border-rose-500 bg-rose-950/40 text-white ring-1 ring-rose-500'
                    : 'border-stone-800 bg-stone-900/80 text-stone-300 hover:bg-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {chap.icon}
                    <span className="text-xs font-bold font-serif truncate max-w-[170px]">
                      {chap.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-black/40 text-stone-400">
                    0:{chap.time < 10 ? `0${chap.time}` : chap.time}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                  {chap.desc}
                </p>
                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToTab(chap.tab);
                      onClose();
                    }}
                    className="mt-2 text-[10px] font-bold text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 text-left"
                  >
                    Try in App →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-900 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span className="hidden sm:inline">
            Recorded in real-time from PlanCraft AI operating with Gemini 3.8 Flash.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition"
          >
            Explore Live Application
          </button>
        </div>
      </div>
    </div>
  );
};
