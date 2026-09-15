<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let title = $state('');
	let description = $state('');
</script>

<div class="mx-auto max-w-lg p-4">
	<h1 class="mb-4 text-lg font-semibold text-slate-900">Mes tâches</h1>

	<form
		method="POST"
		action="?/create"
		use:enhance={() => {
			return async ({ update }) => {
				await update();
				title = '';
				description = '';
			};
		}}
		class="mb-6 space-y-3 rounded-lg border border-slate-200 p-4"
	>
		<div>
			<label for="task-title" class="mb-1 block text-sm font-medium text-slate-700">Titre</label>
			<input
				id="task-title"
				name="title"
				type="text"
				required
				bind:value={title}
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
			/>
		</div>

		<div>
			<label for="task-description" class="mb-1 block text-sm font-medium text-slate-700">
				Description
			</label>
			<textarea
				id="task-description"
				name="description"
				bind:value={description}
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
			></textarea>
		</div>

		{#if form?.error}
			<p role="alert" class="text-sm text-red-600">{form.error}</p>
		{/if}

		<button
			type="submit"
			class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus:ring-2 focus:ring-slate-400 focus:outline-none"
		>
			Ajouter
		</button>
	</form>

	{#if data.tasks.length === 0}
		<p class="text-sm text-slate-500">Aucune tâche pour l'instant.</p>
	{:else}
		<ul class="space-y-2">
			{#each data.tasks as task (task.id)}
				<li class="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
					<form method="POST" action="?/toggle" use:enhance>
						<input type="hidden" name="id" value={task.id} />
						<input type="hidden" name="completed" value={(!task.completed).toString()} />
						<button
							type="submit"
							aria-label={task.completed ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
							class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-slate-300"
						>
							{#if task.completed}✓{/if}
						</button>
					</form>

					<div class="flex-1">
						<p
							class="text-sm font-medium text-slate-900"
							class:line-through={task.completed}
							class:text-slate-400={task.completed}
						>
							{task.title}
						</p>
						{#if task.description}
							<p class="text-sm text-slate-500">{task.description}</p>
						{/if}
					</div>

					<form method="POST" action="?/delete" use:enhance>
						<input type="hidden" name="id" value={task.id} />
						<button
							type="submit"
							aria-label="Supprimer"
							class="text-sm text-slate-400 hover:text-red-600 focus:ring-2 focus:ring-slate-400 focus:outline-none"
						>
							&times;
						</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</div>
