'use client';

import React, {
  useState, useEffect, useCallback, useRef, useMemo
} from 'react';
import {
  X, ChevronRight, ChevronLeft, Calendar as CalendarIcon,
  Target, Palette, Cloud, CheckCircle2, Layout, Sparkles, HelpCircle,
  Hand, PartyPopper, MousePointerClick
} from 'lucide-react';
import { ViewMode } from './ViewSwitcher';

/* ─── Types ──────────────────────────────────────────────── */
interface Step {
  id: string;
  title: string;
  description: string;
  hint?: string;
  tryIt?: string;         // short "action" CTA shown as badge
  icon: React.ReactNode;
  color: string;
  gradientFrom: string;   // for beacon/connector color
  target?: string;
  action?: () => void;
  position?: 'top' | 'bottom' | 'center';
}

interface OnboardingProps {
  onClose: () => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedDate: (date: Date | null) => void;
}

/* ─── Confetti particle ───────────────────────────────────── */
const CONFETTI_COLORS = [
  '#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#ef4444','#06b6d4',
];
function ConfettiBurst() {
  const pieces = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      x: Math.random() * 280 - 140,
      delay: Math.random() * 0.35,
      size: Math.random() * 6 + 5,
      shape: Math.random() > 0.5 ? '50%' : '2px',
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
      {pieces.map(p => (
        <div
          key={p.id}
          className="tour-confetti-piece absolute"
          style={{
            backgroundColor: p.color,
            left: `calc(50% + ${p.x}px)`,
            bottom: '60%',
            width: p.size,
            height: p.size,
            borderRadius: p.shape,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── SVG connector arrow from tooltip → target ─────────── */
function ConnectorArrow({
  from, to, color
}: { from: { x: number; y: number }, to: { x: number; y: number }, color: string }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const mx = from.x + dx * 0.5;
  const my = from.y + dy * 0.4;
  const d = `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
  const len = Math.hypot(dx, dy);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-[508]" style={{ overflow: 'visible' }}>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6"
          refX="6" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={color} opacity="0.75" />
        </marker>
        <filter id="arrow-blur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
        </filter>
      </defs>
      {/* glow shadow */}
      <path d={d} fill="none" stroke={color} strokeWidth="3"
        strokeOpacity="0.2" filter="url(#arrow-blur)"
        strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len}
        className="tour-dash" />
      {/* main line */}
      <path d={d} fill="none" stroke={color} strokeWidth="2"
        strokeOpacity="0.8" strokeLinecap="round"
        markerEnd="url(#arrowhead)"
        strokeDasharray={len} strokeDashoffset={len}
        className="tour-dash" />
    </svg>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function Onboarding({ onClose, setViewMode, setSelectedDate }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'fwd' | 'bwd' | 'init'>('init');
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<React.CSSProperties>({});
  const [connectorPoints, setConnectorPoints] = useState<
    { from: { x: number; y: number }; to: { x: number; y: number } } | null
  >(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  /* ─── Steps definition ─── */
  const STEPS: Step[] = [
    {
      id: 'header',
      title: "Welcome to Your Digital Desk",
      description: "This highlighted strip at the top is your Header — the control center for navigating months, years and app settings. Everything starts here.",
      hint: "💡 Click the large month name to instantly jump to any month via a dropdown.",
      icon: <Layout size={34} />,
      color: "from-blue-500 to-indigo-600",
      gradientFrom: '#3b82f6',
      target: ".calendar-header",
      position: "bottom",
    },
    {
      id: 'nav-arrows',
      title: "Moving Through Time",
      description: "Use the ‹ › arrow buttons to flip between months — exactly like the pages of a paper calendar. The 'Today' button always brings you back to now.",
      hint: "💡 Click the year label to jump to any year from a scrollable picker.",
      tryIt: "👆 Try clicking an arrow",
      icon: <CalendarIcon size={34} />,
      color: "from-amber-400 to-orange-500",
      gradientFrom: '#f59e0b',
      target: ".calendar-header",
      position: "bottom",
    },
    {
      id: 'view-switcher',
      title: "Your Perspective Tabs",
      description: "These seven tabs change how you see your time. Day = one day. Week = side-by-side columns. Month = the big grid. Year = all 12 months. List = upcoming events only.",
      hint: "💡 'Focus' and 'Extra' are special — they replace the calendar entirely with powerful tools.",
      icon: <Sparkles size={34} />,
      color: "from-sky-400 to-cyan-600",
      gradientFrom: '#06b6d4',
      target: ".view-switcher",
      position: "bottom",
    },
    {
      id: 'calendar-grid',
      title: "Your Life's Grid",
      description: "Each square here is one day. Squares with small dots already have events. Click any day to slide open the Notepad panel on the right where you add appointments.",
      hint: "🖱️ After this tour, click any date to add your first event — it takes 10 seconds!",
      tryIt: "👆 Click any day cell",
      icon: <CheckCircle2 size={34} />,
      color: "from-emerald-400 to-teal-600",
      gradientFrom: '#10b981',
      target: ".calendar-grid",
      position: "top",
      action: () => setViewMode('month'),
    },
    {
      id: 'focus',
      title: "Deep Work: Focus Mode",
      description: "The app just switched to Focus mode for you. You'll see a Pomodoro timer (25 min work, 5 min break). Press ▶ to start a concentrated session. The browser tab title even counts down!",
      hint: "⏱️ Completed sessions are counted and stored in this view — track your deep-work hours!",
      icon: <Target size={34} />,
      color: "from-rose-500 to-red-600",
      gradientFrom: '#ef4444',
      position: "center",
      action: () => setViewMode('focus'),
    },
    {
      id: 'extra',
      title: "Atmosphere + Creative Canvas",
      description: "You're now in Extra mode. Use the toggle at the top to switch between your live Weather dashboard and a full Drawing Canvas with brushes, colors, and undo/redo.",
      hint: "🎨 Your drawings stay in the canvas until you press the Clear button or refresh.",
      icon: <Cloud size={34} />,
      color: "from-indigo-400 to-purple-600",
      gradientFrom: '#8b5cf6',
      position: "center",
      action: () => setViewMode('extra'),
    },
    {
      id: 'theme',
      title: "Personalize Everything",
      description: "The Palette icon (highlighted) opens the Theme picker. Choose from Classic, Ocean, Forest, Royal, Sunset, or the animated Aurora theme. Toggle Night / Day mode inside.",
      hint: "💾 Your chosen theme and mode are saved automatically — they'll be here next time you open the app.",
      tryIt: "👆 Click the palette icon",
      icon: <Palette size={34} />,
      color: "from-fuchsia-400 to-pink-600",
      gradientFrom: '#d946ef',
      target: ".theme-toggle-button",
      position: "bottom",
      action: () => setViewMode('month'),
    },
    {
      id: 'done',
      title: "You're All Set! 🎉",
      description: "Smart Calendar automatically saves everything. Your events, notes, and settings are all stored locally on your device — private and always available.",
      hint: "⚠️ Warning: The red 'Clear All Data' button in the Palette menu permanently deletes all your events and notes. Use it only if you want a fresh start.",
      icon: <PartyPopper size={34} />,
      color: "from-amber-400 via-rose-400 to-purple-600",
      gradientFrom: '#f59e0b',
      position: "center",
      action: () => setViewMode('month'),
    },
  ];

  /* ─── Compute tooltip position ─── */
  const computePositions = useCallback(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);

    const step = STEPS[currentStep];
    const targetEl = step.target ? document.querySelector<HTMLElement>(step.target) : null;

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Wait a tick so scroll has settled
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(() => {
      const tRect = targetEl ? targetEl.getBoundingClientRect() : null;
      setHighlightRect(tRect);

      const TOOLTIP_W = mobile ? window.innerWidth - 32 : 420;
      const TOOLTIP_H = mobile ? 310 : 380;
      const GAP = 20;
      const VW = window.innerWidth;
      const VH = window.innerHeight;

      if (mobile) {
        // Bottom sheet on mobile — always
        setTooltipPos({
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          maxWidth: '100%',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        });
        setConnectorPoints(null);
        return;
      }

      if (!tRect) {
        // Center modal for "center" steps
        setTooltipPos({
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: TOOLTIP_W,
        });
        setConnectorPoints(null);
        return;
      }

      // Decide above or below
      const spaceBelow = VH - tRect.bottom;
      const spaceAbove = tRect.top;
      let tooltipTop: number;
      let tipSide: 'above' | 'below';

      if (step.position === 'top' && spaceAbove >= TOOLTIP_H + GAP) {
        tooltipTop = tRect.top - TOOLTIP_H - GAP;
        tipSide = 'above';
      } else if (spaceBelow >= TOOLTIP_H + GAP) {
        tooltipTop = tRect.bottom + GAP;
        tipSide = 'below';
      } else {
        tooltipTop = spaceBelow > spaceAbove ? tRect.bottom + GAP : tRect.top - TOOLTIP_H - GAP;
        tipSide = spaceBelow > spaceAbove ? 'below' : 'above';
      }
      tooltipTop = Math.max(16, Math.min(tooltipTop, VH - TOOLTIP_H - 16));

      let tooltipLeft = tRect.left + tRect.width / 2 - TOOLTIP_W / 2;
      tooltipLeft = Math.max(16, Math.min(tooltipLeft, VW - TOOLTIP_W - 16));

      setTooltipPos({
        position: 'fixed',
        top: tooltipTop,
        left: tooltipLeft,
        width: TOOLTIP_W,
      });

      // Connector: from card edge → target center
      const cardAnchorX = tooltipLeft + TOOLTIP_W / 2;
      const cardAnchorY = tipSide === 'below' ? tooltipTop : tooltipTop + TOOLTIP_H;
      const targetCX = tRect.left + tRect.width / 2;
      const targetCY = tipSide === 'below' ? tRect.bottom - 8 : tRect.top + 8;

      setConnectorPoints({
        from: { x: cardAnchorX, y: cardAnchorY },
        to:   { x: targetCX,   y: targetCY   },
      });
    });
  }, [currentStep]);

  /* ─── Step change ─── */
  const go = useCallback((nextIdx: number) => {
    setDirection(nextIdx > currentStep ? 'fwd' : 'bwd');
    setIsVisible(false);
    setConnectorPoints(null);

    const step = STEPS[nextIdx];
    if (step.action) step.action();

    const t = setTimeout(() => {
      setCurrentStep(nextIdx);
      setIsVisible(true);
    }, 220);
    return () => clearTimeout(t);
  }, [currentStep]);

  /* ─── Mount / step change ─── */
  useEffect(() => {
    const t = setTimeout(() => {
      computePositions();
      setIsVisible(true);
    }, 180);
    return () => clearTimeout(t);
  }, [currentStep, computePositions]);

  /* Final step confetti */
  useEffect(() => {
    if (currentStep === STEPS.length - 1) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 2200);
      return () => clearTimeout(t);
    }
  }, [currentStep]);

  /* Resize / scroll recompute */
  useEffect(() => {
    window.addEventListener('resize', computePositions);
    window.addEventListener('scroll', computePositions, { passive: true, capture: true });
    return () => {
      window.removeEventListener('resize', computePositions);
      window.removeEventListener('scroll', computePositions, true);
    };
  }, [computePositions]);

  /* Keyboard */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentStep]);

  const next = () => {
    if (currentStep < STEPS.length - 1) go(currentStep + 1);
    else onClose();
  };
  const prev = () => { if (currentStep > 0) go(currentStep - 1); };

  /* Touch swipe */
  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 55) diff < 0 ? next() : prev();
    setTouchStartX(null);
  };

  const step = STEPS[currentStep];
  const pad = 12;
  const enterClass = direction === 'init' ? 'tour-enter'
    : direction === 'fwd' ? 'tour-enter-fwd' : 'tour-enter-bwd';

  /* ─── Render ─── */
  return (
    <div
      className="fixed inset-0 z-[500]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── SVG dimmed overlay with clean cutout ── */}
      <svg
        className="absolute inset-0 w-full h-full z-[501] pointer-events-auto"
        onClick={onClose}
        style={{ display: 'block' }}
      >
        <defs>
          <mask id="tour-mask-v3">
            <rect width="100%" height="100%" fill="white" />
            {highlightRect && (
              <rect
                x={highlightRect.left - pad}
                y={highlightRect.top  - pad}
                width={highlightRect.width  + pad * 2}
                height={highlightRect.height + pad * 2}
                rx="18" ry="18"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%" height="100%"
          fill="rgba(10,8,8,0.72)"
          mask="url(#tour-mask-v3)"
        />
      </svg>

      {/* ── Spotlight border ring ── */}
      {highlightRect && (
        <>
          {/* Outer animated glow */}
          <div
            className="absolute z-[502] rounded-[18px] pointer-events-none tour-ring"
            style={{
              top:  highlightRect.top  - pad,
              left: highlightRect.left - pad,
              width:  highlightRect.width  + pad * 2,
              height: highlightRect.height + pad * 2,
              border: `2px solid rgba(255,255,255,0.55)`,
              boxShadow: `0 0 0 4px ${step.gradientFrom}33, 0 0 24px ${step.gradientFrom}44`,
            }}
          />
          {/* Inner beacon dot in center of target */}
          <div
            className="absolute z-[503] pointer-events-none flex items-center justify-center"
            style={{
              top:  highlightRect.top  + highlightRect.height / 2 - 10,
              left: highlightRect.left + highlightRect.width  / 2 - 10,
              width: 20, height: 20,
            }}
          >
            <div
              className="absolute w-full h-full rounded-full"
              style={{ backgroundColor: step.gradientFrom, opacity: 0.35 }}
            />
            <div
              className="absolute w-full h-full rounded-full tour-beacon-inner"
              style={{ backgroundColor: step.gradientFrom, opacity: 0.5 }}
            />
            <div
              className="relative w-3 h-3 rounded-full"
              style={{ backgroundColor: step.gradientFrom }}
            />
          </div>
        </>
      )}

      {/* ── Animated SVG connector arrow ── */}
      {!isMobile && connectorPoints && (
        <ConnectorArrow
          from={connectorPoints.from}
          to={connectorPoints.to}
          color={step.gradientFrom}
        />
      )}

      {/* ── Tooltip card ── */}
      {isVisible && (
        <div
          ref={tooltipRef}
          key={`${currentStep}-${direction}`}
          className={`absolute flex flex-col bg-[var(--theme-card)] border border-[var(--theme-border)] overflow-hidden
            pointer-events-auto z-[510] ${enterClass}
            ${isMobile
              ? 'rounded-t-[2rem] rounded-b-none shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.45)]'
              : 'rounded-[2.5rem]       shadow-[0_32px_80px_-12px_rgba(0,0,0,0.55)]'
            }`}
          style={tooltipPos}
        >
          {/* Mobile drag handle */}
          {isMobile && (
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-[var(--theme-border)] rounded-full opacity-60" />
            </div>
          )}

          {/* ── Card Header Row ── */}
          <div className="flex items-center justify-between px-6 pt-4 pb-0">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black text-white"
                style={{ background: step.gradientFrom }}
              >
                {currentStep + 1}
              </span>
              <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-[0.15em]">
                of {STEPS.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-accent-muted)] transition-all"
              title="Skip tour (Esc)"
            >
              <X size={13} />
            </button>
          </div>

          {/* ── Card Body ── */}
          <div className="px-6 pb-5 pt-3 flex flex-col items-center text-center gap-4">
            {/* Icon */}
            <div
              className={`p-4 rounded-[1.5rem] bg-gradient-to-br ${step.color} text-white shadow-2xl tour-icon-float relative overflow-hidden`}
            >
              {step.icon}
              <div className="absolute inset-0 bg-white/10 rounded-[1.5rem]" />
            </div>

            {/* Text */}
            <div className="space-y-1.5">
              <h2 className="text-base lg:text-lg font-bold text-[var(--theme-text)] tracking-tight leading-snug">
                {step.title}
              </h2>
              <p className="text-[11px] lg:text-xs text-[var(--theme-text-muted)] leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Try-it badge */}
            {step.tryIt && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: `${step.gradientFrom}18`,
                  color: step.gradientFrom,
                  border: `1px solid ${step.gradientFrom}30`,
                }}
              >
                <MousePointerClick size={11} />
                {step.tryIt}
              </div>
            )}

            {/* Hint */}
            {step.hint && (
              <div className="tour-hint-shimmer w-full px-3.5 py-2.5 rounded-xl text-[10px] text-[var(--theme-text-muted)] leading-relaxed text-left">
                {step.hint}
              </div>
            )}

            {/* ── Navigation ── */}
            <div className="flex items-center justify-between w-full pt-1">
              <button
                onClick={prev}
                disabled={currentStep === 0}
                className={`flex items-center gap-1 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
                  ${currentStep === 0
                    ? 'opacity-0 pointer-events-none'
                    : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-accent-muted)]'}`}
              >
                <ChevronLeft size={13} /> Back
              </button>

              {/* Clickable progress dots */}
              <div className="flex items-center gap-1.5">
                {STEPS.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => go(i)}
                    title={s.title}
                    className={`rounded-full transition-all duration-500 hover:scale-150 ${
                      i === currentStep
                        ? 'w-5 h-2'
                        : i < currentStep
                          ? 'w-2 h-2 opacity-50'
                          : 'w-2 h-2 opacity-25'
                    }`}
                    style={{
                      backgroundColor: i <= currentStep ? step.gradientFrom : 'var(--theme-border)',
                    }}
                  />
                ))}
              </div>

              <button
                onClick={next}
                className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
                style={{ background: `linear-gradient(135deg, ${step.gradientFrom}, ${step.gradientFrom}bb)` }}
              >
                {currentStep === STEPS.length - 1 ? 'Finish 🎉' : 'Next'}
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Swipe hint — first step on mobile only */}
            {isMobile && currentStep === 0 && (
              <div className="flex items-center gap-1.5 text-[9px] text-[var(--theme-text-muted)] pt-0.5">
                <Hand size={11} className="animate-pulse" />
                Swipe left / right to navigate
              </div>
            )}
          </div>

          {/* ── Glowing progress bar ── */}
          <div className="w-full h-1.5 bg-[var(--theme-bg)]">
            <div
              className="h-full transition-all duration-700 ease-in-out tour-bar-glow"
              style={{
                width: `${((currentStep + 1) / STEPS.length) * 100}%`,
                background: `linear-gradient(90deg, ${step.gradientFrom}88, ${step.gradientFrom})`,
              }}
            />
          </div>

          {/* Confetti on final step */}
          {showConfetti && currentStep === STEPS.length - 1 && <ConfettiBurst />}
        </div>
      )}
    </div>
  );
}
