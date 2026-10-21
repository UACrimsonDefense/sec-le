<script lang="ts">
	import { onMount } from 'svelte';
	import type { HistoryEntry, Mode } from '#lib/types.js';
	import type { PageProps } from './$types';

	type Kind = 'all' | 'daily' | 'unlimited';
	type Row = { key: string; name: string; played: number; won: number };
	type Bar = { guesses: number; count: number };

	let { data }: PageProps = $props();

	const DAY_MS = 24 * 60 * 60 * 1000;
	const domainNames = [
		'',
		'General concepts',
		'Threats',
		'Architecture',
		'Operations',
		'Program management'
	];

	let history = $state<HistoryEntry[]>([]);
	let today = $state(0);
	let kind = $state<Kind>('all');
	let mode = $state<Mode | 'all'>('all');

	let games = $derived(filterGames(history, kind, mode));
	let won = $derived(countWins(games));
	let bars = $derived(distribution(games));
	let most = $derived(mostWins(bars));
	let wonDays = $derived(dailyWins(history, mode));
	let domains = $derived(domainRows(games));
	let objectives = $derived(objectiveRows(games));
	let practiceMode = $derived(mode === 'acronym' ? 'acronym' : 'term');

	function filterGames(list: HistoryEntry[], kind: Kind, mode: Mode | 'all'): HistoryEntry[] {
		const result: HistoryEntry[] = [];
		for (const e of list) {
			if (mode !== 'all' && e.mode !== mode) continue;
			if (kind === 'daily' && e.day === 0) continue;
			if (kind === 'unlimited' && e.day !== 0) continue;
			result.push(e);
		}
		return result;
	}

	function countWins(list: HistoryEntry[]): number {
		let count = 0;
		for (const e of list) {
			if (e.result === 'won') count++;
		}
		return count;
	}

	function percent(part: number, total: number): string {
		if (total === 0) return '—';
		return `${Math.round((part / total) * 100)}%`;
	}

	function distribution(list: HistoryEntry[]): Bar[] {
		const result: Bar[] = [];
		for (let i = 1; i <= 8; i++) result.push({ guesses: i, count: 0 });
		for (const e of list) {
			if (e.result === 'won') result[e.guesses - 1].count++;
		}
		return result;
	}

	function mostWins(list: Bar[]): number {
		let result = 0;
		for (const bar of list) {
			if (bar.count > result) result = bar.count;
		}
		return result;
	}

	function dailyWins(list: HistoryEntry[], mode: Mode | 'all'): Set<number> {
		const result = new Set<number>();
		for (const e of list) {
			if (e.day === 0 || e.result !== 'won') continue;
			if (mode !== 'all' && e.mode !== mode) continue;
			result.add(e.day);
		}
		return result;
	}

	function currentStreak(days: Set<number>, today: number): number {
		let day = today;
		if (!days.has(day)) day--;
		let count = 0;
		while (days.has(day)) {
			count++;
			day--;
		}
		return count;
	}

	function bestStreak(days: Set<number>): number {
		let best = 0;
		for (const day of days) {
			if (days.has(day - 1)) continue;
			let count = 0;
			while (days.has(day + count)) count++;
			if (count > best) best = count;
		}
		return best;
	}

	function addGame(rows: Map<string, Row>, key: string, name: string, e: HistoryEntry) {
		let row = rows.get(key);
		if (!row) {
			row = { key, name, played: 0, won: 0 };
			rows.set(key, row);
		}
		row.played++;
		if (e.result === 'won') row.won++;
	}

	function worstFirst(a: Row, b: Row): number {
		if (a.played === 0 || b.played === 0) return b.played - a.played;
		const difference = a.won / a.played - b.won / b.played;
		if (difference !== 0) return difference;
		return b.played - a.played;
	}

	function domainRows(list: HistoryEntry[]): Row[] {
		const rows = new Map<string, Row>();
		for (let d = 1; d <= 5; d++) {
			rows.set(String(d), { key: String(d), name: `${d}. ${domainNames[d]}`, played: 0, won: 0 });
		}
		for (const e of list) {
			const d = e.objective.split('.')[0];
			addGame(rows, d, `${d}. ${domainNames[Number(d)]}`, e);
		}
		return [...rows.values()].sort(worstFirst);
	}

	function objectiveRows(list: HistoryEntry[]): Row[] {
		const rows = new Map<string, Row>();
		for (const e of list) {
			addGame(rows, e.objective, data.categories[e.objective] ?? e.objective, e);
		}
		return [...rows.values()].sort(worstFirst);
	}

	function localDate(): string {
		const now = new Date();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const dayOfMonth = String(now.getDate()).padStart(2, '0');
		return `${now.getFullYear()}-${month}-${dayOfMonth}`;
	}

	function dayNumber(date: string): number {
		const time = Date.parse(date + 'T00:00:00Z');
		const launch = Date.parse(data.launch + 'T00:00:00Z');
		return Math.round((time - launch) / DAY_MS) + 1;
	}

	onMount(() => {
		today = dayNumber(localDate());
		try {
			const text = localStorage.getItem('history');
			if (text) history = JSON.parse(text) as HistoryEntry[];
		} catch {}
	});
