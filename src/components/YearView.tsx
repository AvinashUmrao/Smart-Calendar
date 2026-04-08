import React from 'react';
import { 
  format, 
  startOfYear, 
  eachMonthOfInterval, 
  endOfYear, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  isSameDay,
  isSameMonth
} from 'date-fns';

interface YearViewProps {
  currentDate: Date;
  onSelectMonth: (month: Date) => void;
}

export default function YearView({ currentDate, onSelectMonth }: YearViewProps) {
  const yearStart = startOfYear(currentDate);
  const yearEnd = endOfYear(yearStart);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar transition-colors duration-300 animate-in fade-in zoom-in-95 duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 p-4">
        {months.map((month) => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(monthStart);
          const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
          const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
          const days = eachDayOfInterval({ start: startDate, end: endDate });
          const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

          return (
            <div 
              key={month.toISOString()} 
              className="flex flex-col group cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/30 p-2 rounded-xl transition-all"
              onClick={() => onSelectMonth(month)}
            >
              <h4 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-2 px-1 group-hover:text-stone-900 dark:group-hover:text-white">
                {format(month, 'MMMM')}
              </h4>
              
              <div className="grid grid-cols-7 mb-1">
                {weekDays.map((wd, i) => (
                  <div key={i} className="text-[10px] font-bold text-stone-400 text-center uppercase">
                    {wd}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-0.5">
                {days.map((day) => {
                  const isCurrentMonth = isSameMonth(day, month);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div 
                      key={day.toISOString()} 
                      className={`
                        text-[10px] h-6 flex items-center justify-center rounded-full
                        ${!isCurrentMonth ? 'text-stone-300 dark:text-stone-700' : 'text-stone-600 dark:text-stone-300'}
                        ${isToday ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold' : ''}
                      `}
                    >
                      {format(day, 'd')}
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
