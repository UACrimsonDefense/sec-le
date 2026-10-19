<script lang="ts">
	import { onMount } from 'svelte';
	import type { Shape, Color, NewGame, GuessResult, SkipResult } from '#lib/types.js';

	let termId = $state(0);
	let shape = $state<Shape>([]);
	let max = $state(0);
	let definition = $state('');
	let guesses = $state<{ text: string; colors: Color[] }[]>([]);
	let current = $state('');
	let status = $state<'playing' | 'won' | 'lost' | 'skipped'>('playing');
	let answer = $state('');

	let total = $derived(shape.reduce<number>((n, p) => (typeof p === 'number' ? n + p : n), 0));

	async function start() {
		const g = (await (await fetch('/api/game/new')).json()) as NewGame;
		termId = g.termId;
		shape = g.shape;
		max = g.maxGuesses;
		definition = g.definition;
		guesses = [];
		current = '';
		status = 'playing';
		answer = '';
	}

	async function submit() {
		const res = await fetch('/api/game/guess', {
			method: 'POST',
			body: JSON.stringify({ termId, guess: current, guessNumber: guesses.length + 1 })
		});
		if (!res.ok) return;
		const r = (await res.json()) as GuessResult;
		guesses.push({ text: current, colors: r.colors });
		current = '';
		if (r.answer) {
			answer = r.answer;
			status = r.solved ? 'won' : 'lost';
		}
	}

	async function skip() {
		const res = await fetch('/api/game/skip', { method: 'POST', body: JSON.stringify({ termId }) });
		if (!res.ok) return;
		const r = (await res.json()) as SkipResult;
		answer = r.answer;
		definition = r.definition;
		status = 'skipped';
	}

	function onkeydown(e: KeyboardEvent) {
		if (status !== 'playing') return;
		const key = e.key.toUpperCase();
		if (key === 'ENTER' && current.length === total) submit();
		else if (key === 'BACKSPACE') current = current.slice(0, -1);
		else if (/^[A-Z0-9.\/-]$/.test(key) && current.length < total) current += key;
	}

	function cells(text: string, colors: Color[] = []) {
		const out: { ch: string; cls: string }[] = [];
		let i = 0;
		for (const part of shape) {
			if (part === ' ') {
				out.push({ ch: '', cls: 'gap' });
				continue;
			}
			for (let k = 0; k < part; k++, i++) out.push({ ch: text[i] ?? '', cls: colors[i] ?? '' });
		}
		return out;
	}

	function row(r: number) {
		if (r < guesses.length) return cells(guesses[r].text, guesses[r].colors);
		if (r === guesses.length) return cells(current);
		return cells('');
	}

	onMount(start);
</script>

<svelte:window {onkeydown} />

<h1>Sec+le</h1>
<p>{definition}</p>

{#each { length: max }, r}
	<div class="row">
		{#each row(r) as c}
			<span class="tile {c.cls}">{c.ch}</span>
		{/each}
	</div>
{/each}

{#if status === 'playing'}
	<button onclick={skip}>Skip</button>
{:else}
	<p>
		{{ won: 'You got it!', lost: 'Out of guesses.', skipped: 'Skipped.' }[status]} Answer:
		<b>{answer}</b>
	</p>
	<button onclick={start}>Play again</button>
{/if}

<style>
	.row {
		display: flex;
		gap: 4px;
		margin: 4px 0;
	}
	.tile {
		width: 2rem;
		height: 2rem;
		border: 1px solid var(--border);
		display: grid;
		place-items: center;
		font-weight: bold;
	}
	.gap {
		border: none;
		width: 1rem;
	}
	.correct {
		background: var(--green);
		color: white;
	}
	.present {
		background: var(--yellow);
		color: white;
	}
	.absent {
		background: var(--gray);
		color: white;
	}
</style>
