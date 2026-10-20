<script lang="ts">
	import type { Shape, Guess } from '#lib/types.js';
	import Row from './Row.svelte';

	type Props = { shape: Shape; guesses: Guess[]; current: string; max: number };
	let { shape, guesses, current, max }: Props = $props();
</script>

<div class="board">
	{#each { length: max }, r}
		{#if r < guesses.length}
			<Row {shape} text={guesses[r].text} colors={guesses[r].colors} />
		{:else if r === guesses.length}
			<Row {shape} text={current} colors={[]} />
		{:else}
			<Row {shape} text="" colors={[]} />
		{/if}
	{/each}
</div>

<style>
	.board {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin: 1rem 0;
	}
</style>
