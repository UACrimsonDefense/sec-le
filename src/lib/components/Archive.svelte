<script lang="ts">
	import Modal from '#lib/components/Modal.svelte';
	import type { Mode, HistoryEntry } from '#lib/types.js';

	type Props = { mode: Mode; launch: string };
	type State = 'unplayed' | 'playing' | 'won' | 'lost';
	type Saved = { status: string; guesses: unknown[]; answer: string };
	type Tile = {
		n: number;
		date: string;
		short: string;
		today: boolean;
		state: State;
		text: string;
		answer: string;
		label: string;
	};
	type Group = { name: string; tiles: Tile[] };

	let { mode, launch }: Props = $props();

	const DAY_MS = 24 * 60 * 60 * 1000;

	let open = $state(false);
	let groups = $state<Group[]>([]);

	function localDate(): string {
		const now = new Date();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const dayOfMonth = String(now.getDate()).padStart(2, '0');
		return `${now.getFullYear()}-${month}-${dayOfMonth}`;
	}

	function dayNumber(date: string): number {
		const time = Date.parse(date + 'T00:00:00Z');
		return Math.round((time - Date.parse(launch + 'T00:00:00Z')) / DAY_MS) + 1;
	}

	function dateOf(n: number): string {
		return new Date(Date.parse(launch + 'T00:00:00Z') + (n - 1) * DAY_MS)
			.toISOString()
			.slice(0, 10);
	}

	function format(date: string, options: Intl.DateTimeFormatOptions): string {
		return new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', {
			...options,
			timeZone: 'UTC'
		});
	}

	function loadSaved(date: string): Saved | null {
		try {
			const text = localStorage.getItem(`daily-${mode}-${date}`);
			if (text) return JSON.parse(text) as Saved;
		} catch {}
		return null;
	}

	function loadResults(): Map<number, HistoryEntry> {
		const results = new Map<number, HistoryEntry>();
		try {
			const text = localStorage.getItem('history');
			if (!text) return results;
			const history = JSON.parse(text) as HistoryEntry[];
			for (const e of history) {
				if (e.mode !== mode || e.day <= 0 || results.has(e.day)) continue;
				if (e.result === 'won' || e.result === 'lost') results.set(e.day, e);
			}
		} catch {}
		return results;
	}

	function guessWord(count: number): string {
		if (count === 1) return '1 guess';
		return `${count} guesses`;
	}

	function buildTile(n: number, todayNumber: number, results: Map<number, HistoryEntry>): Tile {
		const date = dateOf(n);
		const tile: Tile = {
			n,
			date,
			short: format(date, { month: 'short', day: 'numeric' }),
			today: n === todayNumber,
			state: 'unplayed',
			text: 'Not played',
			answer: '',
			label: 'not played'
		};
		const saved = loadSaved(date);
		const entry = results.get(n);
		let guesses = 0;
		if (saved && saved.status === 'playing') {
			tile.state = 'playing';
		} else if (saved && (saved.status === 'won' || saved.status === 'lost')) {
			tile.state = saved.status;
			guesses = saved.guesses.length;
			tile.answer = saved.answer ?? '';
		} else if (entry) {
			tile.state = 'lost';
			if (entry.result === 'won') tile.state = 'won';
			guesses = entry.guesses;
		}
		if (tile.state === 'playing') {
			tile.text = 'In progress';
			tile.label = 'in progress';
		} else if (tile.state === 'won') {
			tile.text = `Won in ${guesses}`;
			tile.label = `won in ${guessWord(guesses)}`;
		} else if (tile.state === 'lost') {
			tile.text = 'Lost';
			tile.label = 'lost';
		}
		let label = `Day ${n}, ${format(date, { month: 'long', day: 'numeric' })}`;
		if (tile.today) label += ', today';
		label += `, ${tile.label}`;
		if (tile.answer !== '') label += `, answer ${tile.answer}`;
		tile.label = label;
		return tile;
	}

	function buildGroups(): Group[] {
		const result: Group[] = [];
		const results = loadResults();
		const todayNumber = dayNumber(localDate());
		for (let n = todayNumber; n >= 1; n--) {
			const tile = buildTile(n, todayNumber, results);
			const name = format(tile.date, { month: 'long', year: 'numeric' });
			if (result.length === 0 || result[result.length - 1].name !== name) {
				result.push({ name, tiles: [] });
			}
			result[result.length - 1].tiles.push(tile);
		}
		return result;
	}

	function show() {
		groups = buildGroups();
		open = true;
	}

	function href(tile: Tile): string {
		if (tile.today) return `/daily/${mode}`;
		return `/daily/${mode}?date=${tile.date}`;
	}
</script>

<button class="archive" onclick={show}>Archive</button>

{#if open}
	<Modal title="Archive" wide onclose={() => (open = false)}>
		<div class="scroll">
			{#each groups as group}
				<h3>{group.name}</h3>
				<ul>
					{#each group.tiles as tile}
						<li>
							<a
								href={href(tile)}
								data-sveltekit-reload
								class="tile"
								class:won={tile.state === 'won'}
								aria-label={tile.label}
							>
								<b>#{tile.n}</b>
								<span
									>{tile.short}{#if tile.today}&nbsp;· Today{/if}</span
								>
								<span class="note">{tile.text}</span>
								{#if tile.answer !== ''}
									<span class="answer">{tile.answer}</span>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			{/each}
		</div>
	</Modal>
{/if}

<style>
	.archive {
		padding: 0;
		border: none;
		background: none;
		color: var(--text);
		font: inherit;
		text-decoration: underline;
		cursor: pointer;
	}
	.scroll {
		max-height: 60vh;
		overflow-y: auto;
		text-align: left;
	}
	h3 {
		margin: 16px 0 8px;
		font-size: 1rem;
	}
	h3:first-child {
		margin-top: 0;
	}
	ul {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.tile {
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		height: 100%;
		padding: 8px;
		border: 1px solid var(--border);
		border-left: 4px solid var(--border);
		border-radius: 4px;
		color: var(--text);
		text-decoration: none;
		overflow-wrap: anywhere;
	}
	.tile.won {
		border-left-color: var(--green);
	}
	.note {
		font-size: 0.85rem;
		color: var(--muted);
	}
	.answer {
		font-size: 0.85rem;
		font-weight: bold;
	}
	@media (max-width: 480px) {
		ul {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
