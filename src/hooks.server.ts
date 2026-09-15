import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Node.js < 22 has no native WebSocket in SSR; @supabase/supabase-js needs one
// to construct its Realtime client even when Realtime features aren't used.
// (Same workaround as src/lib/supabaseClient.ts, needed again here because
// createServerClient constructs its own independent SupabaseClient instance.)
const transport =
	typeof WebSocket === 'undefined' ? ((await import('ws')).default as never) : undefined;

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		realtime: transport ? { transport } : undefined,
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				for (const { name, value, options } of cookiesToSet) {
					event.cookies.set(name, value, { ...options, path: options.path ?? '/' });
				}
			}
		}
	});

	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) {
			return { session: null, user: null };
		}

		// getSession() reads the session from the (unverified) cookie JWT; re-validate
		// against Supabase Auth via getUser() before trusting the session's identity.
		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) {
			return { session: null, user: null };
		}

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};
