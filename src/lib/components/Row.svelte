<script lang="ts">
	import type { Cell, Color } from '#lib/types.js';
	import Tile from './Tile.svelte';

	type Props = { lines: Cell[][]; text: string; colors: Color[] };
	let { lines, text, colors }: Props = $props();

	function letterAt(index: number): string {
		if (index < text.length) return text[index];
		return '';
	}

	function colorAt(index: number): Color | '' {
		if (index < colors.length) return colors[index];
		return '';
	}
</script>

<div class="row">
	{#each lines as line}
		<div class="line">
			{#each line as cell}
				{#if cell.gap}
					<div class="gap"></div>
				{:else if cell.more}
					<div class="more">→</div>
				{:else}
					<Tile letter={letterAt(cell.index)} color={colorAt(cell.index)} />
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
</style>
