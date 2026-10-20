import { json, error } from '@sveltejs/kit';
import { playable, getShape, maxGuesses, isDifficulty, unlockedHints } from '#lib/server/terms.js';
import type { Term } from '#lib/server/terms.js';
import type { NewGame } from '#lib/types.js';

function pick(pool: Term[]): Term {
	return pool[Math.floor(Math.random() * pool.length)];
}

export function GET({ url }) {
	const difficulty = url.searchParams.get('difficulty');
	const domain = url.searchParams.get('domain') ?? '';
	const last = url.searchParams.get('last') ?? '';
	if (!isDifficulty(difficulty) || !/^[1-5]?$/.test(domain) || !/^\d{0,6}$/.test(last)) {
		error(400, 'Bad request');
	}

	const pool: Term[] = [];
	for (const t of playable()) {
		if (domain === '' || t.domain === Number(domain)) pool.push(t);
	}
	if (pool.length === 0) error(404, 'No terms');

	let t = pick(pool);
	while (pool.length > 1 && t.id === Number(last)) {
		t = pick(pool);
	}

	return json({
		termId: t.id,
		shape: getShape(t.term),
		maxGuesses: maxGuesses(t.term),
		hints: unlockedHints(t, difficulty, 0, false)
	} satisfies NewGame);
}
