# peppobot.com

Source for **[www.peppobot.com](https://www.peppobot.com)**: Peppobot's personal video game log and review site.

> **PEPPOBOT — PILOT LOG // GAME REPORTS**
> _Games played. Reports filed._
> Every game Peppobot runs is scored on six axes, reviewed without filters and tracked to the hour.

The visual design comes from a Claude Design project (`Peppobot v2.dc.html`). A copy of it is in [`design/`](design/) as the reference for this implementation.

---

## What the site does

Peppobot is a human gamer with a "robot persona". He plays games, from RPGs and roguelikes to "anything with a good parry", since 1999. He keeps a public log of every game: what he's playing now, what he finished, what he dropped and what's coming next. Each game gets a structured score and a written review. Reviews are written "after the credits, never before". Games still being played get a **provisional** score.

The persona drives the copy. The site reads like a robot's ship log: "pilot", "runs", "telemetry", "loading bay", "systems nominal / errors detected", "no matches in memory bank", "all scores final until patched".

### Core concepts

| Concept           | Meaning                                                                                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Game / Report** | One logged title: developer, platform, genre, year, status, hours played, finish date (or last session), progress % (while playing), six axis scores, one-line verdict, long-form review, pros and cons. |
| **Status**        | `Playing` (green), `Completed` (purple), `Dropped` (red).                                                                                                                                                |
| **Six axes**      | Every game is rated 0–10 on **Gameplay**, **Narrative**, **Visuals**, **Audio**, **Longevity** and **Innovation**.                                                                                       |
| **Overall score** | The plain average of the six axes. No hidden weights.                                                                                                                                                    |
| **Tiers**         | `OVERCLOCKED` 9.0+ (all-time list) · `OPTIMAL` 8.0–8.9 · `STABLE` 7.0–7.9 · `GLITCHED` 5.0–6.9 · `CORRUPTED` 0–4.9 (skip it).                                                                            |
| **Provisional**   | A `Playing` game shows its score labelled "PROVISIONAL — RUN AT N%" until it is finished.                                                                                                                |
| **Queue**         | Upcoming games, each with a `HIGH` / `MED` / `LOW` priority, platform, release window and a note.                                                                                                        |

Dropped games stay in the library but are left out of aggregate stats such as the average score, tier distribution, axis profile and genre averages. Hours still count them.

### Pages

The prototype is a single-page app with in-memory navigation. In Next.js each screen should become its own route:

| Screen                                                       | Suggested route | Contents                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Home**                                                     | `/`             | Hero ("Games played. Reports filed.") with a large hexagon logo badge and a circular "PLAYING AND ENJOYING VIDEOGAMES ◆ SINCE 1999" text ring. KPI chips (games logged, total hours, average score). Two angled scrolling tickers. **01 Now playing** (cards with progress bar and hours). **02 Latest reports** (last 3 completed). **03 Hall of fame** (top 5 by score). **Next in queue** promo card.                                 |
| **Library** ("The archive — Every game logged.")             | `/library`      | Full-text search over title, developer, genre and platform. Status filter chips (All / Playing / Completed / Dropped). Sort by Recent / Score / Hours / A–Z. Grid or list view. Pagination at 12 per page. Shows a "filtered of total entries" counter and an empty state.                                                                                                                                                               |
| **Game report**                                              | `/games/[slug]` | Cover, big hex score badge, tags, title, developer, quoted verdict, tier stamp, provisional flag. **01 Score matrix**: hexagonal radar chart plus a per-axis bar breakdown with axis descriptions. **02 Full report**: rich content blocks, then pros ("+ Systems nominal") and cons ("− Errors detected"). Sticky **Pilot data** sidebar (status, platform, developer, playtime, date, progress, tier). Previous and next report links. |
| **Telemetry** ("Pilot telemetry.")                           | `/telemetry`    | KPI tiles (games logged, hours played, completed, average score). **01 Pilot profile**: radar of the six axes averaged across all rated games ("taste fingerprint"). **02 Rating tiers** distribution. **03 Hours by platform**. **04 Genre scan**: average score and game count per genre.                                                                                                                                              |
| **Queue** ("Loading bay — Up next.")                         | `/queue`        | Intro ("priority is set by hype, free time and how loudly friends keep asking"). Counts per priority. List of queued games with priority stamps.                                                                                                                                                                                                                                                                                         |
| **Protocol** ("How scores are computed — Scoring protocol.") | `/protocol`     | Methodology: **01 Six axes** with descriptions. **02 Rating tiers** with ranges. **03 About the pilot** ("Human pilot. Robot patience.").                                                                                                                                                                                                                                                                                                |

Shared on every page:

- **Header**: sticky. Logo with "PEPPOBOT / PILOT LOG // GAME REPORTS". Nav: Home · Library · Telemetry · Queue · Protocol (Library stays active on game pages). "ONLINE" status dot. Below 760px it switches to a hexagon hamburger that opens a full-screen numbered menu. The bottom border lights up once the page is scrolled.
- **"Find Peppobot" band** ("Add me · Watch me · Challenge me"): gamertag cards for PlayStation Network, Xbox Live, Steam, Epic Games, Nintendo Switch (friend code), Twitch, YouTube and Discord. Each card has an icon and links out. **The URLs and handles in the prototype are placeholders.**
- **Footer**: "© 2026 PEPPOBOT · REPORTS WRITTEN BY A ROBOT, FOR HUMANS · BUILD 4.2.0 · ALL SCORES FINAL UNTIL PATCHED".

### Review content blocks

A long-form review is an ordered list of blocks. If a game has no blocks, its `review` paragraphs are used instead:

- `h`: section heading with a small coloured hexagon
- `p`: body paragraph
- `img` + `caption`: single 16:9 figure
- `pair` (`a`, `b`, `caption`): two side-by-side 4:3 figures
- `quote` (optional `color`): big angled pull quote
- `facts`: grid of key/value stat tiles (for example HOURS PLAYED 9, BOSSES DOWN 3)

Accent colours rotate green, purple, pink when a block doesn't set one. That maps naturally to MDX or a small typed block schema.

### Sample data in the prototype

The prototype hard-codes 17 games, among them Metroid Prime 4, Ghost of Yōtei, Hades II, Silksong, Clair Obscur: Expedition 33, Baldur's Gate 3, Elden Ring and Balatro. Only Metroid Prime 4 has a full block-based review. It also has 5 queue entries. Cover art, key art and screenshots are striped placeholders. All of it is seed content to replace with real data.

---

## Visual design system

Dark, angular, "mecha HUD" style: hexagons everywhere, clipped corners, outlined display type and tilted stamps.

**Colours** (from the default "Green / Purple" palette):

| Token                           | Value                                             | Use                                        |
| ------------------------------- | ------------------------------------------------- | ------------------------------------------ |
| `--bg`                          | `#100a18`                                         | page background, text on accent fills      |
| `--surface` / `--surface-hover` | `#1a1126` / `#2a1640`                             | cards, rows, inputs                        |
| `--line`                        | `#3e2c56`                                         | radar grid                                 |
| `--fg` → `--fg-faint`           | `#f3eefa` `#ddd3ec` `#c4b8d8` `#a595bf` `#7a6a92` | text scale                                 |
| `--acc`                         | `#5cff8a` (green)                                 | primary accent, Playing, OVERCLOCKED       |
| `--acc2`                        | `#b65cff` (purple)                                | secondary accent, Completed, STABLE        |
| `--acc3`                        | `#ff5cd6` (pink)                                  | tertiary accent, provisional, cons         |
| —                               | `#a8ff5c` / `#ff8a5c` / `#ff5c7a`                 | OPTIMAL / GLITCHED / CORRUPTED and Dropped |

The prototype also has two alternate palettes behind a `palette` prop. They only swap the three accents: **Lime / Violet** (`#c6ff3d #8a1fd6 #ff5c8a`) and **Mint / Magenta** (`#3dffc6 #ff5cd6 #ffd65c`).

**Type**: Chakra Petch (display: uppercase headings, labels, buttons), IBM Plex Sans (body), JetBrains Mono (data, tags and numbers, spaced with wide letter-spacing).

**Recurring motifs**:

- **Hexagon**: `clip-path: polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)`. Used for score badges, section numbers (01, 02…), the logo frame and page buttons.
- **Clipped-corner cards** and **arrow-shaped buttons** built with `clip-path`.
- A dot-matrix hexagon pattern generated as an SVG path (`dotHex`).
- **Headings** mix a solid word with an outlined word (`-webkit-text-stroke`). Hero titles add a tilted highlighter block ("played.", "game", "telemetry.", "next.", "protocol.").
- **Stamps** rotated by −3°: tier labels and priorities.
- **Radar chart**: 300×300 SVG hexagon with 5 rings, centre (150,150) and radius 105.
- The logo (`public/peppobot.png`) is black line art shown with `filter: invert(1); mix-blend-mode: screen`.

The site is designed mobile-first, with a breakpoint at 760px. Layouts mostly use `auto-fit` / `minmax` grids.

---

## Repository layout

```
design/                     Claude Design export (reference only, not built)
  Peppobot v2.dc.html       the v2 prototype: markup + data + logic
  support.js                Claude Design "dc-runtime" that renders .dc.html files
  assets/peppobot.png       logo
public/peppobot.png         logo used by the app
src/app/                    Next.js App Router
  globals.css               design tokens exposed to Tailwind v4 (`bg-acc`, `text-fg-dim`, `font-display`…)
  [lang]/layout.tsx         root layout: fonts, localized metadata, top/bottom bars
  [lang]/page.tsx           placeholder home page
src/components/             TopBar (desktop + mobile menu, EN/IT switch), FindPeppobot (gamertags), BottomBar, nav config
public/icons/               platform icons for the gamertag cards
src/i18n/                   locales config, dictionaries (en.json, it.json), getDictionary()
src/proxy.ts                redirects unprefixed URLs to /en or /it
```

## Stack

- [Next.js](https://nextjs.org) 16 (App Router, Turbopack) · React 19 · TypeScript
- Tailwind CSS v4. Tokens are defined in `src/app/globals.css` under `@theme`.
- Fonts via `next/font/google`

## Internationalization

The site is in English (`en`, the default) and Italian (`it`). Every route lives under `src/app/[lang]/`, so URLs always carry the language: `/en/library`, `/it/library`.

- **Language picking**: [`src/proxy.ts`](src/proxy.ts) redirects any URL without a language (for example `/` or `/library`) to one. It uses the `NEXT_LOCALE` cookie if set, otherwise the browser's `Accept-Language` header, otherwise `en`.
- **Switching**: the EN / IT switch in the top bar keeps the current page, changing only the language, and saves the choice in the `NEXT_LOCALE` cookie.
- **Strings**: [`src/i18n/dictionaries/en.json`](src/i18n/dictionaries/en.json) and [`it.json`](src/i18n/dictionaries/it.json). `en.json` defines the `Dictionary` type, so a key missing from `it.json` fails type-checking.
- **Server components** call `await getDictionary()` (and `getLocale()`). These read the language from the URL through `next/root-params`, so nothing has to pass it down.
- **Client components** can't read the dictionary themselves. They get the strings they need as props from a server component, as `TopBar` does.
- **SEO**: each language is prerendered statically. `<html lang>`, the title and description are localized, and the pages declare `canonical` and `hreflang` alternate links.

To add a language, add its code to `locales` in [`src/i18n/config.ts`](src/i18n/config.ts), create its JSON dictionary and register it in [`src/i18n/dictionaries.ts`](src/i18n/dictionaries.ts).

## Getting started

```bash
npm install
npm run dev      # http://localhost:4888
npm run build    # production build
npm run lint
```

## Suggested next steps

1. Define a `Game` type and move the seed data into `src/content/` (or MDX per game for long reviews). Do the same for the queue.
2. Build shared primitives: `Hex`, `HexBadge` (score), `SectionTitle` (number + solid/outlined words), `Stamp`, `ClipCard`, `ArrowButton`, `RadarChart`, `BarRow`.
3. Implement the routes listed above. Use static generation for `/games/[slug]` with `generateStaticParams`.
4. Replace placeholder art with real cover art and screenshots, and the gamertag URLs and handles with real ones.
5. Add per-page metadata and Open Graph images, a sitemap and RSS for new reports.
