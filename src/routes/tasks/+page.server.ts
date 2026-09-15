import { and, desc, eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) {
		redirect(303, '/');
	}

	const userTasks = await db
		.select()
		.from(tasks)
		.where(eq(tasks.userId, user.id))
		.orderBy(desc(tasks.createdAt));

	return { tasks: userTasks };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) {
			redirect(303, '/');
		}

		const formData = await request.formData();
		const title = String(formData.get('title') ?? '').trim();
		const description = String(formData.get('description') ?? '').trim();

		if (!title) {
			return fail(400, { error: 'Le titre est requis.' });
		}

		await db.insert(tasks).values({
			userId: user.id,
			title,
			description: description || null
		});
	},

	delete: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) {
			redirect(303, '/');
		}

		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');

		if (!id) {
			return fail(400, { error: 'Identifiant de tâche manquant.' });
		}

		await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, user.id)));
	},

	toggle: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) {
			redirect(303, '/');
		}

		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const completed = formData.get('completed') === 'true';

		if (!id) {
			return fail(400, { error: 'Identifiant de tâche manquant.' });
		}

		await db
			.update(tasks)
			.set({ completed })
			.where(and(eq(tasks.id, id), eq(tasks.userId, user.id)));
	}
};
