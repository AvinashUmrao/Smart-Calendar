import { eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isAfter, isBefore, format } from 'date-fns';
import DayCell from './DayCell';
import { CalendarEvent } from './NotesPanel';

interface WeekViewProps {
  currentDate: Date;
  startDate: Date | null;
  endDate: Date | null;
  hoverDate: Date | null;
  focusedDate: Date | null;
  events: Record<string, CalendarEvent[]>;
  handleDateClick: (date: Date) => void;
  handleMouseEnter: (date: Date) => void;
}

export default function WeekView({
  currentDate,
  startDate,
  endDate,
  hoverDate,
  focusedDate,
  events,
  handleDateClick,
  handleMouseEnter
}: WeekViewProps) {
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex-1 transition-colors duration-300 animate-in fade-in zoom-in-95 duration-200">
      <div className="grid grid-cols-7 mb-4">
        {weekDays.map((day) => (
          <div key={day} className="text-xs font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-400 text-center">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-t border-l border-stone-100 dark:border-stone-800/80 bg-white dark:bg-stone-900 transition-colors duration-300 rounded-bl-xl rounded-br-xl overflow-hidden">
        {days.map((day) => {
          const isSelectedStart = startDate ? isSameDay(day, startDate) : false;
          const isSelectedEnd = endDate ? isSameDay(day, endDate) : false;
          
          let isInRange = false;
          if (startDate && endDate) {
            isInRange = isAfter(day, startDate) && isBefore(day, endDate);
          }

          let isHoveredRange = false;
          if (startDate && !endDate && hoverDate) {
            if (isAfter(hoverDate, startDate)) {
              isHoveredRange = (isAfter(day, startDate) && isBefore(day, hoverDate)) || isSameDay(day, hoverDate);
            } else if (isBefore(hoverDate, startDate)) {
              isHoveredRange = (isBefore(day, startDate) && isAfter(day, hoverDate)) || isSameDay(day, hoverDate);
            }
          }

          const hasNotes = !!events[format(day, 'yyyy-MM-dd')]?.length;
          const isFocused = focusedDate ? isSameDay(day, focusedDate) : false;

          return (
            <div key={day.toISOString()} className="h-64 sm:h-80 md:h-96">
              <DayCell
                date={day}
                isCurrentMonth={true} 
                isToday={isSameDay(day, new Date())}
                isSelectedStart={isSelectedStart}
                isSelectedEnd={isSelectedEnd}
                isInRange={isInRange}
                isHoveredRange={isHoveredRange}
                hasNote={hasNotes}
                isFocused={isFocused}
                onClick={handleDateClick}
                onMouseEnter={handleMouseEnter}
              />
              <div className="w-full h-[calc(100%-4rem)] border-r border-b border-stone-100 dark:border-stone-800/80 p-1 md:p-2 overflow-y-auto no-scrollbar">
                {events[format(day, 'yyyy-MM-dd')]?.map(ev => {
                  const accentColorMap: Record<string, string> = {
                    stone: 'bg-stone-100 dark:bg-stone-800', 
                    blue: 'bg-blue-100 dark:bg-blue-900/40', 
                    green: 'bg-green-100 dark:bg-green-900/40',
                    amber: 'bg-amber-100 dark:bg-amber-900/40', 
                    rose: 'bg-rose-100 dark:bg-rose-900/40', 
                    purple: 'bg-purple-100 dark:bg-purple-900/40',
                  };
                  const colorBase = (ev as any).color || 'stone';

                  return (
                    <div key={ev.id} className={`text-[10px] sm:text-xs mb-1 px-1.5 py-1 ${accentColorMap[colorBase]} text-stone-700 dark:text-stone-200 rounded truncate leading-tight shadow-sm font-semibold border border-stone-200/50 dark:border-stone-700/50 transition-transform hover:scale-[1.02]`}>
                      <span className="opacity-70 mr-1 hidden lg:inline">{ev.time}</span>
                      {ev.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
