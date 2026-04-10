'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Target, Bell, Clock, Timer, CheckCircle2, HelpCircle, CalendarDays } from 'lucide-react';
import { format, addMinutes, differenceInSeconds, parseISO, isAfter } from 'date-fns';
import { CalendarEvent } from './NotesPanel';

interface FocusViewProps {
  events: Record<string, CalendarEvent[]>;
}

export default function FocusView({ events }: FocusViewProps) {
  // Pomodoro State with Persistence
  const [timeLeft, setTimeLeft] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pomodoro_time');
      return saved ? parseInt(saved, 10) : 25 * 60;
    }
    return 25 * 60;
  });
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pomodoro_mode');
      return (saved as 'focus' | 'break') || 'focus';
    }
    return 'focus';
  });
  const [sessionTotal, setSessionTotal] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pomodoro_total');
      return saved ? parseInt(saved, 10) : 25 * 60;
    }
    return 25 * 60;
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const adjustTime = (amount: number) => {
     const newTime = Math.max(0, timeLeft + amount);
     setTimeLeft(newTime);
     if (newTime > sessionTotal) setSessionTotal(newTime);
  };

  // Focus Stats with Persistence
  const [sessionsCompleted, setSessionsCompleted] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pomodoro_sessions');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // Sync state to localStorage
  useEffect(() => {
     localStorage.setItem('pomodoro_time', timeLeft.toString());
     localStorage.setItem('pomodoro_mode', mode);
     localStorage.setItem('pomodoro_total', sessionTotal.toString());
     localStorage.setItem('pomodoro_sessions', sessionsCompleted.toString());
  }, [timeLeft, mode, sessionTotal, sessionsCompleted]);

  // Tool Type State
  const [activeTool, setActiveTool] = useState<'pomodoro' | 'stopwatch'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('focus_tool') as 'pomodoro' | 'stopwatch') || 'pomodoro';
    }
    return 'pomodoro';
  });

  useEffect(() => {
    localStorage.setItem('focus_tool', activeTool);
  }, [activeTool]);

  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stopwatch_time');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [isStopwatchActive, setIsStopwatchActive] = useState(false);
  const stopwatchRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    localStorage.setItem('stopwatch_time', stopwatchTime.toString());
  }, [stopwatchTime]);

  useEffect(() => {
    if (isStopwatchActive) {
      stopwatchRef.current = setInterval(() => {
        setStopwatchTime((prev) => prev + 1);
      }, 1000);
    } else if (stopwatchRef.current) {
      clearInterval(stopwatchRef.current);
    }
    return () => {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
  }, [isStopwatchActive]);

  const toggleStopwatch = () => setIsStopwatchActive(!isStopwatchActive);
  const resetStopwatch = () => {
    setIsStopwatchActive(false);
    setStopwatchTime(0);
  };

  // Notification Permission
  useEffect(() => {
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerComplete();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    sound.play().catch(() => {});

    if (Notification.permission === 'granted') {
      new Notification(mode === 'focus' ? 'Focus Session Complete!' : 'Break Over!', {
        body: mode === 'focus' ? 'Time for a 5-minute break.' : 'Time to get back to work!',
      });
    }

    if (mode === 'focus') {
      setSessionsCompleted((prev) => prev + 1);
      setMode('break');
      const nextTime = 5 * 60;
      setTimeLeft(nextTime);
      setSessionTotal(nextTime);
    } else {
      setMode('focus');
      const nextTime = 25 * 60;
      setTimeLeft(nextTime);
      setSessionTotal(nextTime);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setMode('focus');
    const initialTime = 25 * 60;
    setTimeLeft(initialTime);
    setSessionTotal(initialTime);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatStopwatchTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString()}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Find Next Event Countdown
  const nextEvent = Object.entries(events)
    .flatMap(([date, dayEvents]) => dayEvents.map(e => ({ ...e, date })))
    .filter(e => {
        const eventTime = parseISO(`${e.date}T${e.time}`);
        return isAfter(eventTime, new Date());
    })
    .sort((a, b) => parseISO(`${a.date}T${a.time}`).getTime() - parseISO(`${b.date}T${b.time}`).getTime())[0];

  const [countdownToNext, setCountdownToNext] = useState<string>('--:--:--');

  useEffect(() => {
    if (!nextEvent) {
        setCountdownToNext('No upcoming events');
        return;
    }
    const interval = setInterval(() => {
        const now = new Date();
        const eventTime = parseISO(`${nextEvent.date}T${nextEvent.time}`);
        const diff = differenceInSeconds(eventTime, now);
        
        if (diff <= 0) {
            setCountdownToNext('Happening Now!');
            clearInterval(interval);
        } else {
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;
            setCountdownToNext(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }
    }, 1000);
    return () => clearInterval(interval);
  }, [nextEvent]);

  // Dynamic Browser Tab Title Update
  useEffect(() => {
    const defaultTitle = 'Wall Calendar';
    
    if (activeTool === 'pomodoro' && isActive) {
      const modeLabel = mode === 'focus' ? 'Focus Mode' : 'Break Time';
      document.title = `(${formatTime(timeLeft)}) ${modeLabel}`;
    } else if (activeTool === 'stopwatch' && isStopwatchActive) {
      document.title = `(${formatStopwatchTime(stopwatchTime)}) Stopwatch`;
    } else {
      document.title = defaultTitle;
    }

    // Cleanup: Restore title when component unmounts or timer stops
    return () => {
      document.title = defaultTitle;
    };
  }, [timeLeft, isActive, mode, stopwatchTime, isStopwatchActive, activeTool]);

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full p-4 lg:p-0 space-y-8 animate-in fade-in duration-1000">
      
      {/* Top Section: Hero Only (Sidebar Removed) */}
      <div className="flex flex-col gap-8">
        
        {/* Left: Pomodoro / Stopwatch Hero Card */}
        <div className={`w-full relative overflow-hidden rounded-[2.5rem] border border-[var(--theme-border)] p-12 lg:p-16 text-center transition-all duration-700 shadow-2xl flex flex-col items-center justify-start min-h-[500px] ${activeTool === 'pomodoro' && mode === 'break' ? 'bg-[var(--theme-accent-muted)]' : 'bg-[var(--theme-card)]'}`}>
          
          {/* Tool Switcher */}
          <div className="flex bg-stone-100/50 dark:bg-stone-900/50 p-1 rounded-2xl border border-[var(--theme-border)] shadow-inner mb-10 w-max mx-auto relative z-10 transition-colors">
             <button
                onClick={() => setActiveTool('pomodoro')}
                className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTool === 'pomodoro' ? 'bg-[var(--theme-card)] shadow-md text-[var(--theme-text)] border border-[var(--theme-border)]' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] border border-transparent'}`}
             >
                Pomodoro
             </button>
             <button
                onClick={() => setActiveTool('stopwatch')}
                className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTool === 'stopwatch' ? 'bg-[var(--theme-card)] shadow-md text-[var(--theme-text)] border border-[var(--theme-border)]' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] border border-transparent'}`}
             >
                Stopwatch
             </button>
          </div>

          {activeTool === 'pomodoro' && (
            <div className="w-full flex-1 flex flex-col items-center animate-in fade-in duration-500">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--theme-border)]">
                  <div 
                      className="h-full bg-[var(--theme-accent)] transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(var(--theme-accent-rgb),0.5)]"
                      style={{ width: `${(timeLeft / sessionTotal) * 100}%` }}
                  />
              </div>

              <div className="flex flex-col items-center gap-6 mt-2">
                <div className="p-4 bg-[var(--theme-accent-muted)] rounded-2xl text-[var(--theme-accent)] shadow-inner">
                  {mode === 'focus' ? <Target size={32} /> : <Coffee size={32} />}
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--theme-text-muted)]">
                      {mode === 'focus' ? 'Deep Work Session' : 'Short Break'}
                  </h3>
                  
                  <div className="flex items-center justify-center gap-4 sm:gap-8 w-full">
                    <button 
                      onClick={() => adjustTime(-300)}
                      className="p-3 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-accent-muted)] rounded-xl transition-all"
                    >
                      <span className="text-xs font-bold">-5m</span>
                    </button>

                    <div className="text-6xl sm:text-8xl lg:text-[9rem] font-light tracking-tighter text-[var(--theme-text)] tabular-nums transition-all leading-none border-transparent">
                        {formatTime(timeLeft)}
                    </div>

                    <button 
                      onClick={() => adjustTime(300)}
                      className="p-3 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-accent-muted)] rounded-xl transition-all"
                    >
                      <span className="text-xs font-bold">+5m</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleTimer}
                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all shadow-xl active:scale-95 ${isActive ? 'bg-[var(--theme-card)] text-[var(--theme-text)] border border-[var(--theme-border)] hover:bg-[var(--theme-accent-muted)]' : 'bg-[var(--theme-selection)] text-[var(--theme-selection-text)] hover:opacity-90'}`}
                  >
                    {isActive ? <Pause size={20} /> : <Play size={20} />}
                    {isActive ? 'Pause' : 'Start Focus'}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="p-4 rounded-2xl bg-[var(--theme-accent-muted)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] transition-all active:rotate-180 duration-500"
                  >
                    <RotateCcw size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTool === 'stopwatch' && (
            <div className="w-full flex-1 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
              <div className="flex flex-col items-center gap-6 mt-2">
                <div className="p-4 bg-[var(--theme-accent-muted)] rounded-2xl text-[var(--theme-accent)] shadow-inner">
                   <Clock size={32} />
                </div>

                <div className="space-y-4 w-full">
                   <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--theme-text-muted)]">
                       Elapsed Time
                   </h3>
                   <div className="flex items-center justify-center gap-4 sm:gap-8 w-full mb-2">
                      <div className="text-6xl sm:text-8xl lg:text-[9rem] font-light tracking-tighter text-[var(--theme-text)] tabular-nums transition-all leading-none border-transparent">
                          {formatStopwatchTime(stopwatchTime)}
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                      onClick={toggleStopwatch}
                      className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all shadow-xl active:scale-95 ${isStopwatchActive ? 'bg-[var(--theme-card)] text-[var(--theme-text)] border border-[var(--theme-border)] hover:bg-[var(--theme-accent-muted)]' : 'bg-[var(--theme-selection)] text-[var(--theme-selection-text)] hover:opacity-90'}`}
                    >
                      {isStopwatchActive ? <Pause size={20} /> : <Play size={20} />}
                      {isStopwatchActive ? 'Pause' : 'Start'}
                    </button>
                    <button
                      onClick={resetStopwatch}
                      className="p-4 rounded-2xl bg-[var(--theme-accent-muted)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] transition-all active:rotate-180 duration-500"
                    >
                      <RotateCcw size={20} />
                    </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Countdown Card */}
      <div className="bg-[var(--theme-card)] rounded-[2.5rem] border border-[var(--theme-border)] p-10 shadow-2xl relative overflow-hidden group">
         <div className="absolute right-0 top-0 w-32 h-32 bg-[var(--theme-accent-muted)] translate-x-16 -translate-y-16 rounded-full opacity-50 blur-3xl group-hover:bg-[var(--theme-accent)] transition-all duration-1000" />
         
         <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
                <div className="p-5 bg-amber-500/10 text-amber-500 rounded-[2rem] shadow-inner">
                   <Timer size={32} />
                </div>
                <div>
                   <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.4em] mb-1">Time to next event</h3>
                   {nextEvent ? (
                      <div>
                         <h4 className="text-2xl font-bold text-[var(--theme-text)]">{nextEvent.title}</h4>
                         <p className="text-xs text-[var(--theme-text-muted)] font-medium opacity-70">Scheduled for {format(parseISO(`${nextEvent.date}T${nextEvent.time}`), 'h:mm a')}</p>
                      </div>
                   ) : (
                      <h4 className="text-xl font-medium text-[var(--theme-text-muted)] italic">A waiting game...</h4>
                   )}
                </div>
            </div>

            <div className="w-full md:w-auto">
               <div className="text-5xl lg:text-7xl font-light tracking-tight text-[var(--theme-text)] tabular-nums bg-[var(--theme-accent-muted)] px-10 py-6 rounded-[2.5rem] text-center border border-[var(--theme-border)] shadow-inner min-w-[300px]">
                  {countdownToNext}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
