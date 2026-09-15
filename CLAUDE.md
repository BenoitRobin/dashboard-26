# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This started as a freshly-scaffolded SvelteKit project (via `sv create`). The `demo/` routes under `src/routes/` are still unmodified scaffold defaults (not established architecture, safe to ignore/replace). Real application code has since been added: Supabase Auth (`LoginModal`), shadcn-svelte UI components, and a Drizzle-backed task list (`src/routes/tasks/`) — see the sections below for their patterns.

## Commands

- `npm run dev` — start the dev server (add `-- --open` to open a browser tab)
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run check` — sync SvelteKit types and type-check with `svelte-check`
- `npm run check:watch` — same, in watch mode
- `npm run lint` — check formatting (`prettier --check .`) and lint (`eslint .`)
- `npm run format` — auto-format with Prettier
- `npm run test` / `npm run test:e2e` — install Playwright browsers and run e2e tests

Run a single Playwright test with `npx playwright test <path-to-file>` (e.g. `npx playwright test src/routes/demo/playwright/page.svelte.e2e.ts`). The Playwright config auto-starts the app via `npm run build && npm run preview` on port 4173, so e2e tests exercise a production build, not the dev server.

## Architecture notes

- **Svelte 5 runes mode is force-enabled** for all project files via `vite.config.ts` (`compilerOptions.runes`), regardless of individual file compiler settings — but not for code under `node_modules`. Use runes (`$props()`, `$state()`, etc.), not the legacy `export let` / reactive-statement API.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite`, with `@tailwindcss/forms` and `@tailwindcss/typography` plugins. Global styles live in `src/routes/layout.css`, imported from `src/routes/+layout.svelte`.
- **shadcn-svelte**: initialized via `npx shadcn-svelte@latest`, config in `components.json` (style `nova`, base color `neutral`, icon library `lucide`). Add components with `npx shadcn-svelte@latest add <name>`, which vendors them into `src/lib/components/ui/<name>/` — treat those files as generated/regenerable, not hand-maintained (`add` will overwrite on reinstall). CSS variables/theme tokens live in `src/routes/layout.css` (added by `init`, alongside the existing Tailwind imports/plugins); `src/lib/utils.ts` exports the `cn()` helper. `eslint.config.js` disables `svelte/no-navigation-without-resolve` for `src/lib/components/ui/**` since the generated `Button`'s `href` is a passthrough prop, not a static app route. `npx shadcn-svelte@latest init` re-run non-interactively needs `--preset`, `--css`, and all five `--*-alias` flags (`$lib`, `$lib/components`, `$lib/components/ui`, `$lib/utils`, `$lib/hooks`) or it drops into an interactive TUI wizard.
- **Path aliases**: `$lib` maps to `src/lib` (SvelteKit convention); re-exports go through `src/lib/index.ts`.
- **E2e test naming convention**: Playwright specs use the `*.e2e.ts` suffix (see `testMatch` in `playwright.config.ts`) and live alongside the route they test (e.g. `src/routes/demo/playwright/page.svelte.e2e.ts` tests `src/routes/demo/playwright/+page.svelte`).
- **Adapter**: uses `@sveltejs/adapter-auto`, which picks a deployment adapter based on environment at build time. Swap to a specific adapter (e.g. `adapter-node`, `adapter-vercel`) once a deployment target is settled.

## Supabase

- Backend: Supabase project `dashboard-26` (ref `bgymrlyyusydntraxqgx`, region `eu-west-3`, org `BenoitRobin`). Currently an empty database — no tables yet.
- Client: `src/lib/supabaseClient.ts` exports `supabase`, created from `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` in `$env/static/public`. Import `supabase` from `$lib/supabaseClient` rather than instantiating a new client elsewhere.
- Env vars live in `.env` (gitignored); `.env.example` documents the required keys with empty values. Both use the `PUBLIC_` prefix required by SvelteKit to expose them client-side — only the anon/publishable key belongs there, never a service-role/secret key.
- Schema changes should go through Supabase migrations (`apply_migration` / the Supabase CLI), not ad hoc SQL, so the project stays reproducible.
- **SSR WebSocket gotcha**: Node.js < 22 has no native `WebSocket` global, but `@supabase/supabase-js` constructs a `RealtimeClient` (which needs one) inside `createClient()` regardless of whether Realtime is used — this crashes any SSR'd route that imports `supabaseClient.ts` on Node 20/21. `src/lib/supabaseClient.ts` works around this by conditionally passing the `ws` package as the `realtime.transport` when `WebSocket` is undefined. Keep this guard if you ever touch that file.

## Database (Drizzle)

