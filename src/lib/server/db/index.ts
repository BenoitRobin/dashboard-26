import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DATABASE_URL } from '$env/static/private';
import * as schema from './schema';

// prepare: false is required for Supabase's pgbouncer transaction-mode pooler,
// which doesn't support session-level prepared statements.
const client = postgres(DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });
