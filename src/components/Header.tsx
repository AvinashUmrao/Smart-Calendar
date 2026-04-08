import { format, getYear, getMonth, parseISO, isAfter } from 'date-fns';
import { ChevronLeft, ChevronRight, Sun, Moon, ChevronDown, Check, Palette, CalendarDays, X, AlertCircle, Trash2, Download } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  currentDate: Date;
  theme: 'light' | 'dark';
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onToggleTheme: () => void;
  onSetMonth: (m: number) => void;
  onSetYear: (y: number) => void;
  activeTheme: string;
  onThemeChange: (id: any) => void;
  themes: any[];
  rangeStart: Date | null;
  rangeEnd: Date | null;
  onSetRange: (start: Date | null, end: Date | null) => void;
  onExport?: () => void;
  onReset?: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Header({ 
  currentDate, 
  theme, 
  onPrev, 
  onNext, 
  onToday, 
  onToggleTheme,
  onSetMonth,
  onSetYear,
  activeTheme,
  onThemeChange,
  themes,
  rangeStart,
  rangeEnd,
  onSetRange,
  onExport,
  onReset
}: HeaderProps) {
  const years = Array.from({ length: 101 }, (_, i) => 2000 + i);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showRangePicker, setShowRangePicker] = useState(false);
  
  const [tempStart, setTempStart] = useState(rangeStart ? format(rangeStart, 'yyyy-MM-dd') : '');
  const [tempEnd, setTempEnd] = useState(rangeEnd ? format(rangeEnd, 'yyyy-MM-dd') : '');
  const [rangeError, setRangeError] = useState<string | null>(null);

  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (monthRef.current && !monthRef.current.contains(event.target as Node)) setShowMonthPicker(false);
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) setShowYearPicker(false);
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) setShowThemePicker(false);
      if (rangeRef.current && !rangeRef.current.contains(event.target as Node)) setShowRangePicker(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApplyRange = () => {
    if (!tempStart || !tempEnd) {
      setRangeError("Please select both dates");
      return;
    }
    let start = parseISO(tempStart);
    let end = parseISO(tempEnd);
    
    // Auto-swap if range is backwards
    if (isAfter(start, end)) {
      const temp = start;
      start = end;
      end = temp;
      setTempStart(format(start, 'yyyy-MM-dd'));
      setTempEnd(format(end, 'yyyy-MM-dd'));
    }

    setRangeError(null);
    onSetRange(start, end);
    setShowRangePicker(false);
  };

  const currentMonthIdx = getMonth(currentDate);
  const currentYear = getYear(currentDate);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-10 gap-6 relative z-50">
      <div className="flex flex-col select-none animate-in fade-in slide-in-from-left-4 duration-700">
        <div className="relative" ref={monthRef}>
          <button 
            onClick={() => setShowMonthPicker(!showMonthPicker)}
            className="group flex items-center gap-3 text-3xl sm:text-4xl lg:text-6xl font-light text-[var(--theme-text)] tracking-tighter hover:opacity-70 transition-all outline-none"
          >
            {format(currentDate, 'MMMM')}
            <ChevronDown size={24} className="text-[var(--theme-accent)] opacity-40 group-hover:opacity-100 transition-all duration-300" />
          </button>
          
          {showMonthPicker && (
            <div className="absolute top-16 left-0 w-56 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden z-[100]">
               <div className="max-h-[300px] overflow-y-auto no-scrollbar py-1">
                 {MONTHS.map((m, i) => (
                   <button
                     key={m}
                     onClick={() => { onSetMonth(i); setShowMonthPicker(false); }}
                     className={`w-full text-left px-4 py-3 text-sm rounded-xl flex items-center justify-between transition-colors
                       ${i === currentMonthIdx ? 'bg-[var(--theme-accent-muted)] text-[var(--theme-text)] font-bold' : 'text-[var(--theme-text-muted)] hover:bg-[var(--theme-accent-muted)]/50'}
                     `}
                   >
                     {m}
                     {i === currentMonthIdx && <Check size={14} />}
                   </button>
                 ))}
               </div>
            </div>
          )}
        </div>

        <div className="relative inline-block" ref={yearRef}>
          <button 
            onClick={() => setShowYearPicker(!showYearPicker)}
            className="group flex items-center gap-2 text-[var(--theme-text-muted)] font-bold tracking-[0.3em] uppercase text-xs sm:text-sm mt-1 hover:text-[var(--theme-text)] transition-all outline-none"
          >
            Year of {currentYear}
            <ChevronDown size={14} className="transition-all duration-300" />
          </button>

          {showYearPicker && (
            <div className="absolute top-8 left-0 w-40 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-300 z-[100]">
              <div className="max-h-[200px] overflow-y-auto no-scrollbar py-1">
                {years.map(y => (
                  <button
                    key={y}
                    onClick={() => { onSetYear(y); setShowYearPicker(false); }}
                    className={`w-full text-left px-4 py-2 text-xs rounded-lg flex items-center justify-between transition-colors
                      ${y === currentYear ? 'bg-[var(--theme-accent-muted)] text-[var(--theme-text)] font-bold' : 'text-[var(--theme-text-muted)] hover:bg-[var(--theme-accent-muted)]/50'}
                    `}
                  >
                    {y}
                    {y === currentYear && <Check size={12} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6 animate-in fade-in slide-in-from-right-4 duration-700">
        <div className="flex items-center gap-1 bg-[var(--theme-accent-muted)] p-1.5 rounded-2xl border border-[var(--theme-border)] shadow-inner transition-all">
          <button
            onClick={onPrev}
            className="p-2.5 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-card)] rounded-xl transition-all active:scale-90 shadow-none hover:shadow-sm"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          
          <button
            onClick={onToday}
            className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-card)] rounded-xl transition-all active:scale-95 hover:shadow-sm"
          >
            Today
          </button>

          <button
            onClick={onNext}
            className="p-2.5 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-card)] rounded-xl transition-all active:scale-90 shadow-none hover:shadow-sm"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="h-8 w-[1px] bg-[var(--theme-border)] hidden lg:block" />

        <div className="flex items-center gap-3">
           <div className="relative" ref={rangeRef}>
             <button
               onClick={() => setShowRangePicker(!showRangePicker)}
               className={`group flex items-center gap-2 px-4 py-3 rounded-2xl transition-all border ${showRangePicker || (rangeStart && rangeEnd) ? 'bg-[var(--theme-selection)] text-[var(--theme-selection-text)] border-transparent' : 'bg-[var(--theme-card)] border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] shadow-sm'}`}
             >
               <CalendarDays size={18} />
               <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">Range</span>
             </button>

             {showRangePicker && (
               <div className="absolute top-14 right-0 w-72 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl shadow-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-300 z-[110]">
                 <div className="flex items-center justify-between mb-4 text-[var(--theme-text-muted)]">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest">Date Range</h4>
                   <button onClick={() => setShowRangePicker(false)}><X size={14} /></button>
                 </div>
                 
                 <div className="space-y-4 text-[var(--theme-text)]">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase ml-1">From</label>
                     <input 
                       type="date" 
                       value={tempStart} 
                       onChange={e => setTempStart(e.target.value)}
                       className="w-full bg-[var(--theme-bg)] border-none rounded-xl px-3 py-2.5 text-xs focus:ring-1 ring-[var(--theme-accent)]"
                     />
                   </div>
                   
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase ml-1">To</label>
                     <input 
                       type="date" 
                       value={tempEnd} 
                       onChange={e => setTempEnd(e.target.value)}
                       className="w-full bg-[var(--theme-bg)] border-none rounded-xl px-3 py-2.5 text-xs focus:ring-1 ring-[var(--theme-accent)]"
                     />
                   </div>

                   {rangeError && (
                     <div className="flex items-center gap-2 text-[10px] font-bold text-rose-500 bg-rose-500/10 p-2 rounded-lg">
                       <AlertCircle size={12} />
                       {rangeError}
                     </div>
                   )}

                   <div className="flex gap-2 pt-2">
                     <button
                       onClick={handleApplyRange}
                       className="flex-1 bg-[var(--theme-selection)] text-[var(--theme-selection-text)] py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                     >
                       Apply
                     </button>
                     {(rangeStart || rangeEnd) && (
                       <button
                         onClick={() => { onSetRange(null, null); setTempStart(''); setTempEnd(''); }}
                         className="px-3 py-2.5 bg-[var(--theme-accent-muted)] text-[var(--theme-text-muted)] rounded-xl hover:text-rose-500 transition-all font-bold text-[10px] uppercase"
                       >
                         Clear
                       </button>
                     )}
                   </div>
                 </div>
               </div>
             )}
           </div>

           <div className="relative" ref={themeRef}>
             <button
               onClick={() => setShowThemePicker(!showThemePicker)}
               className={`p-3 rounded-2xl transition-all border ${showThemePicker ? 'bg-[var(--theme-selection)] text-[var(--theme-selection-text)] border-transparent' : 'bg-[var(--theme-card)] border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] shadow-sm'}`}
             >
               <Palette size={20} />
             </button>

             {showThemePicker && (
               <div className="absolute top-14 right-0 w-64 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-300 z-[110]">
                 
                 {/* Integrated Night Mode Button */}
                 <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--theme-border)]">
                   <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest px-1">Display Mode</span>
                   <button
                    onClick={onToggleTheme}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--theme-accent-muted)] text-[var(--theme-text)] rounded-xl transition-all hover:scale-105 active:scale-95 border border-[var(--theme-border)]"
                  >
                    {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
                    <span className="text-[10px] font-bold uppercase tracking-wider">{theme === 'light' ? 'Night' : 'Day'}</span>
                  </button>
                 </div>

                 <h4 className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest mb-3 px-1">Global Themes</h4>
                 <div className="grid grid-cols-2 gap-3">
                   {themes.map(t => (
                     <button
                       key={t.id}
                       onClick={() => { onThemeChange(t.id); setShowThemePicker(false); }}
                       className={`flex flex-col items-center gap-2 p-2.5 rounded-xl border transition-all ${activeTheme === t.id ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-muted)]' : 'border-transparent hover:bg-[var(--theme-accent-muted)]/50'}`}
                     >
                       <div className={`w-full h-10 rounded-lg ${t.preview} shadow-inner`} />
                       <span className="text-[10px] font-bold text-[var(--theme-text)]">{t.name}</span>
                     </button>
                   ))}
                 </div>

                 <div className="mt-6 pt-5 border-t border-[var(--theme-border)]">
                    <button
                      onClick={() => { onExport?.(); setShowThemePicker(false); }}
                      className="w-full flex items-center justify-between p-4 bg-[var(--theme-accent-muted)] rounded-2xl text-[var(--theme-accent)] hover:bg-[var(--theme-selection)] hover:text-[var(--theme-selection-text)] transition-all font-bold text-[10px] uppercase tracking-widest group shadow-sm active:scale-95"
                    >
                      <span>Backup & Export Data</span>
                      <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                    </button>
                  </div>

                  <button
                    onClick={() => { if(confirm('Wipe all data? This cannot be undone.')) onReset?.(); setShowThemePicker(false); }}
                    className="w-full flex items-center justify-between p-4 bg-rose-500/10 rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest group shadow-sm active:scale-95 mt-3"
                  >
                    <span>Clear All Local Data</span>
                    <Trash2 size={14} />
                  </button>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
