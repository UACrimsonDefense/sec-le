import { json, error } from '@sveltejs/kit';
import {
	playable,
	getShape,
	maxGuesses,
	isMode,
	isDifficulty,
	unlockedHints
} from '#lib/server/terms.js';
import { isAllowedDate, dailyTerm, dayNumber } from '#lib/server/daily.js';
import { track } from '#lib/server/stats.js';
import type { Term } from '#lib/server/terms.js';
import type { Mode, Difficulty, NewGame } from '#lib/types.js';

export const prerender = false;

function pick(pool: Term[]): Term {
	return pool[Math.floor(Math.random() * pool.length)];
}

function game(t: Term, termId: number, day: number, mode: Mode, difficulty: Difficulty): NewGame {
	return {
		termId: termId,
		day: day,
		shape: getShape(t.term),
		maxGuesses: maxGuesses(t.term),
		hints: unlockedHints(t, mode, difficulty, 0, false)
	};
}

export function GET({ url }) {
	const mode = url.searchParams.get('mode');
	const difficulty = url.searchParams.get('difficulty');
	const date = url.searchParams.get('date');
	const domain = url.searchParams.get('domain') ?? '';
	const last = url.searchParams.get('last') ?? '';
	if (
		!isMode(mode) ||
		!isDifficulty(difficulty) ||
		!/^[1-5]?$/.test(domain) ||
		!/^\d{0,6}$/.test(last)
	) {
		error(400, 'Bad request');
	}

	if (date !== null) {
		if (!isAllowedDate(date)) error(400, 'Bad date');
		const t = dailyTerm(date, mode);
		if (!t) error(404, 'No puzzle today');
		track('start', 'daily', mode, date, difficulty, 0);
		return json(game(t, 0, dayNumber(date), mode, difficulty));
	}

	const pool: Term[] = [];
	for (const t of playable()) {
		if (mode === 'acronym' && t.acronym === '') continue;
		if (domain === '' || t.domain === Number(domain)) pool.push(t);
	}
	if (pool.length === 0) error(404, 'No terms');

	let t = pick(pool);
	while (pool.length > 1 && t.id === Number(last)) {
		t = pick(pool);
	}
	track('start', 'unlimited', mode, '', difficulty, 0);
	return json(game(t, t.id, 0, mode, difficulty));
}
