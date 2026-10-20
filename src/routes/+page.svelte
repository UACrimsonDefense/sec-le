<script lang="ts">
	import { onMount } from 'svelte';
	import type {
		Shape,
		Color,
		Guess,
		Difficulty,
		Hints,
		NewGame,
		GuessResult,
		SkipResult
	} from '#lib/types.js';
	import Board from '#lib/components/Board.svelte';
	import Keyboard from '#lib/components/Keyboard.svelte';
	import HintPanel from '#lib/components/HintPanel.svelte';
	import Modal from '#lib/components/Modal.svelte';

	type Status = 'loading' | 'playing' | 'won' | 'lost' | 'skipped';
	type Level = { value: Difficulty; name: string; about: string };
	type SavedGame = {
		termId: number;
		shape: Shape;
		max: number;
		difficulty: Difficulty;
		hints: Hints;
		guesses: Guess[];
		status: Status;
		answer: string;
	};

	const SAVE_KEY = 'play-term-current';
	const REPO = 'https://github.com/UACrimsonDefense/sec-le';
	const levels: Level[] = [
		{ value: 'easy', name: 'Easy', about: 'Definition from the start' },
		{ value: 'medium', name: 'Medium', about: 'Hints unlock as you guess' },
		{ value: 'hard', name: 'Hard', about: 'No hints' }
	];

	let termId = $state(0);
	let shape = $state<Shape>([]);
	let max = $state(0);
	let difficulty = $state<Difficulty>('medium');
	let preferred = $state<Difficulty>('medium');
	let hints = $state<Hints>({ category: '', definition: '' });
	let guesses = $state<Guess[]>([]);
	let current = $state('');
	let status = $state<Status>('loading');
	let answer = $state('');
	let message = $state('');
	let choosing = $state(false);
	let showResult = $state(false);
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

	function levelName(value: Difficulty): string {
		for (const level of levels) {
			if (level.value === value) return level.name;
		}
		return '';
	}

	function save() {
		const game: SavedGame = { termId, shape, max, difficulty, hints, guesses, status, answer };
		try {
			localStorage.setItem(SAVE_KEY, JSON.stringify(game));
		} catch {}
	}

	function loadGame(): boolean {
		try {
			const text = localStorage.getItem(SAVE_KEY);
			if (!text) return false;
			const game = JSON.parse(text) as SavedGame;
			termId = game.termId;
			shape = game.shape;
			max = game.max;
			difficulty = game.difficulty;
			hints = game.hints;
			guesses = game.guesses;
			status = game.status;
			answer = game.answer;
			showResult = status !== 'playing';
			return true;
		} catch {
			return false;
		}
	}

	function loadPreferred(): boolean {
		try {
			const saved = localStorage.getItem('difficulty');
			if (saved === 'easy' || saved === 'medium' || saved === 'hard') {
				preferred = saved;
				return true;
			}
		} catch {}
		return false;
	}

	function savePreferred() {
		try {
			localStorage.setItem('difficulty', preferred);
		} catch {}
	}

	function choose(value: Difficulty) {
		preferred = value;
		savePreferred();
		choosing = false;
		start();
	}

	function changeDifficulty(e: Event) {
		savePreferred();
		(e.currentTarget as HTMLSelectElement).blur();
	}

	async function start() {
		const res = await fetch(`/api/game/new?difficulty=${preferred}`);
		const g = (await res.json()) as NewGame;
		termId = g.termId;
		shape = g.shape;
		max = g.maxGuesses;
		difficulty = preferred;
		hints = g.hints;
		guesses = [];
		current = '';
		status = 'playing';
		answer = '';
		message = '';
		showResult = false;
		save();
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
			body: JSON.stringify({ termId, guess: current, guessNumber: guesses.length + 1, difficulty })
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
		hints = r.hints;
		if (r.answer) {
			answer = r.answer;
			if (r.solved) status = 'won';
			else status = 'lost';
			showResult = true;
		}
		save();
	}

	async function skip() {
		const res = await fetch('/api/game/skip', { method: 'POST', body: JSON.stringify({ termId }) });
		if (!res.ok) return;
		const r = (await res.json()) as SkipResult;
		answer = r.answer;
		hints = r.hints;
		status = 'skipped';
		showResult = true;
		save();
	}

	function closeResult() {
		showResult = false;
	}

	function resultTitle(): string {
		if (status === 'won') return 'You got it!';
		if (status === 'lost') return 'Out of guesses';
		return 'Skipped';
	}

	function reportLink(): string {
		const title = `Definition report: #${termId} ${answer}`;
		const body = `Term ID: ${termId}\nTerm: ${answer}\nDefinition: ${hints.definition}\n\nWhat's wrong:\n`;
		return `${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
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

	onMount(() => {
		const hasPreferred = loadPreferred();
		if (loadGame()) return;
		if (hasPreferred) start();
		else choosing = true;
	});
</script>

<svelte:window {onkeydown} />

<select
	class="difficulty"
	aria-label="Difficulty"
	bind:value={preferred}
	onchange={changeDifficulty}
>
	{#each levels as level}
		<option value={level.value}>{level.name}</option>
	{/each}
</select>

<main>
	<h1>Sec+le</h1>
	<HintPanel {hints} />
	{#if status === 'playing' && preferred !== difficulty}
		<p class="note">{levelName(preferred)} starts next game</p>
	{/if}
	{#if message}
		<p><b>{message}</b></p>
	{/if}

	<Board {shape} {guesses} {current} {max} />

	{#if status === 'playing'}
		<button class="skip" onclick={skip}>Skip</button>
	{:else if status !== 'loading'}
		<button class="play-again" onclick={start}>Play again</button>
	{/if}

	<Keyboard colors={keyColors} onkey={pressKey} />
</main>

{#if choosing}
	<Modal title="Pick a difficulty">
		<p>You can change it later from the menu.</p>
		{#each levels as level}
			<button class="level" onclick={() => choose(level.value)}>
				<b>{level.name}</b>
				<span>{level.about}</span>
			</button>
		{/each}
	</Modal>
{/if}

{#if showResult}
	<Modal title={resultTitle()} onclose={closeResult}>
		<p class="answer">{answer}</p>
		<p class="note">{hints.category}</p>
		<p>{hints.definition}</p>
		<button class="play-again" onclick={start}>Play again</button>
		<p><a href={reportLink()} target="_blank" rel="noopener">Report this definition</a></p>
	</Modal>
{/if}

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
	.level {
		display: block;
		width: 100%;
		margin-bottom: 8px;
		background: var(--key);
		color: var(--text);
	}
	.level span {
		display: block;
		font-weight: normal;
		font-size: 0.85rem;
	}
	.answer {
		font-size: 1.5rem;
		font-weight: bold;
	}
	.note {
		font-size: 0.85rem;
		color: var(--filled);
	}
	a {
		color: var(--text);
		font-size: 0.85rem;
	}
	.difficulty {
		position: absolute;
		top: 12px;
		left: 16px;
		font: inherit;
		background: var(--bg);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 4px;
	}
</style>
