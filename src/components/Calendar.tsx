'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addYears,
  subYears,
  setMonth,
  setYear,
  format,
  isWithinInterval,
  isBefore,
  subDays,
  addDays,
  subWeeks,
  addWeeks,
} from 'date-fns';
import { Hash } from 'lucide-react';
import Header from './Header';
import DayCell from './DayCell';
import NotesPanel, { CalendarEvent } from './NotesPanel';
import ImageBanner from './ImageBanner';
import ViewSwitcher, { ViewMode } from './ViewSwitcher';
import WeekView from './WeekView';
import DayView from './DayView';
import ListView from './ListView';
import YearView from './YearView';
import FocusView from './FocusView';
import ExtraFeatures from './ExtraFeatures';
import Onboarding from './Onboarding';

export type ThemeId = 'stone' | 'ocean' | 'forest' | 'royal' | 'sunset' | 'aurora';

interface ThemeConfig {
  id: ThemeId;
  name: string;
  class: string;
  preview: string;
}

const THEMES: ThemeConfig[] = [
  { id: 'stone', name: 'Classic', class: 'theme-stone', preview: 'bg-stone-500' },
  { id: 'ocean', name: 'Ocean', class: 'theme-ocean', preview: 'bg-blue-500' },
  { id: 'forest', name: 'Forest', class: 'theme-forest', preview: 'bg-green-500' },
  { id: 'royal', name: 'Royal', class: 'theme-royal', preview: 'bg-purple-500' },
  { id: 'sunset', name: 'Sunset', class: 'theme-sunset', preview: 'bg-gradient-to-r from-orange-400 to-rose-400' },
  { id: 'aurora', name: 'Aurora', class: 'theme-aurora', preview: 'bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 animate-gradient' },
];

