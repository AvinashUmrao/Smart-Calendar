'use client';

import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Plus, X, Trash2, Save, CodeXml, Layers, ListTodo, CheckCircle2, Circle } from 'lucide-react';

export type EventColor = 'stone' | 'blue' | 'green' | 'amber' | 'rose' | 'purple';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  description?: string;
  color?: EventColor;
  tags?: string[];
  codeSnippet?: string;
  codeLanguage?: string;
  todos?: TodoItem[];
}

interface NotesPanelProps {
  date: Date | null;
  gridStartDate: Date | null;
  gridEndDate: Date | null;
  events: CalendarEvent[];
  onSaveEvent: (event: CalendarEvent, targetStart: Date, targetEnd: Date) => void;
  onUpdateEvent: (date: Date, updatedEvent: CalendarEvent) => void;
  onDeleteEvent: (date: Date, eventId: string) => void;
  onClose: () => void;
}

const colorClassMap: Record<EventColor, { bg: string, border: string, text: string, accent: string }> = {
  stone: { bg: 'bg-stone-50/50 dark:bg-stone-800/50', border: 'border-stone-200 dark:border-stone-700', text: 'text-stone-700 dark:text-stone-300', accent: 'bg-stone-500' },
  blue: { bg: 'bg-blue-50/50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300', accent: 'bg-blue-500' },
  green: { bg: 'bg-green-50/50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300', accent: 'bg-green-500' },
  amber: { bg: 'bg-amber-50/50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', accent: 'bg-amber-500' },
  rose: { bg: 'bg-rose-50/50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300', accent: 'bg-rose-500' },
  purple: { bg: 'bg-purple-50/50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300', accent: 'bg-purple-500' },
};

