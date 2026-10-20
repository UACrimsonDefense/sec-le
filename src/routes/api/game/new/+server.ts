import { json, error } from '@sveltejs/kit';
import { playable, getShape, maxGuesses, isDifficulty, unlockedHints } from '#lib/server/terms.js';
import type { NewGame } from '#lib/types.js';

export function GET({ url }) {
	const difficulty = url.searchParams.get('difficulty');
	if (!isDifficulty(difficulty)) error(400, 'Bad difficulty');

	const pool = playable();
	const t = pool[Math.floor(Math.random() * pool.length)];
	return json({
		termId: t.id,
		shape: getShape(t.term),
		maxGuesses: maxGuesses(t.term),
		hints: unlockedHints(t, difficulty, 0, false)
	} satisfies NewGame);
}
