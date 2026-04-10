'use client';

import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import {
  Plus, X, Trash2, Save, CodeXml, Layers, ListTodo,
  CheckCircle2, Circle, Sparkles, Wand2, FileText,
  Loader2, ChevronRight, Zap, Clock, AlertTriangle, Tag
} from 'lucide-react';
import {
  extractTasks, suggestTitleVariants, suggestTags, summarizeNote,
  type ExtractedTask, type TagSuggestion, type TitleVariant, type SummaryResult
} from '@/lib/SmartAssist';

/* ─── Types ─────────────────────────────────────────────── */
export type EventColor = 'stone' | 'blue' | 'green' | 'amber' | 'rose' | 'purple';

export interface TodoItem { id: string; text: string; completed: boolean; }

export interface CalendarEvent {
  id: string; title: string; time: string;
  description?: string; color?: EventColor; icon?: string;
  tags?: string[]; codeSnippet?: string; codeLanguage?: string;
  todos?: TodoItem[];
}

interface NotesPanelProps {
  date: Date | null; gridStartDate: Date | null; gridEndDate: Date | null;
  events: CalendarEvent[];
  onSaveEvent: (e: CalendarEvent, s: Date, end: Date) => void;
  onUpdateEvent: (d: Date, e: CalendarEvent) => void;
  onDeleteEvent: (d: Date, id: string) => void;
  onClose: () => void;
}

const colorMap: Record<EventColor, { bg: string; border: string; text: string; accent: string }> = {
  stone:  { bg: 'bg-stone-50/50 dark:bg-stone-800/50',    border: 'border-stone-200 dark:border-stone-700',  text: 'text-stone-700 dark:text-stone-300',   accent: 'bg-stone-500'  },
  blue:   { bg: 'bg-blue-50/50 dark:bg-blue-900/20',      border: 'border-blue-200 dark:border-blue-800',    text: 'text-blue-700 dark:text-blue-300',     accent: 'bg-blue-500'   },
  green:  { bg: 'bg-green-50/50 dark:bg-green-900/20',    border: 'border-green-200 dark:border-green-800',  text: 'text-green-700 dark:text-green-300',   accent: 'bg-green-500'  },
  amber:  { bg: 'bg-amber-50/50 dark:bg-amber-900/20',    border: 'border-amber-200 dark:border-amber-800',  text: 'text-amber-700 dark:text-amber-300',   accent: 'bg-amber-500'  },
  rose:   { bg: 'bg-rose-50/50 dark:bg-rose-900/20',      border: 'border-rose-200 dark:border-rose-800',    text: 'text-rose-700 dark:text-rose-300',     accent: 'bg-rose-500'   },
  purple: { bg: 'bg-purple-50/50 dark:bg-purple-900/20',  border: 'border-purple-200 dark:border-purple-800',text: 'text-purple-700 dark:text-purple-300',  accent: 'bg-purple-500' },
};

const priorityStyle: Record<ExtractedTask['priority'], { label: string; cls: string; dot: string }> = {
  high:   { label: 'High',   cls: 'bg-rose-500/10 text-rose-500 border-rose-400/20',     dot: 'bg-rose-500'    },
  medium: { label: 'Medium', cls: 'bg-amber-500/10 text-amber-600 border-amber-400/20',  dot: 'bg-amber-500'   },
  low:    { label: 'Low',    cls: 'bg-stone-500/10 text-stone-500 border-stone-400/20',  dot: 'bg-stone-400'   },
};

function useDebounce<T>(value: T, ms: number): T {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return d;
}

/* ─── Thinking dots ─────────────────────────────────────── */
function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

