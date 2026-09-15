import { pgSchema, pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';

// Stub referencing Supabase Auth's real auth.users table.
// Not managed by our migrations — auth.users is owned/migrated by Supabase itself.
export const authUsers = pgSchema('auth').table('users', {
	id: uuid('id').primaryKey()
});

export const tasks = pgTable('tasks', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => authUsers.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description'),
	completed: boolean('completed').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
