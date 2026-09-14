# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This is a freshly-scaffolded SvelteKit project (via `sv create`) with no application code yet beyond the default template. The routes, layout, and demo files under `src/routes/` are scaffold defaults, not established architecture — there is no existing pattern to follow when adding real features.

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
- **Path aliases**: `$lib` maps to `src/lib` (SvelteKit convention); re-exports go through `src/lib/index.ts`.
- **E2e test naming convention**: Playwright specs use the `*.e2e.ts` suffix (see `testMatch` in `playwright.config.ts`) and live alongside the route they test (e.g. `src/routes/demo/playwright/page.svelte.e2e.ts` tests `src/routes/demo/playwright/+page.svelte`).
- **Adapter**: uses `@sveltejs/adapter-auto`, which picks a deployment adapter based on environment at build time. Swap to a specific adapter (e.g. `adapter-node`, `adapter-vercel`) once a deployment target is settled.

## Supabase

- Backend: Supabase project `dashboard-26` (ref `bgymrlyyusydntraxqgx`, region `eu-west-3`, org `BenoitRobin`). Currently an empty database — no tables yet.
- Client: `src/lib/supabaseClient.ts` exports `supabase`, created from `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` in `$env/static/public`. Import `supabase` from `$lib/supabaseClient` rather than instantiating a new client elsewhere.
- Env vars live in `.env` (gitignored); `.env.example` documents the required keys with empty values. Both use the `PUBLIC_` prefix required by SvelteKit to expose them client-side — only the anon/publishable key belongs there, never a service-role/secret key.
- Schema changes should go through Supabase migrations (`apply_migration` / the Supabase CLI), not ad hoc SQL, so the project stays reproducible.
- **SSR WebSocket gotcha**: Node.js < 22 has no native `WebSocket` global, but `@supabase/supabase-js` constructs a `RealtimeClient` (which needs one) inside `createClient()` regardless of whether Realtime is used — this crashes any SSR'd route that imports `supabaseClient.ts` on Node 20/21. `src/lib/supabaseClient.ts` works around this by conditionally passing the `ws` package as the `realtime.transport` when `WebSocket` is undefined. Keep this guard if you ever touch that file.

## Auth

- No signup flow yet — only sign-in exists, via `LoginModal` (see below). Supabase Auth users must currently be created manually (e.g. Supabase Studio → Authentication → Users).
- `src/lib/components/LoginModal.svelte`: self-contained "Connexion" trigger button + modal dialog, built on `bits-ui`'s `Dialog` primitive (headless, handles focus trap/Escape/overlay-click/ARIA). Calls `supabase.auth.signInWithPassword`. Rendered from `src/routes/+page.svelte`. There is no signed-in UI state yet (no logout button, no session-aware header) — that's still to be built; a successful login currently just closes the modal, relying on supabase-js's default `localStorage` session persistence for future work to build on.
- No other UI component library is installed. `bits-ui` was chosen for this dialog because it's headless and Svelte-5-native (snippet-based); prefer it over hand-rolling `<dialog>` for future overlay-style components (dropdowns, popovers, etc.) to keep accessibility handling consistent.
