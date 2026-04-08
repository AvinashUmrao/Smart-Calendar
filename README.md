# 🗓️ Premium Wall Calendar & Productivity Suite

A high-fidelity, professional-grade productivity application designed for deep work, long-term planning, and meticulous scheduling. This application blends the aesthetic of a premium physical wall calendar with the power of modern task management, focus tools, and smart automation.

---

## ✨ Primary Features

### 📅 Advanced Multi-View Calendar
*   **Contextual Hub**: Seamlessly switch between **Day, Week, Month, Year, and List** views.
*   **ISO Grid Logic**: Mathematically precise 42-day calendar grids ensuring perfect alignment across month and year boundaries.
*   **Intuitive Navigation**: Context-aware navigation arrows (`< / >`) that adjust their jump distance based on your current view.

### 🎯 Deep Work & Focus Hub
*   **Pomodoro Engine**: Integrated 25/5 focus cycles with system-level notifications.
*   **Adaptive Timing**: On-the-fly `+/- 5m` adjustments to extend deep work or shorten breaks without resetting.
*   **Persistence**: Timer state (time remaining, active mode) survives page refreshes via `localStorage` synchronization.
*   **Live Countdown**: Real-time ticker showing exactly how much time remains until your next scheduled event.

### 🔔 Smart Notification System
*   **Background Monitoring**: A persistent "Reminder Engine" that polls your schedule every 30 seconds.
*   **System Alerts**: Receives native browser notifications and audio cues even when the app is in a background tab.
*   **Permission-Aware**: Automatic handling of browser notification permissions with fallback UX.

### 📝 Strategic Task Management
*   **Batch Planning**: Advanced "Select Range" tool allows you to bulk-apply notes and to-dos to any custom interval (e.g., Year-end planning, Vacations).
*   **To-Do Integration**: Every calendar entry features a dynamic checklist with completion tracking and per-item persistence.
*   **Tagging & Metadata**: Categorize your schedule with custom tags and detailed descriptions.

### 🎨 Global Theming System
*   **Curated Aesthetics**: 6 distinct, high-fidelity themes including **Ocean, Sunset, Forest, Royal, Aurora, and Stone**.
*   **Token-Based Design**: Theme switching is powered by global CSS variables, ensuring instant performance with zero layout shift.
*   **Night Mode**: Deeply integrated dark mode toggle for low-light productivity.

### 💾 Data Sovereignty & Portability
*   **Export Workspace**: One-click download of all events, tasks, and settings into a structured `.json` backup file.
*   **Factory Reset**: Secure "Wipe All Data" feature to instantly clear local storage and start with a fresh instance.
*   **Local-First Privacy**: No data ever leaves your browser; all processing happens entirely on the client-side.

---

## 🛠️ Technology Stack

*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Date Logic**: [date-fns](https://date-fns.org/)
*   **Iconography**: [Lucide React](https://lucide.dev/)
*   **State Management**: React Hooks (useState, useEffect, useMemo, useRef) + LocalStorage
*   **Type Safety**: [TypeScript](https://www.typescriptlang.org/)

---

## 🚀 Getting Started

### Prerequisites
*   **Node.js**: 18.x or later
*   **npm** or **yarn**

### Installation
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/tuff.git
    cd tuff
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Launch Development Server**:
    ```bash
    npm run dev
    ```

4.  **Open the App**:
    Navigate to `http://localhost:3000` in your browser.

---

## 📂 Project Structure

```text
src/
├── app/            # Next.js App Router & Global Styles
├── components/     # Atomic UI & Logic Hubs
│   ├── Calendar.tsx    # Root Orchestrator
│   ├── FocusView.tsx   # Productivity Dashboard
│   ├── NotesPanel.tsx  # Task Entry Sidebar
│   ├── Header.tsx      # Navigation & Settings
│   └── DayCell.tsx     # Calendar Grid Atoms
└── lib/            # Utility functions (Date formatting, etc.)
```

---

## 🧠 Smart Logic & Edge-Case Handling

*   **Auto-Swap Dates**: The "Select Range" tool automatically corrects itself if a user selects a 'To' date earlier than the 'From' date.
*   **Zero-Check Protection**: Countdown timers and progress bars are guarded against negative values and division-by-zero errors.
*   **Safe Hydration**: Data loading from `localStorage` uses strict try-catch blocks and default fail-safes to prevent app crashes on corrupted storage.
*   **Touch Optimization**: Mobile interactions use a 48px-64px minimum target size for all interactive elements.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
