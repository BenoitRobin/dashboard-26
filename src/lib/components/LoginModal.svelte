<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { supabase } from '$lib/supabaseClient';

	let dialogOpen = $state(false);
	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let errorMessage: string | null = $state(null);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		errorMessage = null;

		const { error } = await supabase.auth.signInWithPassword({ email, password });

		loading = false;

		if (error) {
			errorMessage = error.message;
			return;
		}

		email = '';
		password = '';
		dialogOpen = false;
	}
</script>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Trigger
		class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus:ring-2 focus:ring-slate-400 focus:outline-none"
	>
		Connexion
	</Dialog.Trigger>

	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-40 bg-black/50" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg"
		>
			<div class="mb-4 flex items-start justify-between">
				<Dialog.Title class="text-lg font-semibold text-slate-900">Connexion</Dialog.Title>
				<Dialog.Close
					class="text-slate-400 hover:text-slate-600 focus:ring-2 focus:ring-slate-400 focus:outline-none"
					aria-label="Fermer"
				>
					&times;
				</Dialog.Close>
			</div>

			<Dialog.Description class="sr-only">
				Entrez vos identifiants pour vous connecter.
			</Dialog.Description>

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="login-email" class="mb-1 block text-sm font-medium text-slate-700">
						Email
					</label>
					<input
						id="login-email"
						type="email"
						autocomplete="email"
						required
						bind:value={email}
						class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
					/>
				</div>

				<div>
					<label for="login-password" class="mb-1 block text-sm font-medium text-slate-700">
						Mot de passe
					</label>
					<input
						id="login-password"
						type="password"
						autocomplete="current-password"
						required
						bind:value={password}
						class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
					/>
				</div>

				{#if errorMessage}
					<p role="alert" class="text-sm text-red-600">{errorMessage}</p>
				{/if}

				<button
					type="submit"
					disabled={loading}
					class="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus:ring-2 focus:ring-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
				>
					{loading ? 'Connexion…' : 'Connexion'}
				</button>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