export default function NotesPanel({
  date,
  gridStartDate,
  gridEndDate,
  events,
  onSaveEvent,
  onUpdateEvent,
  onDeleteEvent,
  onClose,
}: NotesPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTime, setNewTime] = useState('10:00');
  const [newColor, setNewColor] = useState<EventColor>('stone');
  const [newTags, setNewTags] = useState('');
  const [newCodeSnippet, setNewCodeSnippet] = useState('');
  const [newCodeLanguage, setNewCodeLanguage] = useState('javascript');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [applyToRange, setApplyToRange] = useState(true);

  // Todo State
  const [tempTodos, setTempTodos] = useState<string[]>([]);
  const [todoInput, setTodoInput] = useState('');

  useEffect(() => {
    if (gridStartDate && gridEndDate) {
      setApplyToRange(true);
    }
  }, [gridStartDate, gridEndDate]);

  if (!date) return null;

  const hasRange = gridStartDate && gridEndDate;

  const handleSave = () => {
    if (!newTitle.trim()) return;
    const targetStart = (applyToRange && gridStartDate) ? gridStartDate : date;
    const targetEnd = (applyToRange && gridEndDate) ? gridEndDate : date;
    
    const event: CalendarEvent = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTitle,
      time: newTime,
      description: newDescription,
      color: newColor,
      tags: newTags.split(',').map(t => t.trim()).filter(t => t !== ''),
      codeSnippet: showCodeInput && newCodeSnippet.trim() ? newCodeSnippet : undefined,
      codeLanguage: showCodeInput && newCodeSnippet.trim() ? newCodeLanguage : undefined,
      todos: tempTodos.map(t => ({ id: Math.random().toString(36).substr(2, 9), text: t, completed: false }))
    };
    
    onSaveEvent(event, targetStart, targetEnd);
    
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewTime('10:00');
    setNewColor('stone');
    setNewTags('');
    setNewCodeSnippet('');
    setShowCodeInput(false);
    setTempTodos([]);
    setTodoInput('');
  };

  const addTodo = () => {
    if (todoInput.trim()) {
      setTempTodos([...tempTodos, todoInput.trim()]);
      setTodoInput('');
    }
  };

  const toggleTodo = (event: CalendarEvent, todoId: string) => {
    const updatedTodos = event.todos?.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t);
    onUpdateEvent(date, { ...event, todos: updatedTodos });
  };

  const currentFormattedDate = format(date, 'EEEE, MMMM do');
  const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="w-full lg:w-[350px] shrink-0 min-h-[500px] lg:min-h-0 bg-[var(--theme-card)] border-t lg:border-t-0 lg:border-l border-[var(--theme-border)] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative z-20 transition-all duration-700">
      <div className="p-6 pb-4 border-b border-[var(--theme-border)] flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-xl font-medium tracking-tight text-[var(--theme-text)]">Daily Notes</h3>
          <p className="text-sm text-[var(--theme-text-muted)] mt-1">{currentFormattedDate}</p>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] transition-all bg-[var(--theme-accent-muted)] rounded-full"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {sortedEvents.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center p-8 mt-4 text-[var(--theme-text-muted)] opacity-50 italic text-center text-sm">
            No notes scheduled for today.
          </div>
        )}

        {sortedEvents.map(ev => {
          const colors = colorClassMap[ev.color || 'stone'];
          const completedCount = ev.todos?.filter(t => t.completed).length || 0;
          const totalCount = ev.todos?.length || 0;

          return (
            <div key={ev.id} className={`relative group ${colors.bg} rounded-xl p-4 pt-6 border ${colors.border} shadow-sm transition-all animate-in fade-in slide-in-from-right-4 duration-300`}>
              <button onClick={() => onDeleteEvent(date, ev.id)} className="absolute left-2 -top-2 p-1.5 text-stone-400 dark:text-stone-500 hover:text-rose-500 bg-[var(--theme-card)] border border-[var(--theme-border)] opacity-0 group-hover:opacity-100 transition-all shadow-md rounded-full z-10"><Trash2 size={12} /></button>
              
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold tracking-wider ${colors.text} opacity-70 uppercase`}>{ev.time}</span>
                {totalCount > 0 && (
                   <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${completedCount === totalCount ? 'bg-emerald-500/20 text-emerald-600' : 'bg-stone-500/10 text-stone-500'}`}>
                      {completedCount}/{totalCount} Done
                   </span>
                )}
              </div>
              <h4 className={`text-sm font-bold ${colors.text} leading-snug truncate`}>{ev.title}</h4>
              {ev.description && <p className={`text-xs mt-1 leading-relaxed opacity-80 ${colors.text} line-clamp-3`}>{ev.description}</p>}
              
              {/* To-Do Items Display */}
              {ev.todos && ev.todos.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-black/5 dark:border-white/10 pt-3">
                   {ev.todos.map(todo => (
                     <button 
                       key={todo.id} 
                       onClick={() => toggleTodo(ev, todo.id)}
                       className="flex items-center gap-2 w-full text-left group/todo"
                     >
                       {todo.completed 
                         ? <CheckCircle2 size={14} className="text-emerald-500" /> 
                         : <Circle size={14} className="text-stone-400 group-hover/todo:text-[var(--theme-accent)] transition-colors" />
                       }
                       <span className={`text-[11px] transition-all ${todo.completed ? 'line-through opacity-50 text-[var(--theme-text-muted)]' : 'text-[var(--theme-text)]'}`}>
                         {todo.text}
                       </span>
                     </button>
                   ))}
                </div>
              )}

              {ev.tags && ev.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                   {ev.tags.map(tag => <span key={tag} className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 ${colors.text}`}>#{tag}</span>)}
                </div>
              )}

              {ev.codeSnippet && (
                <div className="mt-3 bg-stone-950 rounded-lg p-2.5 font-mono text-[10px] text-stone-300 overflow-x-auto border border-stone-800">
                  <pre><code>{ev.codeSnippet}</code></pre>
                </div>
              )}
            </div>
          );
        })}

        {isAdding && (
          <div className="bg-[var(--theme-bg)] rounded-2xl p-4 border border-dashed border-[var(--theme-border)] mt-2 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-3">
              {hasRange && (
                <div className="p-3 bg-stone-900/5 dark:bg-white/5 rounded-xl border border-[var(--theme-border)] flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[var(--theme-selection)] text-[var(--theme-selection-text)] rounded-lg shadow-sm"><Layers size={14} /></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-[var(--theme-text)] uppercase tracking-tight">Apply to Range?</span>
                      <span className="text-[9px] text-[var(--theme-text-muted)] font-medium leading-none">{differenceInDays(gridEndDate!, gridStartDate!) + 1} days active</span>
                    </div>
                  </div>
                  <button onClick={() => setApplyToRange(!applyToRange)} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${applyToRange ? 'bg-[var(--theme-selection)]' : 'bg-stone-200 dark:bg-stone-800'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-stone-900 transition duration-200 ${applyToRange ? 'translate-x-4' : 'translate-x-0'}`} /></button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--theme-text)] outline-none focus:ring-1 ring-[var(--theme-accent)] w-[120px]" />
                <div className="flex-1 h-[1px] bg-[var(--theme-border)]" />
              </div>

              <input autoFocus placeholder="Title..." value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-lg px-3 py-2 text-sm text-[var(--theme-text)] focus:ring-1 ring-[var(--theme-accent)]" />

              {/* To-Do List Creator */}
              <div className="space-y-2">
                 <div className="flex items-center gap-2 px-1">
                    <ListTodo size={14} className="text-[var(--theme-text-muted)]" />
                    <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">Tasks</span>
                 </div>
                 <div className="flex gap-2">
                    <input 
                      placeholder="Add task..." 
                      value={todoInput}
                      onChange={e => setTodoInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addTodo()}
                      className="flex-1 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--theme-text)] focus:ring-1 ring-[var(--theme-accent)]"
                    />
                    <button onClick={addTodo} className="p-1.5 bg-[var(--theme-accent-muted)] text-[var(--theme-text)] rounded-lg hover:bg-[var(--theme-accent)]/20"><Plus size={16} /></button>
                 </div>
                 {tempTodos.length > 0 && (
                   <div className="flex flex-wrap gap-2 pt-1">
                      {tempTodos.map((t, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-stone-500/10 rounded-lg group/pill">
                           <span className="text-[10px] text-[var(--theme-text)]">{t}</span>
                           <button onClick={() => setTempTodos(tempTodos.filter((_, idx) => idx !== i))} className="text-stone-400 hover:text-rose-500"><X size={10} /></button>
                        </div>
                      ))}
                   </div>
                 )}
              </div>

              <div className="flex gap-2">
                <input placeholder="Tags (tag1, tag2)..." value={newTags} onChange={e => setNewTags(e.target.value)} className="flex-1 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-lg px-3 py-1.5 text-[11px] text-[var(--theme-text)] focus:ring-1 ring-[var(--theme-accent)]" />
                <button onClick={() => setShowCodeInput(!showCodeInput)} className={`p-1.5 rounded-lg border ${showCodeInput ? 'bg-[var(--theme-accent)] text-white' : 'bg-[var(--theme-card)] border-[var(--theme-border)] text-[var(--theme-text-muted)]'}`}><CodeXml size={14} /></button>
              </div>

              {showCodeInput && (
                <textarea value={newCodeSnippet} onChange={e => setNewCodeSnippet(e.target.value)} placeholder="Code snippet..." className="w-full bg-stone-950 text-stone-300 font-mono text-[11px] p-3 rounded-xl border border-stone-800 min-h-[80px]" />
              )}

              <textarea placeholder="Description..." value={newDescription} onChange={e => setNewDescription(e.target.value)} className="w-full bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-lg px-3 py-2 text-xs text-[var(--theme-text)] min-h-[60px]" />

              <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--theme-border)]">
                {(['stone', 'blue', 'green', 'amber', 'rose', 'purple'] as EventColor[]).map(c => (
                  <button key={c} onClick={() => setNewColor(c)} className={`w-6 h-6 rounded-full border-2 ${newColor === c ? 'border-[var(--theme-accent)] scale-110' : 'border-transparent'} ${colorClassMap[c].accent}`} />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button onClick={handleSave} className="flex-1 bg-[var(--theme-selection)] text-[var(--theme-selection-text)] px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"><Save size={14} /> Save Note</button>
              <button onClick={() => setIsAdding(false)} className="p-2 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] rounded-xl"><X size={16} /></button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[var(--theme-border)] bg-[var(--theme-accent-muted)] shrink-0">
        {!isAdding ? (
          <button onClick={() => setIsAdding(true)} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--theme-card)] hover:shadow-md border border-[var(--theme-border)] rounded-2xl text-sm font-bold text-[var(--theme-text)] transition-all flex items-center justify-center gap-2"><Plus size={18} /> Write a note</button>
        ) : (
          <div className="px-4 py-2 border border-[var(--theme-border)] rounded-2xl text-[10px] font-bold text-[var(--theme-text-muted)] flex flex-col items-center">
            <span>SCHEDULING FOR</span>
            <span className="text-[var(--theme-text)] text-xs">{format(date, 'MMM do')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
