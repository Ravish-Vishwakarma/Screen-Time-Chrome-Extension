# Screen Time Tracker

A Chrome extension that tracks how much time you spend on each website, organized by day.

## Screenshots
<img width="314" height="592" alt="image" src="https://github.com/user-attachments/assets/e237cc0c-0384-4957-9206-18425185982e" />
<img width="311" height="594" alt="image" src="https://github.com/user-attachments/assets/81d6a9a5-f8c8-420f-877b-e58b9b8806d1" />



## Features

- **Automatic time tracking** — records time per domain, saved every 5 seconds and on tab switches
- **Per-day storage** — data is organized by date so you can review past days
- **Today / History tabs** — view today's breakdown or aggregated stats across all dates
- **Pie chart** — visual breakdown of time spent on each site for the selected view
- **Bar chart** — top 6 sites ranked by total all-time time (History tab)
- **Extension badge** — shows current site's time on the extension icon
- **CSV export** — download all data as a CSV file
- **Delete all data** — clear all tracked history
- **Skips internal pages** — new tab pages, `chrome://` URLs, etc. are not tracked

## Tech Stack

- **Vite** — build tool
- **React 19** — UI framework
- **TypeScript** — type safety
- **Tailwind CSS v4** — styling
- **Recharts** — pie and bar charts
- **shadcn/ui** — component primitives
- **Chrome Extensions MV3** — Manifest V3

## Project Structure

```
src/
├── background.ts            # Service worker: tracking logic, badge, interval saves
├── App.tsx                  # Popup UI: tabs, charts, domain list
├── main.tsx                 # React entry point
├── index.css                # Tailwind + CSS variables + theme
├── hooks/
│   └── use-screen-time.ts   # Custom hooks: useScreenTime, useAggregateStats
├── components/
│   └── ui/
│       └── button.tsx        # shadcn Button component
└── lib/
    └── utils.ts              # cn() utility for class merging

public/
└── manifest.json             # Extension manifest

dist/                          # Build output (loaded as unpacked extension)
├── background.js
├── index.html
├── manifest.json
└── assets/
```

## Data Storage

Data is stored in `chrome.storage.local` using the key format:

```
YYYY-MM-DD|domain.com
```

Each key stores the total seconds spent on that domain for that date.

## Build & Install

```bash
npm install
npm run build
```

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` directory

## Development

```bash
npm run dev      # Vite dev server (for popup UI)
npm run build    # TypeScript check + production build
```
