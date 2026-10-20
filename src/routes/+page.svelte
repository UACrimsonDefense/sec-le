<script lang="ts">
	import { onMount } from 'svelte';
	import type { Shape, Color, Guess, NewGame, GuessResult, SkipResult } from '#lib/types.js';
	import Board from '#lib/components/Board.svelte';
	import Keyboard from '#lib/components/Keyboard.svelte';

	let termId = $state(0);
	let shape = $state<Shape>([]);
	let max = $state(0);
	let definition = $state('');
	let guesses = $state<Guess[]>([]);
	let current = $state('');
	let status = $state<'playing' | 'won' | 'lost' | 'skipped'>('playing');
	let answer = $state('');
	let message = $state('');
	let waiting = false;

	let total = $derived(countLetters(shape));
	let keyColors = $derived(getKeyColors(guesses));

	function countLetters(shape: Shape): number {
		let count = 0;
		for (const part of shape) {
			if (part !== ' ') count += part;
		}
		return count;
	}

	function getKeyColors(guesses: Guess[]): Record<string, Color> {
		const result: Record<string, Color> = {};
		for (const guess of guesses) {
			for (let i = 0; i < guess.text.length; i++) {
				const letter = guess.text[i];
				const color = guess.colors[i];
				if (color === 'correct') {
					result[letter] = 'correct';
				} else if (color === 'present' && result[letter] !== 'correct') {
					result[letter] = 'present';
				} else if (color === 'absent' && result[letter] === undefined) {
					result[letter] = 'absent';
				}
			}
		}
		return result;
	}

	async function start() {
		const res = await fetch('/api/game/new');
		const g = (await res.json()) as NewGame;
		termId = g.termId;
		shape = g.shape;
		max = g.maxGuesses;
		definition = g.definition;
		guesses = [];
		current = '';
		status = 'playing';
		answer = '';
	}

	function addLetter(letter: string) {
		if (current.length < total) current += letter;
	}

	function removeLetter() {
		current = current.slice(0, -1);
	}

	async function submit() {
		if (waiting) return;
		if (current.length !== total) return;

		waiting = true;
		const res = await fetch('/api/game/guess', {
			method: 'POST',
			body: JSON.stringify({ termId, guess: current, guessNumber: guesses.length + 1 })
		});
		waiting = false;
		if (res.status === 422) {
			message = 'Not in word list';
			return;
		}
		if (!res.ok) return;

		const r = (await res.json()) as GuessResult;
		guesses.push({ text: current, colors: r.colors });
		current = '';
		if (r.answer) {
			answer = r.answer;
			if (r.solved) status = 'won';
			else status = 'lost';
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

	function pressKey(key: string) {
		if (status !== 'playing') return;
		message = '';
		if (key === 'ENTER') submit();
		else if (key === 'BACK') removeLetter();
		else addLetter(key);
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.ctrlKey || e.metaKey || e.altKey) return;
		if (e.target instanceof HTMLSelectElement) return;
		const key = e.key.toUpperCase();
		if (key === 'ENTER') pressKey('ENTER');
		else if (key === 'BACKSPACE') pressKey('BACK');
		else if (/^[A-Z0-9.\/-]$/.test(key)) pressKey(key);
	}

	onMount(start);
</script>

<svelte:window {onkeydown} />

<main>
	<h1>Sec+le</h1>
	<p>{definition}</p>
	{#if message}
		<p><b>{message}</b></p>
	{/if}

	<Board {shape} {guesses} {current} {max} />

	{#if status === 'playing'}
		<button class="skip" onclick={skip}>Skip</button>
	{:else}
		<p>
			{#if status === 'won'}
				You got it!
			{:else if status === 'lost'}
				Out of guesses.
			{:else}
				Skipped.
			{/if}
			Answer: <b>{answer}</b>
		</p>
		<button class="play-again" onclick={start}>Play again</button>
	{/if}

	<Keyboard colors={keyColors} onkey={pressKey} />
</main>

<style>
	main {
		max-width: 500px;
		margin: 0 auto;
		padding: 0 16px 16px;
		text-align: center;
	}
	button {
		margin-bottom: 1rem;
		font: inherit;
		font-weight: bold;
		padding: 8px 20px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}
	.skip {
		background: var(--key);
		color: var(--text);
	}
	.play-again {
		background: var(--green);
		color: white;
	}
</style>
