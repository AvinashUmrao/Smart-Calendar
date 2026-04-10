import React from 'react';

export type ViewMode = 'day' | 'month' | 'year' | 'week' | 'list' | 'focus' | 'extra';

interface ViewSwitcherProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export default function ViewSwitcher({ viewMode, setViewMode }: ViewSwitcherProps) {
  const primaryTabs: ViewMode[] = ['day', 'week', 'month', 'year', 'list', 'focus', 'extra'];

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm font-medium mt-4 lg:mt-0 mb-8 select-none view-switcher">
      <div className="flex bg-[var(--theme-accent-muted)] p-1 rounded-2xl border border-[var(--theme-border)] shadow-inner overflow-x-auto no-scrollbar">
        {primaryTabs.map((tab) => {
          const isActive = viewMode === tab;
          return (
            <button
              key={tab}
              onClick={() => setViewMode(tab)}
              className={`
                px-5 py-2 rounded-xl capitalize transition-all duration-500 relative text-xs font-bold tracking-wider
                ${isActive 
                  ? 'bg-[var(--theme-card)] text-[var(--theme-text)] shadow-[0_2px_10px_rgba(0,0,0,0.05)] translate-y-[-1px]' 
                  : 'text-[var(--theme-text-muted)] opacity-60 hover:opacity-100 hover:text-[var(--theme-text)]'
                }
              `}
            >
              {tab}
              {isActive && (
                 <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--theme-accent)] animate-in fade-in zoom-in" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
