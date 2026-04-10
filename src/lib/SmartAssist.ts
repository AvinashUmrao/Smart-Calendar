/**
 * SmartAssist v2 — A richer client-side productivity AI engine.
 * No API keys. No backend. Advanced NLP heuristics.
 */

/* ─── Types ─────────────────────────────────────────────── */
export interface ExtractedTask {
  text: string;
  priority: 'high' | 'medium' | 'low';
  category: string; // inferred category
}

export interface TagSuggestion {
  tag: string;
  confidence: 'high' | 'medium'; // high = multiple hits, medium = single hit
  reason: string; // why this tag was suggested
}

export interface TitleVariant {
  text: string;
  style: 'concise' | 'descriptive' | 'action';
}

export interface SummaryResult {
  headline: string;
  keyPoints: string[];
  taskSummary: string | null;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string | null;
}

/* ─── Tag taxonomy with keyword hits ───────────────────── */
interface TagRule {
  tag: string;
  keywords: RegExp;
  reason: string;
  color: string;
}

const TAG_RULES: TagRule[] = [
  {
    tag: 'work',
    reason: 'work-related keywords detected',
    color: 'blue',
    keywords: /\b(meeting|presentation|present|project|deadline|client|client-side|report|office|sprint|standup|stand-?up|review|pr|pull.?request|deploy|deployment|launch|deliverable|task|ticket|jira|slack|email|agenda|proposal|interview|onboard|kpi|milestone|version)\b/i,
  },
  {
    tag: 'study',
    reason: 'academic keywords detected',
    color: 'indigo',
    keywords: /\b(study|exam|examination|test|assignment|homework|quiz|lecture|class|revise|revision|chapter|notes|dbms|os|dsa|algorithm|math|science|physics|chemistry|biology|history|geography|english|hindi|college|university|semester|syllabus|question|paper|marks|grade|gpa|cgpa|practicals|viva|project.?report)\b/i,
  },
  {
    tag: 'health',
    reason: 'health-related keywords detected',
    color: 'green',
    keywords: /\b(gym|workout|exercise|run|jog|walk|yoga|meditat|doctor|physician|hospital|clinic|appointment|medicine|tablet|diet|sleep|rest|mental|therapy|water|calories|protein|vitamins|blood|pressure|sugar|weight|bmi|steps|fitness)\b/i,
  },
  {
    tag: 'finance',
    reason: 'financial keywords detected',
    color: 'amber',
    keywords: /\b(pay|payment|bill|invoice|budget|salary|tax|fee|expense|rent|emi|transfer|bank|money|cash|loan|invest|stock|mutual.?fund|sip|insurance|reimburs|receipt|account|balance|credit|debit|upi)\b/i,
  },
  {
    tag: 'personal',
    reason: 'personal life keywords detected',
    color: 'rose',
    keywords: /\b(call|family|friend|birthday|anniversary|travel|trip|visit|gift|shopping|buy|party|celebrate|relationship|marriage|wedding|date|dinner|lunch|breakfast|movie|book|hobby|relax|holiday|vacation|weekend)\b/i,
  },
  {
    tag: 'creative',
    reason: 'creative work keywords detected',
    color: 'violet',
    keywords: /\b(design|draw|paint|sketch|write|blog|content|video|reel|edit|music|song|art|photo|portfolio|brand|logo|ui|ux|figma|canva|adobe|illustration|animation|script|podcast|publish)\b/i,
  },
  {
    tag: 'urgent',
    reason: 'urgent/priority keywords detected',
    color: 'red',
    keywords: /\b(urgent|asap|immediately|critical|important|emergency|priority|today|tonight|now|deadline|due|overdue|must|cannot.?wait|last.?minute|rush|fire)\b/i,
  },
  {
    tag: 'learning',
    reason: 'learning/skill keywords detected',
    color: 'cyan',
    keywords: /\b(learn|course|tutorial|udemy|coursera|youtube|skill|practice|train|certification|bootcamp|workshop|webinar|read|book|documentation|docs|api|guide|knowledge)\b/i,
  },
];

/* ─── Action verbs with categories + priority signals ─── */
interface VerbEntry {
  verbs: string[];
  category: string;
  defaultPriority: 'high' | 'medium' | 'low';
}

