<script lang="ts">
	import Game from '#lib/components/Game.svelte';
	import type { PageProps } from './$types';

	let { params, data }: PageProps = $props();
</script>

{#key params.mode}
	<Game mode={params.mode} daily={true} launch={data.launch} />
{/key}
