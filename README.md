# peppobot.com

Source for **[www.peppobot.com](https://www.peppobot.com)**: Peppobot's personal video game log and review site.

> **PEPPOBOT — GAME LOG // DIAGNOSTIC REPORTS**
> _Games played. Reports filed._

The repository holds two Next.js apps that share code and one MongoDB database:

| App       | Folder             | Runs                     | Purpose                                                                                |
| --------- | ------------------ | ------------------------ | -------------------------------------------------------------------------------------- |
| **Site**  | repo root (`src/`) | AWS Amplify (production) | The public website. Reads only.                                                        |
| **Maker** | [`maker/`](maker/) | **Locally only**         | Editor for creating and updating games, with a live preview of the site's report page. |

The maker is never deployed. `next build` only builds the site: the root `tsconfig.json` excludes `maker/`, and the maker has no build or start script.

---

## What the site does

Peppobot is a human gamer with a "robot persona". He keeps a public log of every game: what he's playing now, what he finished, what he dropped and what's coming next. Each finished game gets six axis scores, an average, a tier and a written report. The copy reads like a robot's ship log: "pilot", "runs", "telemetry", "systems nominal / errors detected", "all verdicts final until patched".

### Core concepts

| Concept              | Meaning                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Game**             | One logged title. Type `Game` in [`src/content/games.ts`](src/content/games.ts).                                                                                                              |
| **Status**           | `Playing`, `Completed`, `Dropped`, `Not Started`. Only ended runs (`Completed` / `Dropped`) show scores, an end date, pros, cons and the gacha banner; `normalizeGame()` hides those fields for other statuses. |
| **Six axes**         | Rated 0–10, in this order: **Gameplay**, **Visuals**, **Audio**, **Genre I**, **Genre II**, **Signature**. The two genre axes use criteria set per genre (see the protocol page).             |
| **Average**          | The plain average of the six axes, to one decimal. It is stored on the game (`average`) when the maker saves it, and is null until all six axes are scored.                                   |
| **Tiers**            | `OVERCLOCKED` 9.0+ · `OPTIMAL` 8.0–8.9 · `STABLE` 7.0–7.9 · `GLITCHED` 5.0–6.9 · `CORRUPTED` 0–4.9 (`TIERS` in `games.ts`).                                                                   |
| **Platform / Genre** | Stored as numeric ids. The names and logos come from `PLATFORMS` and `GENRES` in `games.ts`. A game has one main `platform` and an optional `alsoPlayedOn` list.                              |

### Pages

Every page is under a language prefix (`/en/…`, `/it/…`).

| Route                  | Contents                                                                                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/[lang]`              | Hero with KPI chips (from `/api/data`), now playing, latest reports (last 3 completed), hall of fame (top 5 completed by average) and next in queue.                                      |
| `/[lang]/library`      | Search (title, developer, genre, platform), status filter, sort (recent / score / hours / A–Z) and pagination at 12 per page. State lives in the URL query.                               |
| `/[lang]/library/[id]` | Game report: score badge, radar and per-axis bars, report blocks, pros and cons, pilot data sidebar, links to the previous and next report. `id` is the game's slug or its MongoDB `_id`. |
| `/[lang]/telemetry`    | Site-wide figures from the `data` document: KPIs, axis profile, tier distribution, hours by platform, genre scan.                                                                         |
| `/[lang]/protocol`     | Scoring method: the six axes, genre calibration table, tiers, about the pilot. Fully static.                                                                                              |

Every page also has the top bar (desktop nav, mobile menu, EN/IT switch), the "Find Peppobot" gamertag band and the bottom bar.

### Report blocks

A game's written report is an ordered list of `ReportBlock`s: `heading`, `paragraph`, `image`, `pair` (two images), `quote` and `facts` (label/value tiles). Every text is a `Translated` value (see below). Blocks without an `accent` take the next accent in turn.

---

## Data

The content lives in MongoDB. There is no seed data and no static fallback.

### `games` collection

One document per game, matching `GameFields` in [`src/content/games.ts`](src/content/games.ts). Pages use the optional string `id` as the URL slug; a game without one is reached by its `_id`. Suggested indexes: unique `{ id: 1 }` (sparse), `{ finishedOn: -1, _id: 1 }`, `{ status: 1 }`.

Texts written by Peppobot (description, signature, pros, cons, report blocks) are stored as `Translated`, a list of `{ key: "en" | "it", value }`. `pickTranslation()` shows the page's language, then English, then whatever exists.

Dates (`releasedOn`, `finishedOn`) are Unix timestamps in milliseconds, read in UTC.

### `data` collection

One document with site-wide figures, typed `Data` in [`src/content/data.ts`](src/content/data.ts): count, hours, average score, completed count, axis averages, tier counts, hours per platform and genre averages. Score figures count completed games only. The home KPIs and the telemetry page read this document as it is and do not aggregate the games.

> The maker recomputes the `data` document from every game after each save (`maker/lib/data.ts`). Edits made to `games` outside the maker leave it stale until the next save. The site caches it for up to 60 seconds.

### Server helpers and API

- [`src/lib/mongodb.ts`](src/lib/mongodb.ts): one lazy connection pool per process. Building the site does not need a database.
- [`src/lib/games.ts`](src/lib/games.ts): `getGames`, `getPlayingGames`, `getLatestReports`, `getTopRated`, `getNextInQueue`, `getLibraryPage`, `getGameReport`, `getGame`. Every query uses an explicit projection, so new database fields never leak to pages or the API.
- [`src/lib/data.ts`](src/lib/data.ts): `getData()`, cached with `"use cache"` and revalidated every 60 seconds.

Public read-only endpoints, outside the language prefix:

- `GET /api/games?limit=50&offset=0` returns `{ games, limit, offset }`, sorted by `finishedOn` descending. `limit` is 1–100. Invalid values return 400.
- `GET /api/games/[id]` returns `{ game }`, looked up by slug, then by `_id`. Unknown games return 404.
- `GET /api/data` returns the `data` document, with a 60-second HTTP cache.
- If MongoDB is unavailable or not configured, the endpoints return 503 with a generic error message.

---

## The maker (local only)

`npm run maker` starts the editor at **http://localhost:4889**. It is a separate Next.js app in `maker/` that:

- imports the site's code from `../src` through the `@/*` alias (types, `GameReport`, dictionaries, `getDatabase`, fonts), and uses the root `node_modules`;
- symlinks `maker/public` → `../public` and `maker/app/icon.png` → the site's icon;
- lists every game in a picker (`/?id=<MongoDB _id>` edits one, `/` starts a new one);
- edits all game fields, the six scores (the average is computed live), translated texts in EN and IT, pros and cons, and report blocks with drag-and-drop reordering;
- shows a live preview in an iframe (`/preview`) that renders the site's real `GameReport` component. The editor sends it the game with `postMessage`. The preview can switch between EN and IT and between a desktop (1280px) and mobile (390px) width;
- saves through a server action (`maker/app/actions.ts`) that writes directly to the `games` collection. It checks that the slug is lowercase letters, digits and dashes and is not used by another game. Empty texts and lists are cleaned up before saving.

The maker has **no authentication**. It writes to whatever database its env points to, so never deploy it.

Next.js loads env files from the app's own folder, so the maker needs its own `maker/.env` (or `maker/.env.local`) with `MONGODB_URI` and `MONGODB_DB`. The root `.env*` files are not read by the maker.

---

## Getting started

```bash
cp .env.example .env.local          # site: set MONGODB_URI and MONGODB_DB
cp .env.example maker/.env.local    # maker: same variables
npm install
npm run dev      # site,  http://localhost:4888
npm run maker    # maker, http://localhost:4889
npm run build    # production build of the site
npm run lint     # lints both apps
```

## Stack

- [Next.js](https://nextjs.org) 16 (App Router, Turbopack, `cacheComponents`, `partialPrefetching`) · React 19 · TypeScript
- Tailwind CSS v4 through `@tailwindcss/turbopack`. Tokens are in [`src/app/globals.css`](src/app/globals.css). The `desk:` breakpoint is at 760px
- Fonts via `next/font/google` ([`src/app/fonts.ts`](src/app/fonts.ts), shared with the maker): Chakra Petch (display), IBM Plex Sans (body), JetBrains Mono (data)
- MongoDB Node driver 7
- The maker's drag-and-drop uses `@dnd-kit` (a dev dependency, since only the maker uses it)

## Internationalization

English (`en`, default) and Italian (`it`). All routes live under `src/app/[lang]/`.

- [`src/proxy.ts`](src/proxy.ts) redirects URLs without a language prefix. It checks the `NEXT_LOCALE` cookie first, then `Accept-Language`, then falls back to `en`. API routes and files are skipped.
- UI strings are in [`src/i18n/dictionaries/en.json`](src/i18n/dictionaries/en.json) and [`it.json`](src/i18n/dictionaries/it.json). `en.json` defines the `Dictionary` type, so a key missing from `it.json` fails type-checking.
- Server components call `getDictionary()` / `getLocale()`, which read `[lang]` through `next/root-params`. Client components get their strings as props.
- Content texts (from the database) use `Translated` and `pickTranslation()`, not the dictionaries.
- Each page sets `canonical` and `hreflang` links through `localizedAlternates()`.

To add a language: add it to `locales` in [`src/i18n/config.ts`](src/i18n/config.ts), add a dictionary and register it in [`src/i18n/dictionaries.ts`](src/i18n/dictionaries.ts). Then add it to the maker's preview (`maker/app/preview/page.tsx`) and to its translated inputs.

## Design

Dark, angular "mecha HUD" style, from a Claude Design prototype: hexagons (`.hex` clip-path), clipped-corner cards, headings that mix solid and outlined words, stamps rotated by −3°, and a 300×300 hexagonal radar. The accents are `--acc` (lime `#abff3d`), `--acc2` (violet `#8a1fd6`) and `--acc3` (pink `#f02670`). Tiers and the Dropped status use fixed colours (see `TIERS` and `STATUS_COLORS`). The logo (`public/peppobot.png`) is black line art, shown with `invert` + `mix-blend-screen`.

## Repository layout

```
src/
  app/[lang]/               site pages (home, library, library/[id], telemetry, protocol) and root layout
  app/api/                  read-only JSON endpoints (games, games/[id], data)
  app/fonts.ts              shared font setup (site + maker)
  app/globals.css           design tokens and Tailwind theme
  components/               site UI; game-report.tsx is also rendered by the maker preview
  content/                  types and constants: games.ts (Game, PLATFORMS, GENRES, AXES, TIERS), data.ts
  i18n/                     locales, dictionaries, translations, metadata helpers
  lib/                      server-only MongoDB access (mongodb.ts, games.ts, data.ts)
  proxy.ts                  language redirect
maker/                      local-only editor app (see above)
  app/                      page (editor), preview/ (iframe), actions.ts (save)
  components/               maker, fields, blocks-editor, preview-frame
  lib/                      draft.ts (Draft ⇄ stored game), games.ts (picker queries), preview.ts (postMessage types)
public/                     logo and platform icons (shared with the maker by symlink)
```

## Deployment

The site is deployed on **AWS Amplify** from `main`. Amplify runs `npm ci`, so `package-lock.json` must be in sync with `package.json` under Amplify's npm version. If Amplify uses an older npm than your machine, regenerate the lockfile with that version, for example `npx npm@10 install --package-lock-only`, or use the same Node version on both. Set `MONGODB_URI` and `MONGODB_DB` as environment variables in Amplify. Amplify only makes them available while the app builds, so [`amplify.yml`](amplify.yml) copies them into `.env.production`, where the server can read them at runtime.
