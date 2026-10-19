import { json, error } from '@sveltejs/kit';
import { terms, letters, maxGuesses } from '#lib/server/terms.js';
import { score } from '#lib/server/score.js';
import type { GuessBody, GuessResult } from '#lib/types.js';

export async function POST({ request }) {
	const { termId, guess, guessNumber } = (await request.json()) as GuessBody;
	const t = terms.find((t) => t.id === termId);
	if (!t) error(400, 'Unknown term');

	const answer = letters(t.term);
	if (typeof guess !== 'string' || !/^[A-Z0-9.\/-]+$/.test(guess) || guess.length !== answer.length)
		error(400, 'Bad guess');

	const colors = score(guess, answer);
	const solved = guess === answer;
	const over = solved || guessNumber >= maxGuesses(t.term);

	return json({ colors, solved, answer: over ? t.term : null } satisfies GuessResult);
}
