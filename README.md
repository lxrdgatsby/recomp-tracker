# Recomp Tracker

A personal 90-day body recomposition tracker with peptide injection scheduling, workout regimen, and progress charts.

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS v4
- date-fns · recharts · lucide-react
- localStorage persistence

## Run

```bash
cd recomp-tracker
npm install
npm run dev
```

Open **http://127.0.0.1:5174** — Dashboard is the default view.

## Features

- **Dashboard** — Stats cards, goal progress bar, quick weight log
- **Profile** — Weight goals, start date, fully editable peptide stack
- **Peptides** — Daily/weekly injection schedule with done-checkmarks + printable checklist
- **90-Day Plan** — Auto-generated milestones and projected goal date
- **Workouts** — 13-week 5-on/2-off plan with progressive overload notes
- **Progress** — Weight chart, adherence %, workout calendar
- **Export** — Download all data as JSON

## Default Peptide Stack

Retatrutide (weekly), Tesamorelin (daily), AOD9604 (daily), BPC-157 (daily) — all editable in Profile.

## PWA (Installable App)

Recomp Tracker is a Progressive Web App:

- **manifest.json** — emerald/teal theme (`#10b981`), standalone display, full icon set
- **Service worker** — offline app shell via Workbox (auto-updates)
- **Install App** button — Chrome/Edge/Android native prompt; iOS step-by-step guide

### Install

- **Android / Desktop Chrome:** Click **Install App** in the sidebar or mobile header
- **iOS Safari:** Tap **Install App** for Add to Home Screen instructions

### Test production PWA

```bash
npm run build
npm run preview
```

Serve over HTTPS in production for full install support.