import { format, isSameDay } from 'date-fns';
import { CalendarEvent } from './NotesPanel';
import { Clock } from 'lucide-react';

interface DayViewProps {
  currentDate: Date;
  events: Record<string, CalendarEvent[]>;
}

export default function DayView({ currentDate, events }: DayViewProps) {
  const currentFormatted = format(currentDate, 'yyyy-MM-dd');
  const dayEvents = events[currentFormatted] || [];
  const sortedEvents = [...dayEvents].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="flex-1 flex flex-col transition-colors duration-300 animate-in fade-in slide-in-from-bottom-2 duration-300 bg-stone-50/50 dark:bg-stone-900/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6 md:p-8">
      
      <div className="mb-8">
        <h3 className="text-4xl font-light tracking-tight text-stone-800 dark:text-stone-100">
          {format(currentDate, 'EEEE')}
        </h3>
        <p className="text-stone-500 dark:text-stone-400 font-medium mt-1 text-lg">
          {format(currentDate, 'MMMM do, yyyy')}
        </p>
        {isSameDay(currentDate, new Date()) && (
          <span className="inline-block mt-3 px-3 py-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold uppercase tracking-wider rounded-md">
            Today
          </span>
        )}
      </div>

      <div className="flex-1 bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-y-auto no-scrollbar relative min-h-[300px]">
        {/* Timeline background markings */}
        <div className="absolute top-0 left-0 bottom-0 w-16 md:w-20 border-r border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 z-0" />

        {sortedEvents.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 p-8">
            <p className="text-stone-400 dark:text-stone-500 italic text-center">Your day is entirely free.<br/>Use the panel to schedule events.</p>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col w-full px-2 py-4 gap-4">
            {sortedEvents.map((ev) => {
              const colorBase = ev.color || 'stone';
              const isDark = true; // Assuming dark mode for the specific background logic if needed
              
              const accentColorMap: Record<string, string> = {
                stone: 'bg-stone-500',
                blue: 'bg-blue-500',
                green: 'bg-green-500',
                amber: 'bg-amber-500',
                rose: 'bg-rose-500',
                purple: 'bg-purple-500',
              };

              return (
                <div key={ev.id} className="flex flex-row items-stretch gap-4 w-full group animate-in slide-in-from-left-2 duration-300">
                  <div className="w-12 md:w-20 shrink-0 flex flex-col items-end pt-5 opacity-60">
                    <span className="text-[10px] md:text-xs font-bold tracking-widest text-stone-500 dark:text-stone-400 uppercase">
                      {ev.time}
                    </span>
                  </div>
                  
                  <div className={`flex-1 bg-white dark:bg-stone-900/40 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-all border-l-4 border-y border-r border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm relative overflow-hidden`}
                       style={{ borderLeftColor: `var(--${colorBase}-500, ${accentColorMap[colorBase].replace('bg-', '')})` }}>
                    
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <div className="text-2xl mt-0.5">{ev.icon || '📝'}</div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                        <Clock size={10} className="text-stone-400" />
                        <span className="text-[10px] font-bold tracking-tight text-stone-500 dark:text-stone-400">{ev.time}</span>
                      </div>
                      
                      {ev.tags?.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-stone-900/5 dark:bg-white/5 text-[10px] font-bold text-stone-500 dark:text-stone-400 border border-transparent hover:border-stone-200 dark:hover:border-stone-700 transition-colors">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <h4 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2 leading-tight">
                      {ev.title}
                    </h4>
                    
                    {ev.description && (
                      <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4 max-w-2xl whitespace-pre-wrap">
                        {ev.description}
                      </p>
                    )}

                    {ev.codeSnippet && (
                      <div className="mt-4 bg-stone-950 rounded-lg p-4 font-mono text-xs overflow-x-auto border border-stone-800 group/code relative">
                        <div className="absolute top-2 right-2 text-[10px] uppercase tracking-widest text-stone-600 font-bold opacity-0 group-hover/code:opacity-100 transition-opacity">
                          {ev.codeLanguage || 'code'}
                        </div>
                        <pre className="text-stone-300">
                          <code>{ev.codeSnippet}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
