<script lang="ts">
	import type { Cell, Color } from '#lib/types.js';
	import Tile from './Tile.svelte';

	type Props = {
		lines: Cell[][];
		text: string;
		colors: Color[];
		reveal?: boolean;
		win?: boolean;
		shake?: boolean;
	};
	let { lines, text, colors, reveal = false, win = false, shake = false }: Props = $props();

	function letterAt(index: number): string {
		if (index < text.length) return text[index];
		return '';
	}

	function colorAt(index: number): Color | '' {
		if (index < colors.length) return colors[index];
		return '';
	}
</script>

<div class="row" class:shake>
	{#each lines as line}
		<div class="line">
			{#each line as cell}
				{#if cell.gap}
					<div class="gap"></div>
				{:else if cell.more}
					<div class="more">→</div>
				{:else}
					<Tile
						letter={letterAt(cell.index)}
						color={colorAt(cell.index)}
						index={cell.index}
						{reveal}
						{win}
					/>
				{/if}
			{/each}
		</div>
	{/each}
</div>

<style>
	.row {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.line {
		display: flex;
		justify-content: center;
		gap: 4px;
	}
	.gap {
		flex: 0 0 16px;
	}
	.more {
		flex: 0 0 12px;
		align-self: center;
		color: var(--muted);
	}
	.shake {
		animation: shake 400ms;
	}
	@keyframes shake {
		20%,
		60% {
			transform: translateX(-6px);
		}
		40%,
		80% {
			transform: translateX(6px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.shake {
			animation: none;
		}
	}
</style>