const VERB_GROUPS: VerbEntry[] = [
  { verbs: ['submit', 'deploy', 'deliver', 'publish', 'release', 'present', 'send', 'upload'], category: 'delivery',   defaultPriority: 'high'   },
  { verbs: ['fix', 'debug', 'solve', 'resolve', 'patch', 'correct', 'repair'],                 category: 'fix',        defaultPriority: 'high'   },
  { verbs: ['prepare', 'create', 'build', 'make', 'write', 'draft', 'design', 'develop'],      category: 'creation',   defaultPriority: 'medium' },
  { verbs: ['review', 'check', 'verify', 'test', 'validate', 'proofread', 'inspect'],          category: 'review',     defaultPriority: 'medium' },
  { verbs: ['revise', 'update', 'edit', 'refactor', 'improve', 'refine', 'optimise', 'optimize'], category: 'improvement', defaultPriority: 'medium' },
  { verbs: ['study', 'read', 'learn', 'research', 'practice', 'watch', 'attend', 'complete'],  category: 'learning',   defaultPriority: 'medium' },
  { verbs: ['call', 'meet', 'discuss', 'email', 'message', 'contact', 'reach', 'follow'],      category: 'communication', defaultPriority: 'medium' },
  { verbs: ['buy', 'order', 'book', 'schedule', 'pay', 'register', 'enroll', 'install'],       category: 'action',     defaultPriority: 'low'    },
  { verbs: ['clean', 'organize', 'sort', 'arrange', 'plan', 'setup', 'configure'],             category: 'planning',   defaultPriority: 'low'    },
];

const ALL_ACTION_VERBS = VERB_GROUPS.flatMap(g => g.verbs);
const ACTION_VERB_RE = new RegExp(
  `^(${ALL_ACTION_VERBS.join('|')}|need to|have to|must|should|got to)`,
  'i'
);
const INTENT_PREFIX_RE = /^(i need to|we need to|need to|have to|i have to|we have to|must|should|i should|i want to|want to|going to|will)\s+/i;
const URGENT_RE = /\b(urgent|asap|immediately|critical|important|emergency|priority|deadline|due|overdue|must)\b/i;
const SPLIT_RE = /[,;|•·–\n\r]+|\band\b|\bthen\b|\balso\b/gi;

/* ─── Helpers ─────────────────────────────────────────── */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).trimEnd();

function getVerbEntry(word: string): VerbEntry | null {
  return VERB_GROUPS.find(g => g.verbs.some(v => v.toLowerCase() === word.toLowerCase())) ?? null;
}

/* ─── Bullet / numbered list detection ───────────────── */
function parseBullets(text: string): string[] {
  const bulletRe = /^[\s]*[-*•·–]\s+(.+)$/gm;
  const numberedRe = /^[\s]*\d+[.)]\s+(.+)$/gm;
  const bullets: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = bulletRe.exec(text)) !== null)   bullets.push(m[1].trim());
  while ((m = numberedRe.exec(text)) !== null)  bullets.push(m[1].trim());
  return bullets;
}

/* ────────────────────────────────────────────────────────
   extractTasks v2
   Multi-strategy extraction pipeline.
──────────────────────────────────────────────────────── */
export function extractTasks(text: string): ExtractedTask[] {
  if (!text || text.trim().length < 3) return [];

  const seen = new Set<string>();
  const results: ExtractedTask[] = [];

  const add = (rawText: string) => {
    // Strip leading intent phrases ("I need to", "must", etc.)
    const cleaned = rawText.replace(INTENT_PREFIX_RE, '').trim();
    if (!cleaned || cleaned.length < 2) return;

    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    const words = cleaned.split(/\s+/);
    const firstWord = words[0];
    const verbEntry = getVerbEntry(firstWord);

    // Determine priority
    let priority: ExtractedTask['priority'] = verbEntry?.defaultPriority || 'low';
    if (URGENT_RE.test(rawText)) priority = 'high';

    results.push({
      text: cap(cleaned),
      priority,
      category: verbEntry?.category || 'general',
    });
  };

  // Strategy 1: Bullet / numbered lists (highest confidence)
  const bullets = parseBullets(text);
  if (bullets.length > 0) {
    bullets.forEach(b => add(b));
    return results;
  }

  // Strategy 2: Split on delimiters, check for verbs
  const segments = text
    .split(SPLIT_RE)
    .map(s => s.trim())
    .filter(s => s.length >= 3);

  for (const seg of segments) {
    const words = seg.split(/\s+/);
    if (words.length < 2) continue;

    const hasVerb = ACTION_VERB_RE.test(seg);

    // If text contains multiple segments, accept them even without strict verb match
    const isLikelyTask = hasVerb || (segments.length >= 2 && words.length <= 8);
    if (isLikelyTask) add(seg);
  }

  // Strategy 3: single-input fallback (no commas) — treat as one task if verb found
  if (results.length === 0) {
    if (ACTION_VERB_RE.test(text.trim())) add(text.trim());
  }

  return results;
}