export default function Calendar() {
  const [isClient, setIsClient] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [themeId, setThemeId] = useState<ThemeId>('stone');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Record<string, CalendarEvent[]>>({});
  
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [notifiedEvents, setNotifiedEvents] = useState<Set<string>>(new Set());
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Request notification permission
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const storedTheme = localStorage.getItem('theme-id') as ThemeId;
    if (storedTheme && THEMES.some(t => t.id === storedTheme)) {
      setThemeId(storedTheme);
    }

    const storedDark = localStorage.getItem('theme-dark');
    if (storedDark === 'false') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    try {
      const storedEvents = localStorage.getItem('calendar_events');
      if (storedEvents) {
        setEvents(JSON.parse(storedEvents));
      }
    } catch (e) {
      console.error('Failed to load events', e);
    }

    const tutorialDone = localStorage.getItem('tutorial_completed');
    if (!tutorialDone) {
      setTimeout(() => setShowOnboarding(true), 1500);
    }
  }, []);

  const handleTutorialClose = () => {
    setShowOnboarding(false);
    localStorage.setItem('tutorial_completed', 'true');
  };

  const startTutorial = () => {
    setShowOnboarding(true);
  };

  // Global Reminder Background Checker
  useEffect(() => {
    if (!isClient) return;

    const checkReminders = () => {
        const now = new Date();
        const todayKey = format(now, 'yyyy-MM-dd');
        const currentTime = format(now, 'HH:mm');
        const todaysEvents = events[todayKey] || [];

        todaysEvents.forEach(ev => {
            if (ev.time === currentTime && !notifiedEvents.has(ev.id)) {
                // Trigger notification
                if (Notification.permission === 'granted') {
                    new Notification(`Reminder: ${ev.title}`, {
                        body: ev.description || `Event starting at ${ev.time}`,
                        icon: '/favicon.ico'
                    });
                    
                    // Optional: Play a subtle sound
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    audio.play().catch(() => {});
                }
                
                setNotifiedEvents(prev => new Set(prev).add(ev.id));
            }
        });
    };

    const interval = setInterval(checkReminders, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [isClient, events, notifiedEvents]);

  const filteredEvents = useMemo(() => {
    if (selectedTags.length === 0) return events;
    const filtered: Record<string, CalendarEvent[]> = {};
    for (const date in events) {
      const dayEvents = events[date].filter(ev => 
        ev.tags?.some(tag => selectedTags.includes(tag))
      );
      if (dayEvents.length > 0) filtered[date] = dayEvents;
    }
    return filtered;
  }, [events, selectedTags]);

  const allUniqueTags = useMemo(() => {
    const tags = new Set<string>();
    for (const date in events) {
      events[date].forEach(ev => ev.tags?.forEach(tag => tags.add(tag)));
    }
    return Array.from(tags).sort();
  }, [events]);

  const handlePrev = () => {
    if (viewMode === 'month') setCurrentMonth(subMonths(currentMonth, 1));
    else if (viewMode === 'year') setCurrentMonth(subYears(currentMonth, 1));
    else if (viewMode === 'week') {
      const newDate = subWeeks(currentMonth, 1);
      setCurrentMonth(newDate);
    }
    else if (viewMode === 'day') {
      const newDate = subDays(currentMonth, 1);
      setCurrentMonth(newDate);
      setFocusedDate(newDate);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentMonth(addMonths(currentMonth, 1));
    else if (viewMode === 'year') setCurrentMonth(addYears(currentMonth, 1));
    else if (viewMode === 'week') {
      const newDate = addWeeks(currentMonth, 1);
      setCurrentMonth(newDate);
    }
    else if (viewMode === 'day') {
      const newDate = addDays(currentMonth, 1);
      setCurrentMonth(newDate);
      setFocusedDate(newDate);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setFocusedDate(today);
    setSelectedDate(today);
  };

  const handleSetMonth = (m: number) => setCurrentMonth(setMonth(currentMonth, m));
  const handleSetYear = (y: number) => setCurrentMonth(setYear(currentMonth, y));

  const toggleDarkMode = () => {
    const newVal = !isDarkMode;
    setIsDarkMode(newVal);
    localStorage.setItem('theme-dark', String(newVal));
    if (newVal) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const changeTheme = (id: ThemeId) => {
    setThemeId(id);
    localStorage.setItem('theme-id', id);
  };

  const handleDateClick = (date: Date) => {
    if (focusedDate && isSameDay(date, focusedDate)) {
      setFocusedDate(null);
    } else {
      setSelectedDate(date);
      setFocusedDate(date);
    }
  };

  const handleUpdateEvent = (date: Date, updatedEvent: CalendarEvent) => {
    const key = format(date, 'yyyy-MM-dd');
    const newEvents = { ...events };
    if (newEvents[key]) {
      newEvents[key] = newEvents[key].map(ev => ev.id === updatedEvent.id ? updatedEvent : ev);
    }
    setEvents(newEvents);
    localStorage.setItem('calendar_events', JSON.stringify(newEvents));
  };

  const handleDeleteEvent = (date: Date, eventId: string) => {
    const key = format(date, 'yyyy-MM-dd');
    const newEvents = { ...events };
    if (newEvents[key]) {
      newEvents[key] = newEvents[key].filter(ev => ev.id !== eventId);
      if (newEvents[key].length === 0) delete newEvents[key];
    }
    setEvents(newEvents);
    localStorage.setItem('calendar_events', JSON.stringify(newEvents));
  };

  const handleSaveEvent = (newEvent: CalendarEvent, targetStartDate: Date, targetEndDate: Date) => {
    const newEvents = { ...events };
    eachDayOfInterval({ start: targetStartDate, end: targetEndDate }).forEach(d => {
      const key = format(d, 'yyyy-MM-dd');
      newEvents[key] = [...(newEvents[key] || []), { ...newEvent, id: Math.random().toString(36).substr(2, 9) }];
    });
    setEvents(newEvents);
    localStorage.setItem('calendar_events', JSON.stringify(newEvents));
  };

  const handleExportData = () => {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) data[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendar_backup_${format(new Date(), 'yyyy_MM_dd')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSetRange = (start: Date | null, end: Date | null) => {
    setRangeStart(start);
    setRangeEnd(end);
    if (start) setCurrentMonth(start);
  };

  const handleResetApp = () => {
    localStorage.clear();
    window.location.reload();
  };


  if (!isClient) return <div className="min-h-screen" />;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDateToRender = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDateToRender = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: startDateToRender, end: endDateToRender });
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const focusedEvents = focusedDate ? filteredEvents[format(focusedDate, 'yyyy-MM-dd')] || [] : [];
  const targetDateForViews = focusedDate || currentMonth;
  const activeThemeObj = THEMES.find(t => t.id === themeId) || THEMES[0];

  return (
    <div className={`min-h-screen transition-all duration-700 font-sans selection:bg-[var(--theme-accent-muted)] ${activeThemeObj.class} bg-[var(--theme-bg)] flex flex-col items-center justify-start lg:justify-center p-0 lg:p-8 xl:p-12 overflow-x-hidden`}>
      
      <div className="w-full lg:w-[98vw] max-w-screen-2xl mx-auto bg-[var(--theme-card)] lg:rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] flex flex-col lg:flex-row border-y lg:border border-[var(--theme-border)] transition-all duration-700 overflow-visible lg:overflow-hidden">
        
        <ImageBanner currentMonth={currentMonth} />

        {/* Dynamic central grid with segmented spacing */}
        <div className="flex-1 flex flex-col p-5 sm:p-8 lg:p-14 transition-colors duration-300 min-h-[500px] border-b lg:border-b-0 lg:border-r border-[var(--theme-border)]">
          
          <Header
            currentDate={currentMonth}
            theme={isDarkMode ? 'dark' : 'light'}
            onPrev={handlePrev}
            onNext={handleNext}
            onToday={handleToday}
            onToggleTheme={toggleDarkMode}
            onSetMonth={handleSetMonth}
            onSetYear={handleSetYear}
            activeTheme={themeId}
            onThemeChange={changeTheme}
            themes={THEMES}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onSetRange={handleSetRange}
            onExport={handleExportData}
            onReset={handleResetApp}
          />

          <ViewSwitcher 
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          {allUniqueTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center gap-2 text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mr-2">
                 <Hash size={12} /> Filter Tags:
              </div>
              {allUniqueTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                    selectedTags.includes(tag) 
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-transparent shadow-md scale-105' 
                      : 'bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-400'
                  }`}
                >
                  #{tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button onClick={() => setSelectedTags([])} className="px-2.5 py-1 text-[10px] font-bold text-stone-400 hover:text-red-500 transition-colors underline underline-offset-4 decoration-stone-200">Clear</button>
              )}
            </div>
          )}

          <div className="flex-1 flex flex-col animate-in fade-in duration-700">
            {viewMode === 'month' && (
              <div className="flex-1">
                <div className="grid grid-cols-7 mb-6">
                  {weekDays.map((day) => (
                    <div key={day} className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--theme-text-muted)] opacity-60 text-center">
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{day.charAt(0)}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 border-t border-l border-[var(--theme-border)] bg-[var(--theme-card)] transition-all duration-700 rounded-2xl overflow-hidden shadow-inner calendar-grid">
                  {days.map((day) => {
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const hasNotes = !!filteredEvents[format(day, 'yyyy-MM-dd')]?.length;
                    const isFocused = focusedDate ? isSameDay(day, focusedDate) : false;
                    
                    const isRangeStart = rangeStart ? isSameDay(day, rangeStart) : false;
                    const isRangeEnd = rangeEnd ? isSameDay(day, rangeEnd) : false;
                    const isInRange = (rangeStart && rangeEnd) ? (isWithinInterval(day, { start: rangeStart, end: rangeEnd }) || isSameDay(day, rangeStart) || isSameDay(day, rangeEnd)) : false;

                    return (
                      <DayCell
                        key={day.toISOString()}
                        date={day}
                        isCurrentMonth={isSameMonth(day, currentMonth)}
                        isToday={isSameDay(day, new Date())}
                        isSelectedStart={isSelected || isRangeStart}
                        isSelectedEnd={isRangeEnd}
                        isInRange={isInRange}
                        isHoveredRange={false}
                        hasNote={hasNotes}
                        isFocused={isFocused}
                        onClick={handleDateClick}
                        onMouseEnter={() => {}}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === 'year' && (
              <YearView 
                currentDate={currentMonth}
                onSelectMonth={(m) => { setCurrentMonth(m); setViewMode('month'); }}
              />
            )}

            {viewMode === 'week' && (
              <WeekView 
                currentDate={targetDateForViews}
                startDate={selectedDate}
                endDate={null}
                hoverDate={null}
                focusedDate={focusedDate}
                events={filteredEvents}
                handleDateClick={handleDateClick}
                handleMouseEnter={() => {}}
              />
            )}

            {viewMode === 'day' && (
              <DayView 
                currentDate={targetDateForViews}
                events={filteredEvents}
              />
            )}

            {viewMode === 'list' && (
              <ListView events={filteredEvents} />
            )}

            {viewMode === 'focus' && (
              <FocusView events={events} />
            )}

            {viewMode === 'extra' && (
              <ExtraFeatures onStartTutorial={startTutorial} />
            )}
          </div>
        </div>

        {showOnboarding && (
          <Onboarding 
            onClose={handleTutorialClose} 
            setViewMode={setViewMode}
            setSelectedDate={setSelectedDate}
          />
        )}

        <NotesPanel
          date={focusedDate}
          gridStartDate={rangeStart}
          gridEndDate={rangeEnd}
          events={focusedEvents}
          onSaveEvent={handleSaveEvent}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
          onClose={() => setFocusedDate(null)}
        />
      </div>
    </div>
  );
}
