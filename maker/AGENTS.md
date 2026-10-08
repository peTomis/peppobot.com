<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Maker

Local-only editor for the `games` collection. It is never deployed. See "The maker" in the root `README.md` and the rules in the root `AGENTS.md`.

- It shares the site's code through `@/*` → `../src/*` and the root `node_modules`. Run it from the repo root with `npm run maker`.
- Env comes from `maker/.env*`, not the root.
- The preview (`app/preview`) must render the site's real `GameReport`. Do not fork it into a maker-only copy.
