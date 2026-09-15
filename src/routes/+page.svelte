<script lang="ts">
	import { resolve } from '$app/paths';
	import LoginModal from '$lib/components/LoginModal.svelte';
</script>

<header class="flex items-center justify-between p-4">
	<span class="font-semibold text-slate-900">Dashboard 26'</span>
	<nav class="flex items-center gap-4">
		<a href={resolve('/tasks')} class="text-sm font-medium text-slate-700 hover:text-slate-900">
			Mes tâches
		</a>
		<LoginModal />
	</nav>
</header>
