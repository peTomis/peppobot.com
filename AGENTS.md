<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project

Read `README.md` first. Two Next.js apps share this repo, its `node_modules` and one MongoDB database:

- **Site** (root, `src/`): the public website, deployed on AWS Amplify. Read-only access to MongoDB. `npm run dev` → port 4888.
- **Maker** (`maker/`): a local-only editor that writes games to MongoDB. `npm run maker` → port 4889. It has no auth and must never be deployed, built by `npm run build` or imported from `src/`.

### Rules

- `src/` must not import from `maker/`. The maker imports from `src/` through `@/*` (mapped to `../src/*` in `maker/tsconfig.json`), so changes to shared code (`src/content/games.ts`, `src/components/game-report.tsx`, the dictionaries, `src/lib/mongodb.ts`, `src/app/fonts.ts`) affect both apps. Check the maker when you change them.
- `src/content/games.ts` is the schema. When you add a game field, update `GameFields` and `normalizeGame`, the projections in `src/lib/games.ts` (fields are listed explicitly), and the maker's `Draft`, `emptyDraft`, `toDraft`, `toFields` in `maker/lib/draft.ts` plus its form.
- Fields that only apply to ended runs (`scores`, `average`, `finishedOn`, `pros`, `cons`, `gacha`) are hidden by `normalizeGame` for other statuses. Do not rely on them being null in the database.
- Platforms and genres are stored as numeric ids. Never renumber the existing ones in `PLATFORMS` / `GENRES`. Add new ids at the end. A new genre also needs its two axis criteria in `protocol.genreAxes` in both dictionaries.
- Content texts are `Translated` (`{ key, value }[]`) and are read with `pickTranslation()`. UI strings go in `src/i18n/dictionaries/{en,it}.json`, which must have the same keys (`en.json` defines the type).
- Code under `src/lib/` is `server-only`. Client components receive data and strings as props.
- The `data` collection (telemetry and home KPIs) is precomputed by the maker after every save (`computeData` in `maker/lib/data.ts`). Do not add per-request aggregations over `games` on the site. When you change `Data` or how a figure is defined, update `computeData` too.
- Image hosts are listed in both `next.config.ts` and `maker/next.config.ts`. Keep the two lists in sync.
- After changing dependencies, make sure `npm ci` still works with the npm version Amplify uses. See "Deployment" in the README.
- Run `npm run lint` and `npx tsc --noEmit` (root) plus `npx tsc --noEmit -p maker` before you finish.
