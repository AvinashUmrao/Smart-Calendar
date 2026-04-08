import { format, isSameDay } from 'date-fns';
import { CalendarEvent } from './NotesPanel';

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelectedStart: boolean;
  isSelectedEnd: boolean;
  isInRange: boolean;
  isHoveredRange: boolean;
  hasNote: boolean;
  isFocused: boolean;
  onClick: (date: Date) => void;
  onMouseEnter: (date: Date) => void;
}

export default function DayCell({
  date,
  isCurrentMonth,
  isToday,
  isSelectedStart,
  isSelectedEnd,
  isInRange,
  isHoveredRange,
  hasNote,
  isFocused,
  onClick,
  onMouseEnter,
}: DayCellProps) {
  const isSelected = isSelectedStart || isSelectedEnd;

  return (
    <button
      onClick={() => onClick(date)}
      onMouseEnter={() => onMouseEnter(date)}
      className={`
        relative h-16 md:h-20 lg:h-24 w-full flex items-start justify-end p-3 cursor-pointer
        transition-all duration-700 border-b border-r border-[var(--theme-border)] last:border-r-0
        group overflow-hidden
        ${isSelected ? 'z-20' : 'z-10 hover:z-20'}
        ${isSelected ? 'shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)]' : ''}
      `}
    >
      {/* Range Background */}
      {isInRange && (
        <div className={`absolute inset-y-2 inset-x-0 -z-20 bg-[var(--theme-range-bg)] transition-all duration-500
          ${isSelectedStart ? 'rounded-l-2xl ml-2' : ''}
          ${isSelectedEnd ? 'rounded-r-2xl mr-2' : ''}
          ${!isSelectedStart && !isSelectedEnd ? 'mx-0' : ''}
        `} />
      )}

      {/* Visual ring on focus */}
      {isFocused && (
        <div className="absolute inset-1 border-2 border-[var(--theme-accent)] rounded-xl ring-inset pointer-events-none z-30 opacity-30" />
      )}

      {/* Circle/Box marker for selected days */}
      {isSelected && (
        <div className="absolute inset-2 bg-[var(--theme-selection)] rounded-2xl -z-10 transition-all duration-500 animate-in zoom-in-75" />
      )}

      <div className={`
        relative z-10 flex flex-col items-center transition-all duration-700
        ${isSelected ? 'scale-110 font-bold' : 'group-hover:scale-110'}
        ${isSelected 
          ? 'text-[var(--theme-selection-text)]' 
          : isToday 
            ? 'text-[var(--theme-accent)]' 
            : !isCurrentMonth 
              ? 'opacity-20 text-[var(--theme-text)]' 
              : 'text-[var(--theme-text)]'}
      `}>
        <span className="text-sm md:text-lg tracking-tighter">{format(date, 'd')}</span>
        
        {/* Note indicator dot */}
        {hasNote && (
          <div
            className={`w-1.5 h-1.5 rounded-full mt-1.5 transition-all duration-300 ${
              isSelected ? 'bg-[var(--theme-selection-text)]' : 'bg-rose-500 shadow-sm'
            }`}
          />
        )}
      </div>

      {/* Today Marker */}
      {isToday && !isSelected && (
        <div className="absolute top-3 left-3 flex flex-col items-center">
           <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-accent)]" />
           <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--theme-text-muted)] mt-1">Today</span>
        </div>
      )}

      {/* Hover effect overlay layer with Scale */}
      {!isSelected && (
        <div className="absolute inset-2 rounded-2xl opacity-0 group-hover:opacity-100 bg-[var(--theme-accent)]/5 transition-all duration-300 scale-95 group-hover:scale-100 pointer-events-none border border-[var(--theme-border)]" />
      )}
    </button>
  );
}