- **Schema**: `src/lib/server/db/schema.ts` defines `tasks` (id, `user_id` FK → `auth.users(id)` cascade-delete, title, nullable description, `completed` boolean default false, `created_at`). `authUsers` in that file is a minimal stub (`pgSchema('auth').table('users', { id })`) that exists only so Drizzle can type/FK against Supabase Auth's real `auth.users` table — it is never migrated by us (Supabase owns that table).
- **DB client**: `src/lib/server/db/index.ts` exports `db` (a `drizzle-orm/postgres-js` instance). Lives under `src/lib/server/`, SvelteKit's server-only boundary, so it — and the `DATABASE_URL` it reads via `$env/static/private` — can never end up in the client bundle. Import as `import { db } from '$lib/server/db'`.
- **`DATABASE_URL`**: Supabase's **pooled** (pgbouncer transaction-mode, port 6543) connection string — the direct/5432 string is not used, since `adapter-auto` hasn't settled on a deploy target yet and pooled works safely under both serverless and long-lived-server deploys. `postgres(DATABASE_URL, { prepare: false })` — `prepare: false` is required for the pgbouncer pooler (it doesn't support session-level prepared statements). This var is a manual, per-environment secret (Supabase Dashboard → Project Settings → Database → Connection string → "Transaction" mode) — no MCP tool can retrieve it.
- **Migration workflow — Drizzle generates, Supabase applies**: run `npx drizzle-kit generate` (config: `drizzle.config.ts`) to diff `schema.ts` into SQL under `drizzle/<n>_<name>.sql` — this is local-only, no DB connection needed. **Before applying**, strip any `CREATE TABLE "auth"."users"` statement Drizzle generates for the `authUsers` stub (that table already exists; Drizzle doesn't know it's external) and, for a new table holding user data, append `ENABLE ROW LEVEL SECURITY` + per-action policies (`auth.uid() = user_id`) — see `drizzle/0000_icy_ozymandias.sql` for the pattern. Apply the edited SQL via the `apply_migration` MCP tool (or Supabase CLI), **never** `drizzle-kit push`/`migrate` against `DATABASE_URL` directly — Supabase's own migration history must stay the source of truth, per the Supabase section below. Keep `drizzle/` (including `drizzle/meta/`) committed — `generate` needs its local journal/snapshots to compute future diffs as `ALTER TABLE`s instead of full recreates. Mirror each applied migration's SQL into `supabase/migrations/<timestamp>_<name>.sql` too, for a reproducible audit trail.
- **RLS is defense-in-depth, not the auth boundary for server code**: `DATABASE_URL`'s Postgres role owns the tables and bypasses RLS, so policies only constrain the anon-key client-side `supabase` client (`src/lib/supabaseClient.ts`, via PostgREST) if it's ever used to query these tables directly. Every Drizzle query from server code (e.g. `src/routes/tasks/+page.server.ts`) must still explicitly filter by the authenticated `user.id` itself.

## Auth

- No signup flow yet — only sign-in exists, via `LoginModal` (see below). Supabase Auth users must currently be created manually (e.g. Supabase Studio → Authentication → Users).
- `src/lib/components/LoginModal.svelte`: self-contained "Connexion" trigger button + modal dialog, built on `bits-ui`'s `Dialog` primitive (headless, handles focus trap/Escape/overlay-click/ARIA). Calls `supabase.auth.signInWithPassword`. Rendered from `src/routes/+page.svelte`. There is no signed-in UI state yet (no logout button, no session-aware header) — that's still to be built; a successful login currently just closes the modal.
- **Server-side session access (`hooks.server.ts`)**: `src/lib/supabaseClient.ts`'s client is built with `createBrowserClient` (from `@supabase/ssr`, not plain `createClient`), so `LoginModal`'s session persists via cookies instead of `localStorage` — that's what makes it visible server-side. `src/hooks.server.ts` creates a per-request server client (`createServerClient`, wired to `event.cookies`) and exposes `event.locals.supabase` + `event.locals.safeGetSession()` (validates the session via `getUser()`, never trusts the raw JWT from `getSession()` alone). Any `+page.server.ts`/`+server.ts` needing the current user calls `await locals.safeGetSession()` — see `src/routes/tasks/+page.server.ts`. Both the browser and server Supabase clients need the same Node<22 WebSocket transport workaround (see the Supabase section above) since `@supabase/ssr`'s `createServerClient` constructs its own independent `SupabaseClient`/`RealtimeClient` — don't add one without the other.
- **`@supabase/ssr` is pinned to the exact version `0.12.0`** (not a caret range) in `package.json`. Newer `@supabase/ssr` versions require `@supabase/supabase-js` ^2.114+, which requires Node ≥22 — incompatible with this project's Node 20 support (see the SSR WebSocket gotcha above, and `engine-strict=true` in `.npmrc`). Don't bump `@supabase/ssr` without checking its peer `@supabase/supabase-js` requirement against this constraint first.
- This is still scoped minimally (cookie-synced session + `safeGetSession()` for server routes) — the fuller official Supabase SSR recipe's `+layout.ts` reactive auth-state invalidation (`onAuthStateChange`, `depends('supabase:auth')`) is not implemented, consistent with "no signed-in UI state yet" above.
- No other UI component library is installed. `bits-ui` was chosen for this dialog because it's headless and Svelte-5-native (snippet-based); prefer it over hand-rolling `<dialog>` for future overlay-style components (dropdowns, popovers, etc.) to keep accessibility handling consistent.