/* ─── Priority badge ────────────────────────────────────── */
function PriorityBadge({ p }: { p: ExtractedTask['priority'] }) {
  const s = priorityStyle[p];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${s.cls}`}>
      <span className={`w-1 h-1 rounded-full flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

/* ─── Summray Modal ─────────────────────────────────────── */
function SummaryModal({ result, onClose }: { result: SummaryResult; onClose: () => void }) {
  const priorityColors = { high: 'text-rose-500 bg-rose-500/10', medium: 'text-amber-500 bg-amber-500/10', low: 'text-emerald-500 bg-emerald-500/10' };
  const priorityIcons  = { high: <AlertTriangle size={12} />, medium: <Zap size={12} />, low: <CheckCircle2 size={12} /> };

  return (
    <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-400 z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-[var(--theme-border)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-lg">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--theme-text)]">AI Note Summary</h3>
              <p className="text-[9px] text-violet-400 uppercase tracking-[0.15em] font-bold">Smart Assist · Client AI</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--theme-text-muted)] hover:bg-[var(--theme-accent-muted)] transition-all">
            <X size={15} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Headline */}
          <div className="bg-gradient-to-br from-violet-500/8 to-purple-500/5 border border-violet-400/15 rounded-2xl p-4">
            <p className="text-[9px] font-bold text-violet-400 uppercase tracking-widest mb-1">📌 Headline</p>
            <p className="text-sm font-bold text-[var(--theme-text)] leading-snug">{result.headline}</p>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${priorityColors[result.priority]}`}>
              {priorityIcons[result.priority]} {result.priority} priority
            </span>
            {result.estimatedTime && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-[var(--theme-accent-muted)] text-[var(--theme-text-muted)]">
                <Clock size={10} /> ~{result.estimatedTime}
              </span>
            )}
          </div>

          {/* Key points */}
          {result.keyPoints.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">Key Points</p>
              <div className="space-y-1.5">
                {result.keyPoints.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-[var(--theme-text)]">
                    <ChevronRight size={11} className="text-violet-400 mt-0.5 flex-shrink-0" />
                    {pt}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task summary */}
          {result.taskSummary && (
            <div className="bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl p-3.5">
              <p className="text-[9px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest mb-1.5">✅ Tasks</p>
              <p className="text-xs text-[var(--theme-text)] leading-relaxed">{result.taskSummary}</p>
            </div>
          )}

          {!result.taskSummary && result.keyPoints.length === 0 && (
            <p className="text-xs text-[var(--theme-text-muted)] italic text-center py-2">Add a description or tasks to get richer insights.</p>
          )}
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose}
            className="w-full py-3 bg-[var(--theme-selection)] text-[var(--theme-selection-text)] rounded-2xl text-[10px] font-bold uppercase tracking-[0.15em] hover:opacity-90 active:scale-[0.98] transition-all shadow-md">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Smart Assist Panel (the main AI section) ─────────── */
interface SmartPanelProps {
  tasks: ExtractedTask[];
  tags: TagSuggestion[];
  titleVariants: TitleVariant[];
  thinking: boolean;
  acceptedTaskIndices: Set<number>;
  appliedTags: Set<string>;
  onAcceptTask: (i: number) => void;
  onDismissTask: (i: number) => void;
  onAcceptAllTasks: () => void;
  onAcceptTag: (t: TagSuggestion) => void;
  onAcceptTitle: (t: TitleVariant) => void;
  onSummarize: () => void;
  summarizing: boolean;
  hasContent: boolean;
}

function SmartPanel({
  tasks, tags, titleVariants, thinking,
  acceptedTaskIndices, appliedTags,
  onAcceptTask, onDismissTask, onAcceptAllTasks,
  onAcceptTag, onAcceptTitle,
  onSummarize, summarizing, hasContent
}: SmartPanelProps) {

  const pendingTasks = tasks.filter((_, i) => !acceptedTaskIndices.has(i));
  const hasAnything = pendingTasks.length > 0 || tags.length > 0 || titleVariants.length > 0;

  if (!hasContent) return null;

  return (
    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/5 to-purple-500/3 overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-violet-400/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow">
            <Sparkles size={11} className="text-white" />
          </div>
          <span className="text-[10px] font-black text-violet-500 uppercase tracking-[0.15em]">Smart Assist</span>
          {thinking && <ThinkingDots />}
        </div>
        <button
          onClick={onSummarize}
          disabled={summarizing || !hasContent}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 hover:bg-violet-500/20 border border-violet-400/20 text-violet-500 text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 active:scale-95"
        >
          {summarizing ? <Loader2 size={10} className="animate-spin" /> : <FileText size={10} />}
          Summarize
        </button>
      </div>

      <div className="p-3 space-y-4">
        {/* ── Title Variants ── */}
        {titleVariants.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-0.5">
              <Wand2 size={10} className="text-violet-400" />
              <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">Suggested Titles</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {titleVariants.map((v, i) => (
                <button key={i} onClick={() => onAcceptTitle(v)}
                  className="flex items-center justify-between gap-2 px-3 py-2.5 bg-[var(--theme-card)] hover:bg-violet-500/8 border border-[var(--theme-border)] hover:border-violet-400/30 rounded-xl text-left group transition-all active:scale-[0.98]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider flex-shrink-0 ${
                      v.style === 'concise' ? 'bg-sky-500/10 text-sky-500'
                      : v.style === 'action' ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {v.style}
                    </span>
                    <span className="text-[11px] font-semibold text-[var(--theme-text)] truncate">{v.text}</span>
                  </div>
                  <ChevronRight size={12} className="text-[var(--theme-text-muted)] group-hover:text-violet-500 flex-shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Extracted Tasks ── */}
        {pendingTasks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5">
                <ListTodo size={10} className="text-violet-400" />
                <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">
                  {pendingTasks.length} Task{pendingTasks.length !== 1 ? 's' : ''} Detected
                </span>
              </div>
              {pendingTasks.length > 1 && (
                <button onClick={onAcceptAllTasks}
                  className="text-[9px] font-black text-violet-500 hover:text-violet-400 uppercase tracking-wider transition-colors">
                  + Add All
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              {tasks.map((task, i) => {
                const accepted = acceptedTaskIndices.has(i);
                if (accepted) return null;
                return (
                  <div key={i}
                    className="flex items-center gap-2 px-3 py-2.5 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl group transition-all hover:border-violet-400/20 hover:shadow-sm animate-in slide-in-from-left-2 duration-300"
                  >
                    <Circle size={10} className="text-[var(--theme-text-muted)] flex-shrink-0" />
                    <span className="text-[10px] text-[var(--theme-text)] flex-1 leading-snug">{task.text}</span>
                    <PriorityBadge p={task.priority} />
                    {/* Accept */}
                    <button onClick={() => onAcceptTask(i)}
                      className="w-6 h-6 rounded-full flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-400/20 transition-all flex-shrink-0 active:scale-90"
                      title="Add this task">
                      <Plus size={11} />
                    </button>
                    {/* Dismiss */}
                    <button onClick={() => onDismissTask(i)}
                      className="w-6 h-6 rounded-full flex items-center justify-center bg-stone-400/10 hover:bg-stone-400/20 text-stone-400 border border-stone-400/10 transition-all flex-shrink-0 active:scale-90"
                      title="Dismiss">
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tag Suggestions ── */}
        {tags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-0.5">
              <Tag size={10} className="text-violet-400" />
              <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">Smart Tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tg, i) => {
                const applied = appliedTags.has(tg.tag);
                return (
                  <button key={i} onClick={() => !applied && onAcceptTag(tg)}
                    disabled={applied}
                    title={tg.reason}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                      applied
                        ? 'bg-violet-500/20 text-violet-500 border-violet-400/30 opacity-70 cursor-default'
                        : 'bg-[var(--theme-card)] text-[var(--theme-text)] border-[var(--theme-border)] hover:border-violet-400/30 hover:bg-violet-500/8 hover:text-violet-500 active:scale-95'
                    }`}>
                    {applied
                      ? <CheckCircle2 size={10} className="text-violet-500" />
                      : <span className={`w-1.5 h-1.5 rounded-full ${tg.confidence === 'high' ? 'bg-violet-500' : 'bg-stone-400'}`} />
                    }
                    #{tg.tag}
                    {tg.confidence === 'high' && !applied && (
                      <span className="text-[7px] font-black bg-violet-500/15 text-violet-500 px-1 rounded">✦</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[8px] text-[var(--theme-text-muted)] px-0.5">
              ✦ high confidence · Click to apply individually
            </p>
          </div>
        )}

        {/* Empty state */}
        {!thinking && !hasAnything && hasContent && (
          <p className="text-[10px] text-[var(--theme-text-muted)] text-center py-1 italic">
            No suggestions yet. Keep typing…
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function NotesPanel({
  date, gridStartDate, gridEndDate,
  events, onSaveEvent, onUpdateEvent, onDeleteEvent, onClose,
}: NotesPanelProps) {

  /* ── Form state ── */
  const [isAdding,        setIsAdding]        = useState(false);
  const [newTitle,        setNewTitle]        = useState('');
  const [newDescription,  setNewDescription]  = useState('');
  const [newTime,         setNewTime]         = useState('10:00');
  const [newColor,        setNewColor]        = useState<EventColor>('stone');
  const [newTags,         setNewTags]         = useState('');
  const [newCodeSnippet,  setNewCodeSnippet]  = useState('');
  const [showCodeInput,   setShowCodeInput]   = useState(false);
  const [applyToRange,    setApplyToRange]    = useState(true);
  const [tempTodos,       setTempTodos]       = useState<string[]>([]);
  const [todoInput,       setTodoInput]       = useState('');

  /* ── AI state ── */
  const [aiThinking,        setAiThinking]        = useState(false);
  const [extractedTasks,    setExtractedTasks]    = useState<ExtractedTask[]>([]);
  const [titleVariants,     setTitleVariants]     = useState<TitleVariant[]>([]);
  const [tagSuggestions,    setTagSuggestions]    = useState<TagSuggestion[]>([]);
  const [acceptedTaskIdxs,  setAcceptedTaskIdxs]  = useState<Set<number>>(new Set());
  const [appliedTags,       setAppliedTags]       = useState<Set<string>>(new Set());
  const [summaryModal,      setSummaryModal]      = useState<SummaryResult | null>(null);
  const [summarizing,       setSummarizing]       = useState(false);

  /* Debounce */
  const debouncedDesc  = useDebounce(newDescription, 550);
  const debouncedTitle = useDebounce(newTitle, 350);

  /* ── Run AI engine whenever debounced desc changes ── */
  useEffect(() => {
    if (!debouncedDesc && !debouncedTitle) {
      setExtractedTasks([]); setTitleVariants([]); setTagSuggestions([]);
      setAiThinking(false); return;
    }
    setAiThinking(true);

    // Small fake "thinking" delay for polish
    const t = setTimeout(() => {
      const tasks   = extractTasks(debouncedDesc);
      const titles  = debouncedTitle ? [] : suggestTitleVariants(debouncedDesc, tasks);
      const tags    = suggestTags(`${debouncedTitle} ${debouncedDesc}`);

      setExtractedTasks(tasks);
      setTitleVariants(titles);
      setTagSuggestions(tags);
      setAcceptedTaskIdxs(new Set()); // reset on new parse
      setAiThinking(false);
    }, 200);

    return () => clearTimeout(t);
  }, [debouncedDesc, debouncedTitle]);

  useEffect(() => {
    if (gridStartDate && gridEndDate) setApplyToRange(true);
  }, [gridStartDate, gridEndDate]);

  if (!date) return null;

  const hasRange   = gridStartDate && gridEndDate;
  const hasContent = !!(debouncedDesc || debouncedTitle);

  /* ── Task actions ── */
  const acceptTask = (i: number) => {
    const task = extractedTasks[i];
    if (!task || tempTodos.includes(task.text)) return;
    setTempTodos(p => [...p, task.text]);
    setAcceptedTaskIdxs(p => new Set([...p, i]));
  };

  const dismissTask = (i: number) => {
    setAcceptedTaskIdxs(p => new Set([...p, i])); // mark as dismissed
  };

  const acceptAllTasks = () => {
    const toAdd = extractedTasks
      .filter((_, i) => !acceptedTaskIdxs.has(i))
      .map(t => t.text)
      .filter(t => !tempTodos.includes(t));
    setTempTodos(p => [...p, ...toAdd]);
    setAcceptedTaskIdxs(new Set(extractedTasks.map((_, i) => i)));
  };

  /* ── Tag actions ── */
  const acceptTag = (tg: TagSuggestion) => {
    const existingTags = newTags.split(',').map(t => t.trim()).filter(Boolean);
    if (!existingTags.includes(tg.tag)) {
      setNewTags([...existingTags, tg.tag].join(', '));
    }
    setAppliedTags(p => new Set([...p, tg.tag]));
  };

  /* ── Title action ── */
  const acceptTitle = (v: TitleVariant) => {
    setNewTitle(v.text);
    setTitleVariants([]);
  };

  /* ── Summarize ── */
  const handleSummarize = () => {
    setSummarizing(true);
    setTimeout(() => {
      const result = summarizeNote(newTitle, newDescription, tempTodos);
      setSummaryModal(result);
      setSummarizing(false);
    }, 600);
  };

  /* ── Save ── */
  const handleSave = () => {
    if (!newTitle.trim()) return;
    const s = (applyToRange && gridStartDate) ? gridStartDate : date;
    const e = (applyToRange && gridEndDate)   ? gridEndDate   : date;

    onSaveEvent({
      id: Math.random().toString(36).substr(2, 9),
      title: newTitle, time: newTime, description: newDescription, color: newColor,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      codeSnippet:  showCodeInput && newCodeSnippet.trim() ? newCodeSnippet : undefined,
      codeLanguage: showCodeInput && newCodeSnippet.trim() ? 'javascript'   : undefined,
      todos: tempTodos.map(t => ({ id: Math.random().toString(36).substr(2, 9), text: t, completed: false })),
    }, s, e);

    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setNewTitle(''); setNewDescription(''); setNewTime('10:00'); setNewColor('stone');
    setNewTags(''); setNewCodeSnippet(''); setShowCodeInput(false);
    setTempTodos([]); setTodoInput('');
    setExtractedTasks([]); setTitleVariants([]); setTagSuggestions([]);
    setAcceptedTaskIdxs(new Set()); setAppliedTags(new Set());
  };

  const addTodo = () => { if (todoInput.trim()) { setTempTodos(p => [...p, todoInput.trim()]); setTodoInput(''); } };
  const toggleTodo = (ev: CalendarEvent, id: string) => {
    onUpdateEvent(date, { ...ev, todos: ev.todos?.map(t => t.id === id ? { ...t, completed: !t.completed } : t) });
  };

  const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <>
      {summaryModal && <SummaryModal result={summaryModal} onClose={() => setSummaryModal(null)} />}

      {/* Mobile backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

      <div className={`
        fixed inset-x-0 bottom-0 z-50 h-[88vh] bg-[var(--theme-card)] rounded-t-3xl flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.25)] overflow-hidden
        lg:static lg:w-[370px] lg:h-auto lg:shrink-0 lg:rounded-none lg:shadow-none lg:border-t-0 lg:border-l border-[var(--theme-border)]
        animate-in slide-in-from-bottom-full duration-500 lg:animate-none
      `}>

        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-[var(--theme-border)] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[var(--theme-text)]">Daily Notes</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-400/20 text-[8px] font-black text-violet-500 uppercase tracking-[0.12em]">
                <Sparkles size={7} /> AI
              </span>
            </div>
            <p className="text-[10px] text-[var(--theme-text-muted)] mt-0.5">{format(date, 'EEEE, MMM do')}</p>
          </div>
          <button onClick={onClose} className="lg:hidden w-8 h-8 flex items-center justify-center text-[var(--theme-text-muted)] bg-[var(--theme-accent-muted)] rounded-full transition-all hover:text-[var(--theme-text)]">
            <X size={16} />
          </button>
        </div>

        {/* ── Events list ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {sortedEvents.length === 0 && !isAdding && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-40">
              <FileText size={28} className="text-[var(--theme-text-muted)]" />
              <p className="text-xs text-[var(--theme-text-muted)] italic">No notes for today.</p>
            </div>
          )}

          {sortedEvents.map(ev => {
            const c = colorMap[ev.color || 'stone'];
            const done  = ev.todos?.filter(t => t.completed).length || 0;
            const total = ev.todos?.length || 0;
            return (
              <div key={ev.id}
                className={`relative group ${c.bg} rounded-2xl p-4 pt-5 border ${c.border} shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-right-4 duration-300`}>
                {/* Delete */}
                <button onClick={() => onDeleteEvent(date, ev.id)}
                  className="absolute left-2 -top-2 p-1.5 text-stone-400 hover:text-rose-500 bg-[var(--theme-card)] border border-[var(--theme-border)] opacity-0 group-hover:opacity-100 shadow-md rounded-full transition-all z-10">
                  <Trash2 size={10} />
                </button>
                {/* AI Summarize */}
                <button onClick={() => setSummaryModal(summarizeNote(ev.title, ev.description || '', ev.todos?.map(t => t.text) || []))}
                  className="absolute right-2 -top-2 p-1.5 bg-violet-500 text-white opacity-0 group-hover:opacity-100 shadow-md rounded-full transition-all z-10 hover:bg-violet-600 active:scale-90">
                  <Sparkles size={10} />
                </button>

                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold ${c.text} opacity-70 uppercase tracking-wider`}>{ev.time}</span>
                  {total > 0 && (
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${done === total ? 'bg-emerald-500/20 text-emerald-600' : 'bg-stone-500/10 text-stone-500'}`}>
                      {done}/{total}
                    </span>
                  )}
                </div>
                <h4 className={`text-sm font-bold ${c.text} leading-snug truncate`}>{ev.title}</h4>
                {ev.description && <p className={`text-[11px] mt-1 leading-relaxed opacity-75 ${c.text} line-clamp-2`}>{ev.description}</p>}

                {ev.todos && ev.todos.length > 0 && (
                  <div className="mt-2.5 space-y-1.5 border-t border-black/5 dark:border-white/5 pt-2.5">
                    {ev.todos.map(t => (
                      <button key={t.id} onClick={() => toggleTodo(ev, t.id)} className="flex items-center gap-2 w-full text-left group/todo">
                        {t.completed
                          ? <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                          : <Circle size={13} className="text-stone-400 group-hover/todo:text-[var(--theme-accent)] transition-colors flex-shrink-0" />
                        }
                        <span className={`text-[10px] transition-all ${t.completed ? 'line-through opacity-40 text-[var(--theme-text-muted)]' : 'text-[var(--theme-text)]'}`}>{t.text}</span>
                      </button>
                    ))}
                  </div>
                )}

                {ev.tags && ev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {ev.tags.map(tag => <span key={tag} className={`text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 ${c.text}`}>#{tag}</span>)}
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

          {/* ── Add Form ── */}
          {isAdding && (
            <div className="rounded-2xl border border-dashed border-[var(--theme-border)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 space-y-3.5 bg-[var(--theme-bg)]">

                {/* Range toggle */}
                {hasRange && (
                  <div className="flex items-center justify-between p-3 bg-[var(--theme-card)] rounded-xl border border-[var(--theme-border)]">
                    <div className="flex items-center gap-2">
                      <Layers size={13} className="text-[var(--theme-text-muted)]" />
                      <div>
                        <p className="text-[10px] font-bold text-[var(--theme-text)] uppercase tracking-tight">Apply to Range?</p>
                        <p className="text-[9px] text-[var(--theme-text-muted)]">{differenceInDays(gridEndDate!, gridStartDate!) + 1} days</p>
                      </div>
                    </div>
                    <button onClick={() => setApplyToRange(p => !p)}
                      className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors ${applyToRange ? 'bg-[var(--theme-selection)]' : 'bg-stone-200 dark:bg-stone-700'}`}>
                      <span className={`h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${applyToRange ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                )}

                {/* Time */}
                <div className="flex items-center gap-2">
                  <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                    className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--theme-text)] outline-none focus:ring-1 ring-[var(--theme-accent)] w-[115px]" />
                  <div className="flex-1 h-px bg-[var(--theme-border)]" />
                </div>

                {/* Description (AI reads this) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-0.5">
                    <label className="text-[9px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">Notes / Smart Input</label>
                    <span className="text-[8px] text-violet-400 flex items-center gap-0.5 font-bold">
                      <Sparkles size={8} /> AI reads as you type
                    </span>
                  </div>
                  <textarea
                    autoFocus
                    placeholder={'e.g. "Prepare PPT, revise DBMS, submit assignment by tonight"\n\nOr use bullet points:\n- Buy groceries\n- Call doctor'}
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    className="w-full bg-[var(--theme-card)] border border-[var(--theme-border)] focus:border-violet-400/40 rounded-xl px-3 py-2.5 text-xs text-[var(--theme-text)] min-h-[90px] resize-none focus:ring-1 ring-violet-400/30 transition-all leading-relaxed placeholder:text-[var(--theme-text-muted)] placeholder:opacity-50"
                  />
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest px-0.5">Title</label>
                  <input
                    placeholder="Title…"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-sm text-[var(--theme-text)] focus:ring-1 ring-[var(--theme-accent)] transition-all"
                  />
                </div>

                {/* ── SMART ASSIST PANEL ── */}
                <SmartPanel
                  tasks={extractedTasks}
                  tags={tagSuggestions}
                  titleVariants={titleVariants}
                  thinking={aiThinking}
                  acceptedTaskIndices={acceptedTaskIdxs}
                  appliedTags={appliedTags}
                  onAcceptTask={acceptTask}
                  onDismissTask={dismissTask}
                  onAcceptAllTasks={acceptAllTasks}
                  onAcceptTag={acceptTag}
                  onAcceptTitle={acceptTitle}
                  onSummarize={handleSummarize}
                  summarizing={summarizing}
                  hasContent={hasContent}
                />

                {/* To-do */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 px-0.5">
                    <ListTodo size={12} className="text-[var(--theme-text-muted)]" />
                    <span className="text-[9px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">Tasks</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      placeholder="Add a task, hit Enter…"
                      value={todoInput}
                      onChange={e => setTodoInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addTodo()}
                      className="flex-1 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text)] focus:ring-1 ring-[var(--theme-accent)] transition-all"
                    />
                    <button onClick={addTodo} className="p-2 bg-[var(--theme-accent-muted)] text-[var(--theme-text)] rounded-xl hover:bg-[var(--theme-accent)]/20 active:scale-95 transition-all">
                      <Plus size={15} />
                    </button>
                  </div>
                  {tempTodos.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tempTodos.map((t, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-500/10 rounded-lg">
                          <CheckCircle2 size={10} className="text-emerald-400 flex-shrink-0" />
                          <span className="text-[10px] text-[var(--theme-text)]">{t}</span>
                          <button onClick={() => setTempTodos(p => p.filter((_, idx) => idx !== i))} className="text-stone-400 hover:text-rose-500 transition-colors">
                            <X size={9} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags + Code */}
                <div className="flex gap-2">
                  <input placeholder="Tags (tag1, tag2)…" value={newTags} onChange={e => setNewTags(e.target.value)}
                    className="flex-1 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-[11px] text-[var(--theme-text)] focus:ring-1 ring-[var(--theme-accent)] transition-all" />
                  <button onClick={() => setShowCodeInput(p => !p)}
                    className={`p-2 rounded-xl border transition-all ${showCodeInput ? 'bg-[var(--theme-accent)] text-white border-transparent shadow' : 'bg-[var(--theme-card)] border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}`}>
                    <CodeXml size={14} />
                  </button>
                </div>

                {showCodeInput && (
                  <textarea value={newCodeSnippet} onChange={e => setNewCodeSnippet(e.target.value)}
                    placeholder="Code snippet…"
                    className="w-full bg-stone-950 text-stone-300 font-mono text-[11px] p-3 rounded-xl border border-stone-800 min-h-[80px] resize-none" />
                )}

                {/* Color */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--theme-border)]">
                  {(['stone','blue','green','amber','rose','purple'] as EventColor[]).map(c => (
                    <button key={c} onClick={() => setNewColor(c)}
                      className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 ${newColor === c ? 'border-[var(--theme-accent)] scale-125 shadow-md' : 'border-transparent'} ${colorMap[c].accent}`} />
                  ))}
                </div>

                {/* Save / Cancel */}
                <div className="flex items-center gap-2 pt-1">
                  <button onClick={handleSave}
                    className="flex-1 bg-[var(--theme-selection)] text-[var(--theme-selection-text)] px-4 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.98]">
                    <Save size={13} /> Save Note
                  </button>
                  <button onClick={() => { setIsAdding(false); resetForm(); }}
                    className="p-2.5 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] rounded-xl hover:bg-[var(--theme-accent-muted)] transition-all active:scale-90">
                    <X size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="p-4 border-t border-[var(--theme-border)] bg-[var(--theme-accent-muted)] shrink-0">
          {!isAdding ? (
            <button onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--theme-card)] hover:shadow-md border border-[var(--theme-border)] rounded-2xl text-sm font-bold text-[var(--theme-text)] transition-all active:scale-[0.98]">
              <Plus size={16} /> Write a note
            </button>
          ) : (
            <div className="text-center text-[10px] font-bold text-[var(--theme-text-muted)]">
              <span className="opacity-60">SAVING FOR</span>{' '}
              <span className="text-[var(--theme-text)]">{format(date, 'MMM do')}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
