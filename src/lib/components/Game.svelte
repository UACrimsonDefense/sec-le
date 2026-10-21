<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import type {
		Shape,
		Color,
		Guess,
		Mode,
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

	type Props = { mode: Mode; daily: boolean };
	type Status = 'loading' | 'playing' | Result;
	type Level = { value: Difficulty; name: string; about: string };
	type Domain = { value: string; name: string };
	type SavedGame = {
		termId: number;
		day: number;
		shape: Shape;
		max: number;
		difficulty: Difficulty;
		domain: string;
		hints: Hints;
		guesses: Guess[];
		status: Status;
		answer: string;
	};

	let { mode, daily }: Props = $props();

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

	let saveKey = '';
	let date = '';
	let termId = $state(0);
	let day = $state(0);
	let shape = $state<Shape>([]);
	let max = $state(0);
	let difficulty = $state<Difficulty>('medium');
	let preferred = $state<Difficulty>('medium');
	let gameDomain = $state('');
	let domain = $state('');
	let hints = $state<Hints>({ acronym: '', category: '', definition: '' });
	let guesses = $state<Guess[]>([]);
	let current = $state('');
	let status = $state<Status>('loading');
	let answer = $state('');
	let message = $state('');
	let choosing = $state(false);
	let showResult = $state(false);
	let copied = $state(false);
	let now = $state(Date.now());
	let waiting = false;

	let section = $derived(daily ? 'daily' : 'play');
	let left = $derived(timeLeft(now));

	$effect(() => {
		if (!daily) return;
		const timer = setInterval(() => (now = Date.now()), 1000);
		return () => clearInterval(timer);
	});

	function timeLeft(now: number): number {
		const parts = date.split('-');
		const next = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) + 1);
		return next.getTime() - now;
	}

	function countdown(ms: number): string {
		const seconds = Math.ceil(ms / 1000);
		const hours = Math.floor(seconds / 3600);
		const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
		return `${hours}:${minutes}:${String(seconds % 60).padStart(2, '0')}`;
	}
	let title = $derived(pageTitle(daily, mode));
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

	function pageTitle(daily: boolean, mode: Mode): string {
		let kind = 'Unlimited';
		if (daily) kind = 'Daily';
		return `${kind} ${mode} · Sec+le`;
	}

	function levelName(value: Difficulty): string {
		for (const level of levels) {
			if (level.value === value) return level.name;
		}
		return '';
	}

	function localDate(): string {
		const now = new Date();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const dayOfMonth = String(now.getDate()).padStart(2, '0');
		return `${now.getFullYear()}-${month}-${dayOfMonth}`;
	}

	function save() {
		const game: SavedGame = {
			termId,
			day,
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
			localStorage.setItem(saveKey, JSON.stringify(game));
		} catch {}
	}

	function loadGame(): boolean {
		try {
			const text = localStorage.getItem(saveKey);
			if (!text) return false;
			const game = JSON.parse(text) as SavedGame;
			termId = game.termId;
			day = game.day ?? 0;
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

	function loadDomain() {
		const param = new URL(window.location.href).searchParams.get('domain');
		if (param && /^[1-5]$/.test(param)) domain = param;
	}

	function changeDomain() {
		const url = new URL(window.location.href);
		if (domain === '') url.searchParams.delete('domain');
		else url.searchParams.set('domain', domain);
		replaceState(url, {});
	}

	function record(objective: string) {
		const entry: HistoryEntry = {
			termId,
			day,
			mode,
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
		let url = `/api/game/new?mode=${mode}&difficulty=${preferred}`;
		if (daily) url += `&date=${date}`;
		if (!daily && domain !== '') url += `&domain=${domain}`;
		if (!daily && termId !== 0) url += `&last=${termId}`;
		if (waiting) return;
		waiting = true;
		const res = await fetch(url);
		waiting = false;
		if (!res.ok) {
			message = 'Could not load a puzzle';
			return;
		}
		const g = (await res.json()) as NewGame;
		termId = g.termId;
		day = g.day;
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
		copied = false;
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
			body: JSON.stringify({
				termId,
				date: daily ? date : '',
				guess: current,
				guessNumber: guesses.length + 1,
				difficulty,
				mode
			})
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
			termId = r.termId ?? termId;
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

	function emoji(color: Color): string {
		const colorblind = document.documentElement.dataset.colorblind !== undefined;
		if (color === 'correct') return colorblind ? '🟦' : '🟩';
		if (color === 'present') return '🟨';
		return '⬛';
	}

	function emojiRow(guess: Guess): string {
		let row = '';
		let i = 0;
		for (const part of shape) {
			if (part === ' ') {
				row += ' ';
				continue;
			}
			for (let j = 0; j < part; j++) {
				row += emoji(guess.colors[i]);
				i++;
			}
		}
		return row;
	}

	function shareText(): string {
		let score = String(guesses.length);
		if (status !== 'won') score = 'X';
		let title = 'Sec+le';
		if (mode === 'acronym') title += ' Acronym';
		let text = `${title} #${day} · ${levelName(difficulty)} · ${score}/${max}\n`;
		for (const guess of guesses) {
			text += '\n' + emojiRow(guess);
		}
		return text + '\n\nhttps://secle.crimsondefense.org';
	}

	async function share() {
		try {
			await navigator.clipboard.writeText(shareText());
			copied = true;
		} catch {
			message = 'Could not copy';
		}
	}

	function pressKey(key: string) {
		if (key === 'ENTER' && !daily && status !== 'playing' && status !== 'loading') {
			start();
			return;
		}
		if (status !== 'playing') return;
		message = '';
		if (key === 'ENTER') submit();
		else if (key === 'BACK') removeLetter();
		else addLetter(key);
	}

	function onkeydown(e: KeyboardEvent) {
		if (document.querySelector('dialog[open]')) return;
		if (e.ctrlKey || e.metaKey || e.altKey) return;
		const key = e.key.toUpperCase();
		if (e.target instanceof HTMLSelectElement) {
			if (!/^[A-Z0-9.\/-]$/.test(key)) return;
			e.preventDefault();
			e.target.blur();
		}
		if (key === 'ENTER') {
			if (e.target instanceof HTMLAnchorElement) return;
			if (e.target instanceof HTMLButtonElement && status !== 'playing') return;
			if (status !== 'loading') e.preventDefault();
			pressKey('ENTER');
		} else if (key === 'BACKSPACE') pressKey('BACK');
		else if (/^[A-Z0-9.\/-]$/.test(key)) pressKey(key);
	}

	onMount(() => {
		date = localDate();
		if (daily) {
			saveKey = `daily-${mode}-${date}`;
		} else {
			saveKey = `play-${mode}-current`;
			loadDomain();
		}
		const hasPreferred = loadPreferred();
		if (loadGame()) return;
		if (hasPreferred) start();
		else choosing = true;
	});
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<svelte:window {onkeydown} />

{#snippet after()}
	{#if daily}
		<button class="play-again" onclick={share}>{copied ? 'Copied!' : 'Share'}</button>
		<a class="button" href="/play/{mode}">Play unlimited</a>
		{#if left > 0}
			<p class="note" role="timer">Next puzzle in {countdown(left)}</p>
		{:else}
			<p><a href="/daily/{mode}" data-sveltekit-reload>Play today's puzzle</a></p>
		{/if}
	{:else}
		<button class="play-again" onclick={start}>Play again</button>
	{/if}
{/snippet}

<main>
	<h1>Sec+le</h1>
	<div class="navs">
		<nav aria-label="Game type">
			<a href="/daily/{mode}" class:current={daily} aria-current={daily ? 'page' : undefined}
				>Daily{#if daily && day > 0}&nbsp;#{day}{/if}</a
			>
			<a href="/play/{mode}" class:current={!daily} aria-current={daily ? undefined : 'page'}
				>Unlimited</a
			>
		</nav>
		<nav aria-label="Mode">
			<a
				href="/{section}/term"
				class:current={mode === 'term'}
				aria-current={mode === 'term' ? 'page' : undefined}>Term</a
			>
			<a
				href="/{section}/acronym"
				class:current={mode === 'acronym'}
				aria-current={mode === 'acronym' ? 'page' : undefined}>Acronym</a
			>
		</nav>
	</div>
	<div class="filters">
		<select aria-label="Difficulty" bind:value={preferred} onchange={savePreferred}>
			{#each levels as level}
				<option value={level.value}>{level.name}</option>
			{/each}
		</select>
		{#if !daily}
			<select aria-label="Domain" bind:value={domain} onchange={changeDomain}>
				{#each domains as d}
					<option value={d.value}>{d.name}</option>
				{/each}
			</select>
		{/if}
	</div>
	<HintPanel {hints} />
	{#if status === 'playing' && (preferred !== difficulty || domain !== gameDomain)}
		<p class="note">{daily ? 'Changes start tomorrow' : 'Changes start next game'}</p>
	{/if}
	<p class="message" role="status">{message}</p>

	<Board {shape} {guesses} {current} {max} />

	{#if status === 'playing' && !daily}
		<button class="skip" onclick={skip}>Skip</button>
	{:else if status !== 'playing' && status !== 'loading'}
		{@render after()}
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
		<p class="answer">
			{answer}{#if hints.acronym}&nbsp;({hints.acronym}){/if}
		</p>
		<p class="note">{hints.category}</p>
		<p>{hints.definition}</p>
		{@render after()}
		<p><a href={reportLink()} target="_blank" rel="noopener">Report this definition</a></p>
	</Modal>
{/if}

<style>
	main {
		box-sizing: border-box;
		width: 100%;
		max-width: 1000px;
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
	.button {
		display: inline-block;
		margin-bottom: 1rem;
		padding: 8px 20px;
		border-radius: 4px;
		background: var(--key);
		color: var(--text);
		font-size: 1rem;
		font-weight: bold;
		text-decoration: none;
	}
	.navs {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		column-gap: 40px;
	}
	nav {
		display: flex;
		justify-content: center;
		gap: 16px;
		margin-bottom: 12px;
	}
	nav a {
		color: var(--muted);
		text-decoration: none;
	}
	nav a.current {
		color: var(--text);
		font-weight: bold;
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
		color: var(--muted);
	}
	a {
		color: var(--text);
		font-size: 0.85rem;
	}
	.message {
		min-height: 1.2em;
		margin: 4px 0;
		font-weight: bold;
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
