import { json } from '@sveltejs/kit';
import { playable, getShape, maxGuesses } from '#lib/server/terms.js';
import type { NewGame } from '#lib/types.js';

export function GET() {
	const pool = playable();
	const t = pool[Math.floor(Math.random() * pool.length)];
	return json({
		termId: t.id,
		shape: getShape(t.term),
		maxGuesses: maxGuesses(t.term),
		definition: t.definition
	} satisfies NewGame);
}
