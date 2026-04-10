<div align="center">

# 🗓️ Smart Calendar — Premium Productivity Suite

**A professional-grade, AI-assisted, fully responsive productivity application built with Next.js 16 and React 19.**

Designed for students, professionals, and creators who demand more than a basic calendar.
Smart Calendar combines precise scheduling, deep-work timers, real-time weather intelligence, a creative canvas, and a built-in Smart AI engine — all running **100% in your browser with zero data sent to any server.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2.2-black?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Live Features](#-live-features)
   - [Multi-View Calendar](#1-multi-view-calendar)
   - [Notes & Task Panel](#2-notes--task-panel-with-smart-ai)
   - [Smart AI Engine](#3-smart-assist-ai-engine)
   - [Focus & Productivity Hub](#4-focus--productivity-hub)
   - [Atmosphere (Weather)](#5-atmosphere--weather-dashboard)
   - [Creative Canvas](#6-creative-canvas)
   - [Interactive Onboarding Tour](#7-interactive-onboarding-tour)
   - [Global Theming](#8-global-theming-system)
   - [Data Management](#9-data-management--privacy)
3. [Technology Stack](#-technology-stack)
4. [Project Structure](#-project-structure)
5. [Getting Started](#-getting-started)
6. [Architecture & Design Decisions](#-architecture--design-decisions)
7. [Smart AI Engine — Deep Dive](#-smart-assist-ai-engine--deep-dive)
8. [Responsive Design](#-responsive-design)
9. [Keyboard & Accessibility](#%EF%B8%8F-keyboard--accessibility)
10. [Contributing](#-contributing)
11. [License](#-license)

---

## 🌟 Overview

Smart Calendar started as a minimal wall calendar and evolved into a complete productivity OS for the browser. Every feature is designed with three goals:

- **Zero friction** — interactions feel instant, natural, and never require a page reload
- **Local-first privacy** — your data lives exclusively in your browser's `localStorage`; no accounts, no servers, no cloud
- **Intelligent assistance** — a custom-built NLP engine extracts tasks, suggests titles, scores tags, and summarises your notes — all without any API keys

---

## 🚀 Live Features

### 1. Multi-View Calendar

The calendar is the heart of the app. It supports **7 distinct perspectives** on your time, each optimised for a different planning horizon.

| View | Description |
|------|-------------|
| **Day** | Hour-by-hour breakdown of a single day with event timeline |
| **Week** | 7-column side-by-side layout for weekly planning |
| **Month** | Classic 6-row ISO grid (42 cells), the default view |
| **Year** | All 12 months condensed into a single scannable overview |
| **List** | Chronological feed of upcoming events across all dates |
| **Focus** | Full-screen productivity hub (Pomodoro + Stopwatch) |
| **Extra** | Weather dashboard + Creative Canvas + onboarding tools |

**Key behaviours:**
- **ISO-correct grid** — 42 cells always fill the month grid, with preceding/following month dates shown as subtle ghost cells
- **Click any day** — opens the Notes Panel as a side drawer (desktop) or bottom sheet (mobile)
- **Drag-select a range** — hold and drag across multiple days to select a date range; events created during this mode are applied to every selected date
- **Auto-swap range** — if you accidentally select `To` before `From`, the app silently corrects it
- **Context-aware navigation** — the `‹ ›` arrows jump by day in Day view, by week in Week view, by month in Month/Year views

---

### 2. Notes & Task Panel (with Smart AI)

The Notes Panel is a slide-in drawer (right-side on desktop, bottom sheet on mobile) that appears whenever you select a date.

**Creating a note:**
1. Click any calendar date → Panel opens
2. Click **"Write a note"** → Form expands
3. Type in the Smart Input field — the AI reads your text in real-time
4. Accept AI suggestions (title, tasks, tags) or write manually
5. Set a time, add a colour label, attach code snippets if needed
6. Click **Save Note**

**Note anatomy — everything a note can hold:**

| Field | Details |
|-------|---------|
| **Title** | Required. Short headline for the event |
| **Time** | 12/24h time picker — used to sort events within a day |
| **Description** | Free-text area — also the Smart Input feed for the AI |
| **Tasks / To-Do** | Interactive checklist with per-item completion tracking |
| **Tags** | Comma-separated labels for categorisation (e.g. `study, urgent`) |
| **Color label** | 6 color options: Stone, Blue, Green, Amber, Rose, Purple |
| **Code Snippet** | Monospace dark-mode code block attached to any event |
| **Range Apply** | Toggle to stamp the note across every day in a selected range |

**Reading saved notes:**
- Notes are sorted by time within each day
- Hover a note card to reveal a **🗑 Delete** button (top-left) and a **✨ AI Summarize** button (top-right)
- Tap a to-do item to toggle its completion — saved instantly
- Completed to-do progress shown as a `X/Y Done` badge

---

### 3. Smart Assist AI Engine

> **Fully client-side. No API key. No network request. No data leaves your device.**

The Smart Assist engine (`src/lib/SmartAssist.ts`) is a custom NLP layer built with regular-expression heuristics and rule-based scoring. It activates in real-time as you type in the description field.

#### ✨ Auto Task Extraction

Type naturally — the engine detects individual tasks and presents them as interactive chips.

**Example input:**
```
Prepare PPT, revise DBMS, submit assignment by tonight, call the professor
```

**Extracted output (with priority):**
| Task | Priority |
|------|----------|
| Prepare PPT | 🟡 Medium (creation verb) |
| Revise DBMS | 🟡 Medium (learning verb) |
| Submit assignment by tonight | 🔴 High (delivery verb + urgency keyword) |
| Call the professor | 🟡 Medium (communication verb) |

Each extracted task chip has:
- A green **`+`** button to accept (adds to the to-do list)
- A grey **`×`** button to dismiss
- An **"Add All"** shortcut to accept everything at once

The engine uses a 3-strategy pipeline:
1. **Bullet / numbered list detection** (highest confidence) — `- item`, `* item`, `1. item`
2. **Delimiter splitting** — commas, semicolons, "and", "also", "then", newlines
3. **Single-input fallback** — treats the whole input as one task if an action verb is found

#### ✨ Title Variants

While your title field is empty, the engine generates up to **3 title options** in different styles:

| Style | Example |
|-------|---------|
| **Concise** | `Prepare PPT…` |
| **Action** | `Prepare PPT & Revise DBMS` |
| **Descriptive** | `4 Tasks: Prepare, Revise…` |

Click any variant to apply it instantly.

#### ✨ Smart Tag Suggestions

The engine scores your text against **8 semantic categories** with confidence levels:

| Category | Example triggers |
|----------|-----------------|
| `work` | meeting, sprint, deadline, deploy, client |
| `study` | exam, revision, DBMS, assignment, lecture |
| `health` | gym, doctor, diet, yoga, medication |
| `finance` | bill, EMI, invoice, budget, salary |
| `personal` | birthday, travel, family, shopping |
| `creative` | design, Figma, blog, video, art |
| `urgent` | asap, critical, overdue, tonight, must |
| `learning` | course, tutorial, documentation, bootcamp |

- **High confidence** (✦) = 2+ keyword matches — shown first
- **Medium confidence** = single keyword match
- Click any tag chip individually to apply it; applied tags show a ✓ check

#### ✨ Summarize Note

Available in two places:
1. **During creation** — via the "Summarize" button in the Smart Assist panel
2. **On any saved note** — hover a note card → click the ✨ sparkle button

The summary modal shows a structured result:
- 📌 **Headline** — concise version of the note title
- **Priority badge** — High / Medium / Low with color
- **⏱ Time estimate** — e.g. `~1–2 hours` (estimated from task count)
- **Key Points** — top 3 most information-dense sentences from the description
- **Task summary** — "4 action items: Prepare PPT; Revise DBMS…"

#### Priority Classification

Verb groups used to classify task urgency:

| Priority | Verbs |
|----------|-------|
| 🔴 High | `submit`, `deploy`, `deliver`, `publish`, `release`, `present`, `fix`, `debug`, `solve` |
| 🟡 Medium | `prepare`, `create`, `write`, `review`, `check`, `study`, `read`, `revise`, `call`, `discuss` |
| 🟢 Low | `buy`, `book`, `schedule`, `clean`, `organize`, `plan`, `setup` |

Any verb group can be upgraded to **High** by the presence of urgency keywords: `urgent`, `asap`, `deadline`, `overdue`, `critical`, `tonight`, `must`.

---

### 4. Focus & Productivity Hub

Accessible via the **Focus** tab. Full-screen layout with two tools.

#### Pomodoro Timer
- **Classic 25/5 cycle** — 25 minutes of deep work, 5-minute break
- **On-the-fly adjustments** — `+5m / -5m` buttons while the timer is running, without resetting progress
- **Progress ring** — animated circular SVG arc showing session completion percentage
- **Mode indicator** — visual switch between `☕ Break` and `🎯 Focus` modes
- **Session counter** — tracks total completed sessions (persisted across page reloads)
- **Browser tab title** — the countdown appears in the browser tab so you can see it while in other windows/apps
- **System notifications** — fires a native browser notification when a session ends (with permission request)
- **localStorage persistence** — timer state, mode, and session count survive page refreshes

#### Stopwatch
- **Centisecond precision** — displays `HH:MM:SS.cs` format
- **Lap support** — record split times with the lap button
- **Independent state** — runs alongside the Pomodoro without interference

#### Upcoming Events Panel
- Shows the next 5+ events from your calendar
- Displays a live countdown: "in 2h 35m" for each upcoming event
- Highlights the most imminent event in the primary accent color

---

### 5. Atmosphere — Weather Dashboard

Accessible via **Extra → Atmosphere tab**.

- **Auto-location** — uses the browser's Geolocation API to detect your city on first load
- **City search** — type any city name and get instant weather for that location
- **Powered by Open-Meteo** — free, open-data weather API (no personal API key needed)

**Data displayed:**

| Section | Details |
|---------|---------|
| **Current conditions** | Temperature (°C), feels-like, weather description with icon |
| **Stats row** | Humidity (%), Wind speed (km/h), Visibility (km), Pressure (hPa) |
| **Hourly forecast** | Horizontally scrollable 12-hour card strip |
| **6-Day forecast** | Daily high/low with weather icons |
| **Sunrise / Sunset** | Exact times for the current location |
| **UV Index** | Current UV level with a gradient progress bar |

The weather card is fully responsive: switches from a 2-column desktop layout to stacked mobile cards, and all stat cells reflow from 4 across to 2×2 grid on small screens.

---

### 6. Creative Canvas

Accessible via **Extra → Creative Canvas tab**.

A full-featured freehand drawing tool built on the HTML5 `<canvas>` API.

**Tools:**

| Tool | Description |
|------|-------------|
| **Pencil** | Smooth quadratic Bézier-interpolated freehand strokes |
| **Eraser** | Erases back to white canvas background |
| **Undo** | Step backward through the stroke history |
| **Redo** | Step forward through history |
| **Clear** | Wipe the entire canvas (adds to history — undoable) |
| **Save / Download** | Export the canvas as a `.png` file instantly |

**Color system:**
- 13 preset swatches covering the full spectrum
- Custom color via a native `<input type="color">` color picker
- Brush size slider from 1px to 50px

**Mobile optimisations:**
- Touch events (`touchstart`, `touchmove`, `touchend`) fully supported with `preventDefault` to prevent page scroll while drawing
- On small screens, clicking the ⚙ icon opens a collapsible panel with full-size color swatches, a brush slider, and a **live brush preview** dot
- `ResizeObserver` redraws the canvas when the container changes size (orientation flip, panel open/close), preserving existing artwork via snapshot

**Technical highlights:**
- High-DPI rendering using `devicePixelRatio` scaling for crisp lines on Retina screens
- Quadratic Bézier midpoint smoothing eliminates jagged edges from fast strokes
- Empty-state prompt ("Start drawing…") disappears after the first stroke

---

### 7. Interactive Onboarding Tour

Accessible via **Extra → Feature Tour** button, or triggered automatically on first visit.

A professional, step-by-step guided walkthrough of the entire application — not a static help page, but a **live, interactive demo** where the UI itself is demonstrated.

**How it works:**

1. The tour uses an **SVG mask** to create a pixel-perfect dim overlay with a clean cutout around the currently highlighted element
2. A floating tooltip card positions itself intelligently (above/below the target, clamped to viewport)
3. At each step, the app **automatically switches views** to demonstrate features in context (switching to Focus mode to show the timer, then to Extra to show weather)
4. A pulsing **beacon dot** sits at the center of each highlighted element
5. An **animated SVG connector arrow** draws itself from the tooltip to the target element with a stroke-dashoffset animation

**8 guided steps:**

| Step | Element Highlighted | What's explained |
|------|--------------------|--------------------|
| 1 | Header | The three main areas of the screen |
| 2 | Header (navigation) | Arrow buttons and Today button |
| 3 | View Switcher | All 7 view tabs explained |
| 4 | Calendar Grid | Clicking days, event dots |
| 5 | Focus view (auto-switches) | Pomodoro timer usage |
| 6 | Extra view (auto-switches) | Weather and canvas |
| 7 | Theme palette button | Theme & dark mode |
| 8 | Center (celebration) | Completion with confetti |

**Interaction controls:**
- **Next / Back** buttons on the tooltip card
- **Keyboard**: `→` or `Enter` for next, `←` for back, `Esc` to close
- **Swipe** left/right on mobile to navigate
- **Clickable progress dots** to jump to any step
- **Confetti burst** animation on the final step

**Responsiveness:**
- Desktop: tooltip card floats near the highlighted element with smart above/below logic
- Mobile: card docks as a **native bottom sheet** with rounded top and a drag handle bar
- `requestAnimationFrame`-based positioning ensures coordinates update after React renders complete

---

### 8. Global Theming System

Accessible via the **Palette** (🎨) icon in the Header.

**6 curated themes:**

| Theme | Description | Accent Color |
|-------|-------------|-------------|
| **Stone** (default) | Warm neutral, minimal | Gray-brown |
| **Ocean** | Deep blues and sky tones | `#0284c7` |
| **Forest** | Rich botanical greens | `#16a34a` |
| **Royal** | Vibrant purples | `#7c3aed` |
| **Sunset** | Warm pinks and coral | `#f43f5e` |
| **Aurora** | Animated color-shifting gradients | Teal → Blue → Purple |

**Architecture:**
- Every color in the app is defined as a CSS variable on `:root` (e.g. `--theme-accent`, `--theme-card`, `--theme-text-muted`)
- Switching a theme applies a class to `<html>` (`theme-ocean`, `theme-forest`, etc.)
- Dark mode adds the `.dark` class alongside the theme class
- No JavaScript color calculations at paint time — the browser resolves variables natively
- The Aurora theme uses a `@keyframes` animation on CSS variables themselves for a continuously shifting background

**Dark / Night mode:**
- Deep dark mode variants for all 6 themes
- Toggle persisted in `localStorage` and restored on next visit

---

### 9. Data Management & Privacy

**All data is stored locally in your browser's `localStorage`. Nothing is ever sent to a server.**

| localStorage Key | Content |
|-----------------|---------|
| `calendar_events` | All events, todos, tags, descriptions |
| `pomodoro_time` | Remaining timer seconds |
| `pomodoro_mode` | `focus` or `break` |
| `pomodoro_sessions` | Completed session count |
| `stopwatch_time` | Stopwatch elapsed seconds |
| `focus_tool` | Last active focus tool |
| `theme` | Selected theme name |
| `darkMode` | Dark mode enabled/disabled |

**Export:** One-click download of all event data as a structured `.json` file for backups or migration.

**Factory Reset:** A "Clear All Data" option in the Palette menu wipes all `localStorage` entries and reloads the app to a fresh state. (Protected by a confirmation step.)

---

## 🛠️ Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Framework** | [Next.js](https://nextjs.org/) (App Router) | `16.2.2` |
| **UI Library** | [React](https://react.dev/) | `19.2.4` |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | `^4` |
| **Date Logic** | [date-fns](https://date-fns.org/) | `^4.1.0` |
| **Iconography** | [Lucide React](https://lucide.dev/) | `^1.7.0` |
| **Type Safety** | [TypeScript](https://www.typescriptlang.org/) | `^5` |
| **Linting** | ESLint + eslint-config-next | `^9` |
| **State** | React Hooks + `localStorage` | — |
| **AI Engine** | Custom NLP (`src/lib/SmartAssist.ts`) | In-house |
| **Weather API** | [Open-Meteo](https://open-meteo.com/) | Free / No key |

> **No external state management library** (no Redux, Zustand, Jotai). All state is managed with `useState` / `useEffect` / `useCallback` and lifted to `Calendar.tsx` as the root orchestrator.

---

## 📂 Project Structure

```text
tuff/
├── src/
│   ├── app/
│   │   ├── globals.css          # CSS variables, theme tokens, animation keyframes
│   │   ├── layout.tsx           # Root layout, font loading (Inter via next/font)
│   │   └── page.tsx             # Entry point — renders <Calendar />
│   │
│   ├── components/
│   │   ├── Calendar.tsx         # 🏛  Root orchestrator — owns all shared state
│   │   │                        #     Manages: viewMode, selectedDate, events, dateRange
│   │   │
│   │   ├── Header.tsx           # 📅  Top navigation bar
│   │   │                        #     Month/year picker dropdowns, theme palette,
│   │   │                        #     export/reset actions, navigation arrows
│   │   │
│   │   ├── ViewSwitcher.tsx     # 🔀  Tab bar for the 7 view modes
│   │   │
│   │   ├── DayCell.tsx          # 📦  Atomic calendar grid cell
│   │   │                        #     Handles today highlight, event dots,
│   │   │                        #     range selection highlight, drag events
│   │   │
│   │   ├── NotesPanel.tsx       # 📝  Notes & task side drawer
│   │   │                        #     Full AI Integration (Smart Assist)
│   │   │                        #     Todos, tags, colors, code snippets, range apply
│   │   │
│   │   ├── FocusView.tsx        # 🎯  Productivity hub
│   │   │                        #     Pomodoro timer, Stopwatch, Upcoming events
│   │   │
│   │   ├── ExtraFeatures.tsx    # 🔧  Container for Extra tab tools
│   │   │                        #     Switches between WeatherView and DrawingCanvas
│   │   │
│   │   ├── WeatherView.tsx      # 🌤  Atmosphere weather dashboard
│   │   │                        #     Geolocation, Open-Meteo API, search
│   │   │
│   │   ├── DrawingCanvas.tsx    # 🎨  Freehand drawing tool
│   │   │                        #     HiDPI canvas, Bézier smoothing, undo history
│   │   │
│   │   ├── Onboarding.tsx       # 🧭  Interactive tour engine
│   │   │                        #     SVG spotlight, connector arrow, 8 steps
│   │   │
│   │   ├── DayView.tsx          # 📆  Single-day hourly timeline view
│   │   ├── WeekView.tsx         # 📅  7-column weekly grid
│   │   ├── YearView.tsx         # 📅  12-month overview grid
│   │   ├── ListView.tsx         # 📋  Chronological event feed
│   │   └── ImageBanner.tsx      # 🖼  Decorative header image
│   │
│   └── lib/
│       └── SmartAssist.ts       # 🧠  Client-side AI engine
│                                #     extractTasks, suggestTitleVariants,
│                                #     suggestTags, summarizeNote
│
├── public/                      # Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config (inline via CSS)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or later
- **npm** 9.x or later (or `yarn` / `pnpm`)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/AvinashUmrao/Smart-Calendar.git
cd Smart-Calendar
```

**2. Install dependencies**
```bash
npm install
```

**3. Start the development server**
```bash
npm run dev
```

**4. Open in browser**

Navigate to [http://localhost:4000](http://localhost:4000)

> The dev server runs on port **4000** (configured in `package.json`).

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

---

## 🏗️ Architecture & Design Decisions

### State Management

All shared application state lives in `Calendar.tsx` and is passed down via props. This was a deliberate choice to:
- Keep the data flow explicit and easy to trace
- Avoid a dependency on an external state library for a self-contained app
- Make the `localStorage` persistence layer easier to reason about

The key state slices in `Calendar.tsx`:

```typescript
const [viewMode, setViewMode]         // which of the 7 tabs is active
const [selectedDate, setSelectedDate] // the date the Notes Panel is open for
const [gridStartDate, gridEndDate]    // the drag-selected date range
const [events, setEvents]             // Record<string, CalendarEvent[]>
const [showTour, setShowTour]         // whether the onboarding tour is active
```

### CSS Variable Theming

Every visual token is a CSS variable, defined in `globals.css`:

```css
:root {
  --theme-bg: #fafaf9;
  --theme-card: #ffffff;
  --theme-accent: #57534e;
  --theme-text: #1c1917;
  --theme-text-muted: #78716c;
  --theme-border: #e7e5e4;
  --theme-selection: #1c1917;
  --theme-selection-text: #ffffff;
  /* ... */
}
```

Each theme class overrides these same variables, so every component that uses `var(--theme-*)` picks up the change immediately — no re-renders required.

### Local-First Data

Events are serialised as `Record<string, CalendarEvent[]>` where the key is an ISO date string (`2026-04-10`). This makes O(1) lookup by date trivial and keeps the storage payload flat and human-readable.

```typescript
// Example stored structure
{
  "2026-04-10": [
    {
      "id": "abc123",
      "title": "Revise DBMS",
      "time": "10:00",
      "todos": [{ "id": "t1", "text": "Chapter 5", "completed": false }],
      "tags": ["study", "urgent"],
      "color": "amber"
    }
  ]
}
```

### The SmartAssist Engine

Rather than an LLM API call, the AI features use a hand-crafted NLP pipeline:

1. **Tokenisation** → split on delimiters or detect bullet syntax
2. **Verb classification** → match first token against 9 verb-group dictionaries
3. **Priority scoring** → verb group default + urgency keyword override
4. **Tag taxonomy** → 8 category RegExps, hit count → confidence level
5. **Title generation** → 3 structural templates applied to extracted data

This approach gives deterministic, offline, zero-latency results while feeling intelligent to the user.

---

## 🧠 Smart Assist AI Engine — Deep Dive

Located at: `src/lib/SmartAssist.ts`

### Exported Functions

```typescript
// Extract tasks from free-text with priority and category
extractTasks(text: string): ExtractedTask[]

// Generate up to 3 title variants (concise / action / descriptive)
suggestTitleVariants(text: string, tasks: ExtractedTask[]): TitleVariant[]

// Score text against 8 tag categories with confidence levels
suggestTags(text: string): TagSuggestion[]

// Produce a structured summary of a note
summarizeNote(title, description, tasks): SummaryResult
```

### Return Types

```typescript
interface ExtractedTask {
  text: string;
  priority: 'high' | 'medium' | 'low';
  category: string; // 'delivery' | 'fix' | 'learning' | 'communication' | ...
}

interface TagSuggestion {
  tag: string;
  confidence: 'high' | 'medium';
  reason: string; // human-readable explanation
}

interface TitleVariant {
  text: string;
  style: 'concise' | 'action' | 'descriptive';
}

interface SummaryResult {
  headline: string;
  keyPoints: string[];
  taskSummary: string | null;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string | null; // e.g. '1–2 hours'
}
```

---

## 📱 Responsive Design

The app is fully responsive across all device sizes.

| Screen | Calendar layout | Notes Panel | Tour Card | Canvas Toolbar |
|--------|----------------|-------------|-----------|----------------|
| **Mobile** (`< 768px`) | Single column, compact cells | Bottom sheet (85vh) | Docked bottom sheet | Collapsible settings panel |
| **Tablet** (`768px–1280px`) | Full grid, medium cells | Side drawer (hidden by default) | Floating, viewport-clamped | Full toolbar |
| **Desktop** (`> 1280px`) | Full grid with sidebar | Always-visible side panel | Floating near target | Full toolbar |

**Mobile-specific features:**
- Swipe left/right on the onboarding tour to navigate steps
- Drawing canvas supports multi-touch with `preventDefault` to block scroll
- Bottom sheet tour card with drag handle indicator
- All tap targets are ≥ 44px to meet WCAG touch target guidelines
- `no-scrollbar` utility hides scrollbars while keeping them functional

---

## ⌨️ Keyboard & Accessibility

| Context | Key | Action |
|---------|-----|--------|
| Onboarding tour | `→` / `Enter` | Next step |
| Onboarding tour | `←` | Previous step |
| Onboarding tour | `Esc` | Close tour |
| Note form | `Enter` in task input | Add task to list |
| Any input | `Tab` | Focus next field |

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome.

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/my-awesome-feature`
3. Commit your changes: `git commit -m 'feat: add my awesome feature'`
4. Push to the branch: `git push origin feature/my-awesome-feature`
5. Open a **Pull Request**

### Development Notes

- Run `npx tsc --noEmit` before submitting a PR to ensure no TypeScript errors
- All new components should consume `var(--theme-*)` CSS variables — never hardcoded colors
- The `SmartAssist.ts` engine must remain dependency-free (no npm packages)
- Adding a new view requires updating `ViewMode` type in `ViewSwitcher.tsx` and the render switch in `Calendar.tsx`

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for full text.

---

<div align="center">

Built with ❤️ by [Avinash Umrao](https://github.com/AvinashUmrao)

*Smart Calendar — Because your time deserves better than a spreadsheet.*

</div>
