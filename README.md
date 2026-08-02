# Project Ascension

A premium personal fitness and weight loss dashboard built with React, Vite, and Tailwind CSS. Local-first with IndexedDB storage, designed for easy migration to Supabase.

## Features

- **Dashboard** — Weight, macros, habits, and workout status at a glance
- **Weight Tracking** — Log entries, trend charts, weekly/monthly averages
- **Body Measurements** — Track 9 measurement types with multi-line charts
- **Food Log** — USDA food search, barcode lookup, saved favorites, macro tracking
- **Workout Log** — Exercise tracking with calendar view
- **Daily Habits** — Water, sleep, steps, cardio, mood
- **Progress Photos** — Upload and side-by-side comparison (stored in IndexedDB)
- **Settings** — Goals, macros, units, theme

## Tech Stack

- React 18 + Vite
- Tailwind CSS (dark mode default)
- IndexedDB via Dexie.js
- React Router v6
- Recharts
- Framer Motion
- Lucide React

## Getting Started

```bash
cd project-ascension
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## USDA Food Search

Food logging uses the [USDA Food Data Central API](https://fdc.nal.usda.gov/) for branded, restaurant, and whole-food nutrition data.

1. Get a free API key at [fdc.nal.usda.gov/api-key-signup.html](https://fdc.nal.usda.gov/api-key-signup.html)
2. Add it in **Settings → Food Search (USDA)**, or copy `.env.example` to `.env` and set `VITE_USDA_API_KEY`

**Food Log features:**
- Autocomplete search when typing a food name
- Barcode lookup for branded products (UPC/EAN)
- **Save to My Foods** for one-tap re-logging
- Manual macro override still supported

Without an API key, the app falls back to `DEMO_KEY` which has strict rate limits.

## Project Structure

```
src/
├── components/
│   ├── ui/           # Design system primitives
│   ├── charts/       # Recharts wrappers
│   ├── layout/       # App shell, sidebar, navigation
│   └── features/     # Domain-specific components
├── pages/            # Route-level page components
├── hooks/            # Custom React hooks
├── services/
│   ├── calculations/ # Pure business logic
│   └── future/       # Placeholder stubs for AI/cloud features
├── database/
│   ├── repositories/ # Data access layer (Supabase-ready)
│   └── db.js         # Dexie schema
├── contexts/         # Theme and settings providers
├── types/            # JSDoc type definitions
└── utils/            # Date, unit, and image helpers
```

## Architecture

All data flows through a **repository pattern**:

```
UI → Hooks → Repositories → Dexie (IndexedDB)
```

UI components never access IndexedDB directly. To migrate to Supabase:

1. Create `database/repositories/supabase/` mirroring existing interfaces
2. Set `VITE_STORAGE_BACKEND=supabase` in `.env`
3. Update the factory in `database/index.js`

No page or hook changes required.

## Future Features (Stubs Only)

Placeholder service files exist in `src/services/future/`:

- OpenAI integration
- Food photo recognition
- Progress photo analysis
- AI coaching
- Voice logging
- Barcode scanner
- Apple Health sync
- Cloud sync
- Meal planning

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## License

Private — personal use.