</script>

<svelte:head>
	<title>Your Security+ Weak Spots · Sec+le</title>
</svelte:head>

<main>
	<h1>Stats</h1>
	<nav aria-label="Play">
		<a href="/daily/term">Daily puzzle</a>
		<a href="/play/term">Unlimited</a>
	</nav>

	{#if history.length === 0}
		<p>No games yet. Finish a puzzle and your stats show up here.</p>
	{:else}
		<div class="filters">
			<select aria-label="Game type" bind:value={kind}>
				<option value="all">All games</option>
				<option value="daily">Daily</option>
				<option value="unlimited">Unlimited</option>
			</select>
			<select aria-label="Mode" bind:value={mode}>
				<option value="all">All modes</option>
				<option value="term">Term</option>
				<option value="acronym">Acronym</option>
			</select>
		</div>

		<dl class="totals">
			<div>
				<dt>Played</dt>
				<dd>{games.length}</dd>
			</div>
			<div>
				<dt>Win rate</dt>
				<dd>{percent(won, games.length)}</dd>
			</div>
			<div>
				<dt>Daily streak</dt>
				<dd>{currentStreak(wonDays, today)}</dd>
			</div>
			<div>
				<dt>Best streak</dt>
				<dd>{bestStreak(wonDays)}</dd>
			</div>
		</dl>

		<h2>Guesses to solve</h2>
		<ul class="bars">
			{#each bars as bar}
				<li>
					<span class="label">{bar.guesses}<span class="sr-only"> guesses:</span></span>
					<span class="track" aria-hidden="true">
						<span class="bar" style:width="{most === 0 ? 0 : (bar.count / most) * 100}%"></span>
					</span>
					<span class="count">{bar.count}<span class="sr-only"> wins</span></span>
				</li>
			{/each}
		</ul>

		<h2>Weak spots</h2>
		<p class="note">Worst first. Losses and skips both count against you.</p>
		<table>
			<caption>By domain</caption>
			<thead>
				<tr>
					<th scope="col">Domain</th>
					<th scope="col">Played</th>
					<th scope="col">Win rate</th>
					<th scope="col"><span class="sr-only">Practice</span></th>
				</tr>
			</thead>
			<tbody>
				{#each domains as row}
					<tr>
						<th scope="row">{row.name}</th>
						<td>{row.played}</td>
						<td>{percent(row.won, row.played)}</td>
						<td>
							<a
								href="/play/{practiceMode}?domain={row.key}"
								aria-label="Practice domain {row.name}">Practice</a
							>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		{#if objectives.length > 0}
			<table>
				<caption>By objective</caption>
				<thead>
					<tr>
						<th scope="col">Objective</th>
						<th scope="col">Played</th>
						<th scope="col">Win rate</th>
					</tr>
				</thead>
				<tbody>
					{#each objectives as row}
						<tr>
							<th scope="row">{row.name}</th>
							<td>{row.played}</td>
							<td>{percent(row.won, row.played)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	{/if}
</main>

<style>
	main {
		box-sizing: border-box;
		width: 100%;
		max-width: 600px;
		margin: 0 auto;
		padding: 0 16px 16px;
	}
	h1,
	nav,
	.filters {
		text-align: center;
	}
	nav {
		display: flex;
		justify-content: center;
		gap: 16px;
		margin-bottom: 16px;
	}
	a {
		color: var(--text);
	}
	.filters {
		display: flex;
		justify-content: center;
		gap: 8px;
	}
	select {
		font: inherit;
		background: var(--bg);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 4px;
	}
	.totals {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
		margin: 24px 0;
		text-align: center;
	}
	@media (max-width: 400px) {
		.totals {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	dt {
		font-size: 0.85rem;
		color: var(--muted);
	}
	dd {
		margin: 0;
		font-size: 1.8rem;
		font-weight: bold;
	}
	h2 {
		font-size: 1.1rem;
		margin: 24px 0 8px;
	}
	.bars {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.bars li {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}
	.label {
		width: 1ch;
		font-weight: bold;
	}
	.track {
		flex: 1;
	}
	.bar {
		display: block;
		height: 1.2rem;
		min-width: 2px;
		border-radius: 2px;
		background: var(--green);
	}
	.count {
		min-width: 2ch;
		text-align: right;
	}
	.note {
		font-size: 0.85rem;
		color: var(--muted);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 24px;
	}
	caption {
		text-align: left;
		font-weight: bold;
		padding-bottom: 4px;
	}
	th,
	td {
		padding: 6px 4px;
		border-bottom: 1px solid var(--border);
		text-align: right;
	}
	th:first-child {
		text-align: left;
		font-weight: normal;
	}
	thead th {
		font-size: 0.85rem;
		color: var(--muted);
		font-weight: normal;
	}
</style>
