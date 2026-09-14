import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Node.js < 22 has no native WebSocket in SSR; @supabase/supabase-js needs one
// to construct its Realtime client even when Realtime features aren't used.
const transport =
	typeof WebSocket === 'undefined' ? ((await import('ws')).default as never) : undefined;

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
	realtime: transport ? { transport } : undefined
});
