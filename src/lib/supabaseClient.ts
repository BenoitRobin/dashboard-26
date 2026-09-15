import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Node.js < 22 has no native WebSocket in SSR; @supabase/supabase-js needs one
// to construct its Realtime client even when Realtime features aren't used.
const transport =
	typeof WebSocket === 'undefined' ? ((await import('ws')).default as never) : undefined;

// createBrowserClient (vs. plain createClient) persists the session via cookies
// instead of localStorage, so server routes (see hooks.server.ts) can read it too.
export const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
	realtime: transport ? { transport } : undefined
});
