'use client';

import React, { useState } from 'react';
import { Cloud, Palette, HelpCircle, Sparkles } from 'lucide-react';
import WeatherView from './WeatherView';
import DrawingCanvas from './DrawingCanvas';

interface ExtraFeaturesProps {
  onStartTutorial: () => void;
}

type ExtraTool = 'atmosphere' | 'canvas';

const TOOLS = [
  { id: 'atmosphere' as ExtraTool, label: 'Atmosphere', icon: Cloud,    desc: 'Live weather & forecasts' },
  { id: 'canvas'     as ExtraTool, label: 'Creative Canvas', icon: Palette, desc: 'Draw, sketch & paint' },
];

export default function ExtraFeatures({ onStartTutorial }: ExtraFeaturesProps) {
  const [activeTool, setActiveTool] = useState<ExtraTool>('atmosphere');

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">

      {/* ── Tool Switcher ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Tab pills */}
        <div className="flex items-center bg-[var(--theme-accent-muted)] p-1.5 rounded-2xl border border-[var(--theme-border)] shadow-inner flex-shrink-0 overflow-x-auto no-scrollbar">
          {TOOLS.map(t => {
            const Icon = t.icon;
            const active = activeTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                  active
                    ? 'bg-[var(--theme-card)] text-[var(--theme-text)] shadow-lg translate-y-[-1px]'
                    : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'
                }`}
              >
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Active tool description */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--theme-text-muted)]">
          <Sparkles size={12} className="text-[var(--theme-accent)]" />
          {TOOLS.find(t => t.id === activeTool)?.desc}
        </div>

        {/* Help trigger — pushed to end */}
        <button
          onClick={onStartTutorial}
          className="sm:ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:border-[var(--theme-accent)] text-[10px] font-bold uppercase tracking-widest transition-all group shadow-sm"
        >
          <HelpCircle size={13} className="group-hover:rotate-12 transition-transform duration-300" />
          <span className="hidden sm:inline">Feature Tour</span>
          <span className="sm:hidden">Tour</span>
        </button>
      </div>

      {/* ── Tool Panel ── */}
      <div className="flex-1 min-h-0">
        {activeTool === 'atmosphere' && <WeatherView onStartTutorial={onStartTutorial} />}
        {activeTool === 'canvas'     && <DrawingCanvas />}
      </div>
    </div>
  );
}