/* ────────────────────────────────────────────────────────
   suggestTitleVariants — returns up to 3 title options
──────────────────────────────────────────────────────── */
export function suggestTitleVariants(
  text: string,
  tasks: ExtractedTask[]
): TitleVariant[] {
  const variants: TitleVariant[] = [];

  // Option A — concise: first task or first 5 words
  if (tasks.length > 0) {
    const t = tasks[0].text.split(/\s+/).slice(0, 5).join(' ');
    variants.push({ text: cap(t) + (tasks[0].text.split(/\s+/).length > 5 ? '…' : ''), style: 'concise' });
  } else {
    const words = text.split(/\s+/).slice(0, 5);
    if (words.length >= 2) variants.push({ text: cap(words.join(' ')) + (text.split(/\s+/).length > 5 ? '…' : ''), style: 'concise' });
  }

  // Option B — action: verb + object
  if (tasks.length >= 2) {
    const grouped = `${cap(tasks[0].text)} & ${cap(tasks[1].text.split(/\s+/).slice(0, 3).join(' '))}`;
    if (grouped !== variants[0]?.text) variants.push({ text: grouped, style: 'action' });
  }

  // Option C — descriptive: "X things to do"
  if (tasks.length >= 3) {
    variants.push({ text: `${tasks.length} Tasks: ${tasks.slice(0, 2).map(t => t.text.split(' ')[0]).join(', ')}…`, style: 'descriptive' });
  } else if (tasks.length === 0 && text.length > 20) {
    const first = text.split(/[.!?]/)[0].trim();
    if (first.split(/\s+/).length > 5 && variants.length < 2) {
      const shortened = first.split(/\s+/).slice(0, 7).join(' ');
      variants.push({ text: cap(shortened) + '…', style: 'descriptive' });
    }
  }

  // Deduplicate
  return variants.filter((v, i) => v.text.length > 2 && variants.findIndex(x => x.text === v.text) === i);
}

/* ────────────────────────────────────────────────────────
   suggestTags v2 — with confidence + reason
──────────────────────────────────────────────────────── */
export function suggestTags(text: string): TagSuggestion[] {
  if (!text || text.trim().length < 3) return [];

  const suggestions: TagSuggestion[] = [];

  for (const rule of TAG_RULES) {
    const matches = text.match(new RegExp(rule.keywords.source, 'gi'));
    if (!matches || matches.length === 0) continue;
    const confidence: TagSuggestion['confidence'] = matches.length >= 2 ? 'high' : 'medium';
    suggestions.push({ tag: rule.tag, confidence, reason: rule.reason });
  }

  // Sort: high confidence first
  return suggestions.sort((a, b) =>
    a.confidence === b.confidence ? 0 : a.confidence === 'high' ? -1 : 1
  );
}

/* ────────────────────────────────────────────────────────
   summarizeNote v2 — structured result
──────────────────────────────────────────────────────── */
export function summarizeNote(
  title: string,
  description: string,
  tasks: string[],
): SummaryResult {
  // Headline
  const headline = title
    ? cap(title)
    : tasks[0]
      ? cap(tasks[0])
      : description
        ? cap(description.split(/[.!?]/)[0].trim().split(/\s+/).slice(0, 6).join(' '))
        : 'Untitled Note';

  // Key points from description
  const keyPoints: string[] = [];
  if (description && description.trim()) {
    // Split into sentences, score by length (proxy for density), pick top 3
    const sentences = description
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.split(/\s+/).length >= 4);

    const top = sentences
      .map(s => ({ s, score: s.split(/\s+/).length }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(x => cap(x.s));

    keyPoints.push(...top);
  }

  // Task summary
  const taskSummary = tasks.length > 0
    ? `${tasks.length} action item${tasks.length !== 1 ? 's' : ''}: ${tasks.slice(0, 3).map(cap).join('; ')}${tasks.length > 3 ? ` +${tasks.length - 3} more` : ''}.`
    : null;

  // Overall priority
  const combined = `${title} ${description}`;
  const priority: SummaryResult['priority'] = URGENT_RE.test(combined)
    ? 'high'
    : tasks.length >= 3
      ? 'medium'
      : 'low';

  // Rough time estimate
  let estimatedTime: string | null = null;
  if (tasks.length >= 5)     estimatedTime = '2–4 hours';
  else if (tasks.length >= 3) estimatedTime = '1–2 hours';
  else if (tasks.length >= 1) estimatedTime = '30–60 min';
  else if (description.split(/\s+/).length > 50) estimatedTime = '1–2 hours';

  return { headline, keyPoints, taskSummary, priority, estimatedTime };
}
