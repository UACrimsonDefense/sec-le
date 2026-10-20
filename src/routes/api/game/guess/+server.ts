import { json, error } from '@sveltejs/kit';
import { terms, letters, maxGuesses, isDifficulty, unlockedHints } from '#lib/server/terms.js';
import { score } from '#lib/server/score.js';
import { isValidGuess } from '#lib/server/dictionary.js';
import type { GuessBody, GuessResult } from '#lib/types.js';

export async function POST({ request }) {
	if (Number(request.headers.get('content-length')) > 200) error(413, 'Too large');

	const body = (await request.json().catch(() => null)) as Partial<GuessBody> | null;
	const { termId, guess, guessNumber, difficulty } = body ?? {};
	if (
		typeof termId !== 'number' ||
		typeof guessNumber !== 'number' ||
		typeof guess !== 'string' ||
		!isDifficulty(difficulty) ||
		!Number.isInteger(guessNumber) ||
		guessNumber < 1 ||
		guess.length > 40 ||
		!/^[A-Z0-9.\/-]+$/.test(guess)
	)
		error(400, 'Bad request');

	const t = terms.find((t) => t.id === termId);
	if (!t) error(400, 'Unknown term');

	const answer = letters(t.term);
	if (guess.length !== answer.length || guessNumber > maxGuesses(t.term)) error(400, 'Bad guess');
	if (!isValidGuess(guess)) error(422, 'Not a word');

	const colors = score(guess, answer);
	const solved = guess === answer;
	const over = solved || guessNumber === maxGuesses(t.term);

	return json({
		colors,
		solved,
		answer: over ? t.term : null,
		objective: over ? t.objective : null,
		hints: unlockedHints(t, difficulty, guessNumber, over)
	} satisfies GuessResult);
}
