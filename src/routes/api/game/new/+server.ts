import { json } from '@sveltejs/kit';
import { terms, getShape, maxGuesses } from '#lib/server/terms.js';
import type { NewGame } from '#lib/types.js';

export function GET() {
	const t = terms[Math.floor(Math.random() * terms.length)];
	return json({
		termId: t.id,
		shape: getShape(t.term),
		maxGuesses: maxGuesses(t.term),
		definition: t.definition
	} satisfies NewGame);
}
