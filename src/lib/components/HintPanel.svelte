<script lang="ts">
	import type { Hints } from '#lib/types.js';

	type Props = { hints: Hints };
	let { hints }: Props = $props();
</script>

<div class="hints" aria-live="polite">
	{#if hints.acronym}
		<p class="acronym">{hints.acronym}</p>
	{/if}
	{#if hints.category}
		<p class="category">{hints.category}</p>
	{/if}
	{#if hints.definition}
		<p>{hints.definition}</p>
	{/if}
</div>

<style>
	.hints {
		max-width: 500px;
		margin: 0 auto;
		min-height: 2rem;
	}
	p {
		margin: 4px 0;
	}
	.acronym {
		font-size: 2rem;
		font-weight: bold;
		letter-spacing: 0.1em;
	}
	.category {
		font-size: 0.85rem;
		font-weight: bold;
		color: var(--muted);
	}
</style>
