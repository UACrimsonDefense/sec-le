import { readFileSync } from 'node:fs';

type Row = { day: string; kind: string; mode: string; started: number; won: number; lost: number };
type Day = {
	term: number;
	acronym: number;
	finished: number;
	won: number;
	unlimited: number;
};

const token = process.env.CLOUDFLARE_STATS_TOKEN ?? '';
if (token === '') {
	console.error('error: CLOUDFLARE_STATS_TOKEN is not set. Put it in .env.stats (see README)');
	process.exit(1);
}

const days = Number(process.argv[2] ?? 14);
if (!Number.isInteger(days) || days < 1 || days > 90) {
	console.error('error: days must be a whole number from 1 to 90');
	process.exit(1);
}

const config = readFileSync('wrangler.jsonc', 'utf8');
const account = config.match(/"account_id":\s*"([0-9a-f]+)"/)?.[1];
if (!account) {
	console.error('error: no account_id in wrangler.jsonc');
	process.exit(1);
}

const query = `
SELECT
	blob4 AS day,
	blob2 AS kind,
	blob3 AS mode,
	sum(if(blob1 = 'start', _sample_interval, 0)) AS started,
	sum(if(blob1 = 'win', _sample_interval, 0)) AS won,
	sum(if(blob1 = 'loss', _sample_interval, 0)) AS lost
FROM secle_games
WHERE timestamp > NOW() - INTERVAL '${days}' DAY
GROUP BY day, kind, mode
FORMAT JSON`;

const res = await fetch(
	`https://api.cloudflare.com/client/v4/accounts/${account}/analytics_engine/sql`,
	{ method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: query }
);
const text = await res.text();
if (!res.ok) {
	console.error(`error: Cloudflare returned ${res.status}`);
	console.error(text);
	process.exit(1);
}

const rows = (JSON.parse(text) as { data: Row[] }).data;
const byDay = new Map<string, Day>();
for (const r of rows) {
	let d = byDay.get(r.day);
	if (!d) {
		d = { term: 0, acronym: 0, finished: 0, won: 0, unlimited: 0 };
		byDay.set(r.day, d);
	}
	const started = Number(r.started);
	if (r.kind === 'unlimited') {
		d.unlimited += started;
		continue;
	}
	if (r.mode === 'acronym') d.acronym += started;
	else d.term += started;
	d.finished += Number(r.won) + Number(r.lost);
	d.won += Number(r.won);
}

if (byDay.size === 0) {
	console.log(`No games in the last ${days} days`);
	process.exit(0);
}

const header = ['Day', 'Daily term', 'Daily acronym', 'Finished', 'Won', 'Unlimited'];
const table = [header];
for (const day of [...byDay.keys()].sort().reverse()) {
	const d = byDay.get(day)!;
	table.push([day, d.term, d.acronym, d.finished, d.won, d.unlimited].map(String));
}

const widths = header.map((_, i) => Math.max(...table.map((row) => row[i].length)));
for (const row of table) {
	console.log(row.map((cell, i) => cell.padEnd(widths[i])).join('  '));
}
console.log('\nDaily columns count people who started that puzzle. Unlimited counts games.');
