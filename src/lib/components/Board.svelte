<script lang="ts">
	import type { Shape, Guess, Cell, Color } from '#lib/types.js';
	import Row from './Row.svelte';

	type Props = { shape: Shape; guesses: Guess[]; current: string; max: number };
	let { shape, guesses, current, max }: Props = $props();

	const MAX = 48;
	const MIN = 32;
	const GAP = 4;
	const WORD_GAP = 16;
	const MORE = 12;
	const GAP_CELL: Cell = { index: -1, gap: true, more: false };
	const MORE_CELL: Cell = { index: -1, gap: false, more: true };

	let width = $state(0);
	let lines = $derived(makeLines(shape, width));
	let size = $derived(tileSize(lines, width));

	function cellWidth(cell: Cell, size: number): number {
		if (cell.gap) return WORD_GAP;
		if (cell.more) return MORE;
		return size;
	}

	function lineWidth(line: Cell[], size: number): number {
		let total = 0;
		for (let i = 0; i < line.length; i++) {
			total += cellWidth(line[i], size);
			if (i > 0) total += GAP;
		}
		return total;
	}

	function makeLines(shape: Shape, width: number): Cell[][] {
		const lines: Cell[][] = [];
		let line: Cell[] = [];
		let index = 0;
		for (const part of shape) {
			if (part === ' ') continue;
			let word: Cell[] = [];
			for (let k = 0; k < part; k++) {
				word.push({ index: index, gap: false, more: false });
				index++;
			}
			if (line.length > 0) {
				const joined = line.concat([GAP_CELL], word);
				if (width === 0 || lineWidth(joined, MIN) <= width) {
					line = joined;
					continue;
				}
				lines.push(line);
			}
			while (width > 0 && lineWidth(word, MIN) > width) {
				let count = Math.floor((width - MORE) / (MIN + GAP));
				if (count < 1) count = 1;
				lines.push(word.slice(0, count).concat([MORE_CELL]));
				word = word.slice(count);
			}
			line = word;
		}
		if (line.length > 0) lines.push(line);
		return lines;
	}

	function tileSize(lines: Cell[][], width: number): number {
		let size = MAX;
		if (width === 0) return size;
		for (const line of lines) {
			let tiles = 0;
			for (const cell of line) {
				if (!cell.gap && !cell.more) tiles++;
			}
			const fit = (width - lineWidth(line, 0)) / tiles;
			if (fit < size) size = fit;
		}
		return Math.floor(size);
	}

	function describeShape(shape: Shape): string {
		const words: number[] = [];
		for (const part of shape) {
			if (part !== ' ') words.push(part);
		}
		if (words.length === 1) return `1 word, ${words[0]} letters, ${max} guesses`;
		return `${words.length} words of ${words.join(', ')} letters, ${max} guesses`;
	}

	function colorName(color: Color): string {
		if (color === 'correct') return 'correct';
		if (color === 'present') return 'wrong spot';
		return 'not in answer';
	}

	function describeGuess(guess: Guess): string {
		const parts: string[] = [];
		for (let i = 0; i < guess.text.length; i++) {
			parts.push(`${guess.text[i]} ${colorName(guess.colors[i])}`);
		}
		return `${guess.text}: ${parts.join(', ')}`;
	}
</script>

<div class="sr-only">
	<p>{describeShape(shape)}</p>
	<ol aria-live="polite">
		{#each guesses as guess}
			<li>{describeGuess(guess)}</li>
		{/each}
	</ol>
	<p aria-live="polite">{current.split('').join(' ')}</p>
</div>

<div
	class="board"
	class:wrapped={lines.length > 1}
	aria-hidden="true"
	bind:clientWidth={width}
	style="--size: {size}px"
>
	{#each { length: max }, r}
		{#if r < guesses.length}
			<Row {lines} text={guesses[r].text} colors={guesses[r].colors} />
		{:else if r === guesses.length}
			<Row {lines} text={current} colors={[]} />
		{:else}
			<Row {lines} text="" colors={[]} />
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
	.wrapped {
		gap: 12px;
	}
</style>
