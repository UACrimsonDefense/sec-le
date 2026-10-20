import { readFileSync, writeFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { LAUNCH } from './launch.ts';

type Term = { id: number; acronym: string; added: string; retired: string };

const YEARS_AHEAD = 5;
const MODES = ['term'];
const OUTPUT = 'src/lib/server/schedule.json';

let seed = process.env.DAILY_SEED ?? '';
if (seed === '') {
	if (process.argv.includes('--release')) {
		console.error('error: DAILY_SEED is not set');
		process.exit(1);
	}
	console.warn('warning: DAILY_SEED is not set, using a dev seed');
	seed = 'dev';
}

function addDays(date: string, days: number): string {
	const d = new Date(date + 'T00:00:00Z');
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

function isEligible(t: Term, mode: string, date: string): boolean {
	if (t.added > date) return false;
	if (t.retired !== '' && t.retired <= date) return false;
	if (mode === 'acronym' && t.acronym === '') return false;
	return true;
}

function pickIndex(mode: string, day: number, size: number): number {
	const hash = createHmac('sha256', seed).update(`${mode}:${day}`).digest();
	return hash.readUInt32BE(0) % size;
}

function simulate(terms: Term[], mode: string, end: string): number[] {
	const picks: number[] = [];
	let used = new Set<number>();
	let last = 0;

	for (let day = 1; addDays(LAUNCH, day - 1) <= end; day++) {
		const date = addDays(LAUNCH, day - 1);
		const eligible: Term[] = [];
		for (const t of terms) {
			if (isEligible(t, mode, date)) eligible.push(t);
		}
		if (eligible.length === 0) {
			console.error(`error: no ${mode} terms available on ${date}`);
			process.exit(1);
		}

		let pool: Term[] = [];
		for (const t of eligible) {
			if (!used.has(t.id)) pool.push(t);
		}
		if (pool.length === 0) {
			used = new Set<number>();
			for (const t of eligible) {
				if (t.id !== last || eligible.length === 1) pool.push(t);
			}
		}

		const t = pool[pickIndex(mode, day, pool.length)];
		picks.push(t.id);
		used.add(t.id);
		last = t.id;
	}
	return picks;
}

const terms = JSON.parse(readFileSync('src/lib/server/terms.json', 'utf8')) as Term[];
terms.sort((a, b) => a.id - b.id);

const today = new Date().toISOString().slice(0, 10);
const end = addDays(today, YEARS_AHEAD * 365);

const schedule: Record<string, string | number[]> = { launch: LAUNCH };
for (const mode of MODES) {
	schedule[mode] = simulate(terms, mode, end);
}

writeFileSync(OUTPUT, JSON.stringify(schedule));
console.log(`Scheduled daily puzzles from ${LAUNCH} to ${end}`);
