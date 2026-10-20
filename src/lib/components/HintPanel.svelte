<script lang="ts">
	import type { Hints } from '#lib/types.js';

	type Props = { hints: Hints };
	let { hints }: Props = $props();
</script>

<div class="hints">
	{#if hints.category}
		<p class="category">{hints.category}</p>
	{/if}
	{#if hints.definition}
		<p>{hints.definition}</p>
	{/if}
</div>

<style>
	.hints {
		min-height: 2rem;
	}
	p {
		margin: 4px 0;
	}
	.category {
		font-size: 0.85rem;
		font-weight: bold;
		color: var(--filled);
	}
</style>
