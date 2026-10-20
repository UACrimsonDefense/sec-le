<script lang="ts">
	import type { Shape, Color } from '#lib/types.js';
	import Tile from './Tile.svelte';

	type Props = { shape: Shape; text: string; colors: Color[] };
	let { shape, text, colors }: Props = $props();

	type Cell = { letter: string; color: Color | ''; gap: boolean };

	let cells = $derived(makeCells(shape, text, colors));

	function makeCells(shape: Shape, text: string, colors: Color[]): Cell[] {
		const result: Cell[] = [];
		let i = 0;
		for (const part of shape) {
			if (part === ' ') {
				result.push({ letter: '', color: '', gap: true });
				continue;
			}
			for (let k = 0; k < part; k++) {
				let letter = '';
				let color: Color | '' = '';
				if (i < text.length) letter = text[i];
				if (i < colors.length) color = colors[i];
				result.push({ letter: letter, color: color, gap: false });
				i++;
			}
		}
		return result;
	}
</script>

<div class="row">
	{#each cells as cell}
		{#if cell.gap}
			<div class="gap"></div>
		{:else}
			<Tile letter={cell.letter} color={cell.color} />
		{/if}
	{/each}
</div>

<style>
	.row {
		display: flex;
		justify-content: center;
		gap: 4px;
	}
	.gap {
		flex: 0 1 1rem;
	}
</style>
