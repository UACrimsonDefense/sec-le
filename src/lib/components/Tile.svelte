<script lang="ts">
	import type { Color } from '#lib/types.js';

	type Props = { letter: string; color: Color | '' };
	let { letter, color }: Props = $props();
</script>

<div class="tile {color}" class:filled={letter !== '' && color === ''}>
	{letter}
	{#if color === 'correct'}
		<span class="mark">✓</span>
	{:else if color === 'present'}
		<span class="mark">•</span>
	{/if}
</div>

<style>
	.tile {
		position: relative;
		box-sizing: border-box;
		flex: 0 0 var(--size);
		height: var(--size);
		border: 2px solid var(--border);
		display: grid;
		place-items: center;
		font-weight: bold;
		font-size: calc(var(--size) * 0.55);
	}
	.mark {
		position: absolute;
		top: 0;
		right: 2px;
		font-size: calc(var(--size) * 0.3);
		line-height: 1;
	}
	.filled {
		border-color: var(--filled);
	}
	.correct {
		background: var(--green);
		border-color: var(--green);
		color: white;
	}
	.present {
		background: var(--yellow);
		border-color: var(--yellow);
		color: var(--on-yellow);
	}
	.absent {
		background: var(--gray);
		border-color: var(--gray);
		color: white;
	}
</style>
