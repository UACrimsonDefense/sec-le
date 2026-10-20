<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import type {
		Shape,
		Color,
		Guess,
		Difficulty,
		Hints,
		NewGame,
		GuessResult,
		SkipResult,
		Result,
		HistoryEntry
	} from '#lib/types.js';
	import Board from '#lib/components/Board.svelte';
	import Keyboard from '#lib/components/Keyboard.svelte';
	import HintPanel from '#lib/components/HintPanel.svelte';
	import Modal from '#lib/components/Modal.svelte';

	type Status = 'loading' | 'playing' | Result;
	type Level = { value: Difficulty; name: string; about: string };
	type Domain = { value: string; name: string };
	type SavedGame = {
		termId: number;
		shape: Shape;
		max: number;
		difficulty: Difficulty;
		domain: string;
		hints: Hints;
		guesses: Guess[];
		status: Status;
		answer: string;
	};

	const SAVE_KEY = `play-${page.params.mode}-current`;
	const REPO = 'https://github.com/UACrimsonDefense/sec-le';
	const levels: Level[] = [
		{ value: 'easy', name: 'Easy', about: 'Definition from the start' },
		{ value: 'medium', name: 'Medium', about: 'Hints unlock as you guess' },
		{ value: 'hard', name: 'Hard', about: 'No hints' }
	];
	const domains: Domain[] = [
		{ value: '', name: 'All domains' },
		{ value: '1', name: '1. General concepts' },
		{ value: '2', name: '2. Threats' },
		{ value: '3', name: '3. Architecture' },
		{ value: '4', name: '4. Operations' },
		{ value: '5', name: '5. Program management' }
	];

	let termId = $state(0);
	let shape = $state<Shape>([]);
	let max = $state(0);
	let difficulty = $state<Difficulty>('medium');
	let preferred = $state<Difficulty>('medium');
	let gameDomain = $state('');
	let domain = $state('');
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

	function save() {
		const game: SavedGame = {
			termId,
			shape,
			max,
			difficulty,
			domain: gameDomain,
			hints,
			guesses,
			status,
			answer
		};
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
			gameDomain = game.domain ?? '';
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

	function loadDomain() {
		const param = new URL(window.location.href).searchParams.get('domain');
		if (param && /^[1-5]$/.test(param)) domain = param;
	}

	function changeDomain(e: Event) {
		const url = new URL(window.location.href);
		if (domain === '') url.searchParams.delete('domain');
		else url.searchParams.set('domain', domain);
		replaceState(url, {});
		(e.currentTarget as HTMLSelectElement).blur();
	}

	function record(objective: string) {
		const entry: HistoryEntry = {
			termId,
			objective,
			difficulty,
			result: status as Result,
			guesses: guesses.length,
			date: new Date().toISOString()
		};
		try {
			let history: HistoryEntry[] = [];
			const text = localStorage.getItem('history');
			if (text) history = JSON.parse(text) as HistoryEntry[];
			history.push(entry);
			localStorage.setItem('history', JSON.stringify(history));
		} catch {}
	}

	async function start() {
		let url = `/api/game/new?difficulty=${preferred}`;
		if (domain !== '') url += `&domain=${domain}`;
		if (termId !== 0) url += `&last=${termId}`;
		const res = await fetch(url);
		if (!res.ok) return;
		const g = (await res.json()) as NewGame;
		termId = g.termId;
		shape = g.shape;
		max = g.maxGuesses;
		difficulty = preferred;
		gameDomain = domain;
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
			record(r.objective ?? '');
		}
		save();
	}

	async function skip() {
		if (waiting) return;
		waiting = true;
		const res = await fetch('/api/game/skip', { method: 'POST', body: JSON.stringify({ termId }) });
		waiting = false;
		if (!res.ok) return;
		const r = (await res.json()) as SkipResult;
		answer = r.answer;
		hints = r.hints;
		status = 'skipped';
		showResult = true;
		record(r.objective);
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
		loadDomain();
		if (loadGame()) return;
		if (hasPreferred) start();
		else choosing = true;
	});
</script>

<svelte:window {onkeydown} />

<main>
	<h1>Sec+le</h1>
	<div class="filters">
		<select aria-label="Difficulty" bind:value={preferred} onchange={changeDifficulty}>
			{#each levels as level}
				<option value={level.value}>{level.name}</option>
			{/each}
		</select>
		<select aria-label="Domain" bind:value={domain} onchange={changeDomain}>
			{#each domains as d}
				<option value={d.value}>{d.name}</option>
			{/each}
		</select>
	</div>
	<HintPanel {hints} />
	{#if status === 'playing' && (preferred !== difficulty || domain !== gameDomain)}
		<p class="note">Changes start next game</p>
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
		box-sizing: border-box;
		width: 100%;
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
	.filters {
		display: flex;
		justify-content: center;
		gap: 8px;
		margin-bottom: 8px;
	}
	select {
		font: inherit;
		background: var(--bg);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 4px;
	}
</style>
