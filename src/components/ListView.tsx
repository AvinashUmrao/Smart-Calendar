import { format, parseISO } from 'date-fns';
import { CalendarEvent } from './NotesPanel';

interface ListViewProps {
  events: Record<string, CalendarEvent[]>;
}

export default function ListView({ events }: ListViewProps) {
  // Aggregate all events
  const allEventEntries = Object.entries(events).filter(([_, dayEvents]) => dayEvents.length > 0);
  
  // Sort by date (key is YYYY-MM-DD)
  allEventEntries.sort(([dateA], [dateB]) => dateA.localeCompare(dateB));

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar transition-colors duration-300 animate-in fade-in slide-in-from-bottom-2 duration-300 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50/50 dark:bg-stone-900/50 p-4 md:p-8">
      {allEventEntries.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center p-8 text-stone-400 dark:text-stone-500">
          <p className="text-lg mb-2">No upcoming events.</p>
          <p className="text-sm italic">Click on a date in month or week view to schedule something.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          {allEventEntries.map(([dateKey, dayEvents]) => {
            const dateObj = parseISO(dateKey);
            const sortedDayEvents = [...dayEvents].sort((a, b) => a.time.localeCompare(b.time));

            return (
              <div key={dateKey} className="flex flex-col md:flex-row gap-4 md:gap-8 items-start relative">
                {/* Date Header Sidebar */}
                <div className="md:w-32 shrink-0 md:sticky md:top-0 md:pt-2">
                  <h4 className="text-2xl font-light text-stone-800 dark:text-stone-100">{format(dateObj, 'MMM d')}</h4>
                  <p className="text-sm font-semibold tracking-widest uppercase text-stone-400 dark:text-stone-500 mt-1">{format(dateObj, 'EEEE')}</p>
                </div>

                {/* Events list */}
                <div className="flex-1 flex flex-col gap-3 w-full">
                  {sortedDayEvents.map(ev => {
                    const accentColorMap: Record<string, string> = {
                      stone: 'bg-stone-500', blue: 'bg-blue-500', green: 'bg-green-500',
                      amber: 'bg-amber-500', rose: 'bg-rose-500', purple: 'bg-purple-500',
                    };
                    const colorBase = ev.color || 'stone';

                    return (
                      <div key={ev.id} className="bg-white dark:bg-stone-950 px-5 py-4 border border-stone-200 dark:border-stone-800 shadow-sm rounded-xl flex items-center justify-between group hover:border-stone-300 dark:hover:border-stone-600 transition-all hover:translate-x-1">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${accentColorMap[colorBase]}`} />
                             <p className="text-base font-semibold text-stone-700 dark:text-stone-200">{ev.title}</p>
                          </div>
                          {ev.tags && ev.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 ml-4">
                              {ev.tags.map(t => <span key={t} className="text-[10px] font-bold text-stone-400 dark:text-stone-500">#{t}</span>)}
                            </div>
                          )}
                        </div>
                        <span className="px-3 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-md text-xs font-bold tracking-wider">{ev.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
