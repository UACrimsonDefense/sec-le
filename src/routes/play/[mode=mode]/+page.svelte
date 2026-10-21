<script lang="ts">
	import Game from '#lib/components/Game.svelte';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();
</script>

{#key params.mode}
	<Game mode={params.mode} daily={false} />
{/key}
