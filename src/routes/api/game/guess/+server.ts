import { json, error } from '@sveltejs/kit';
import {
	terms,
	letters,
	maxGuesses,
	isMode,
	isDifficulty,
	unlockedHints
} from '#lib/server/terms.js';
import { score } from '#lib/server/score.js';
import { isValidGuess } from '#lib/server/dictionary.js';
import { isAllowedDate, dailyTerm } from '#lib/server/daily.js';
import type { Term } from '#lib/server/terms.js';
import type { GuessBody, GuessResult } from '#lib/types.js';

export const prerender = false;

export async function POST({ request }) {
	if (Number(request.headers.get('content-length')) > 200) error(413, 'Too large');

	const body = (await request.json().catch(() => null)) as Partial<GuessBody> | null;
	const { termId, date, guess, guessNumber, difficulty, mode } = body ?? {};
	if (
		typeof termId !== 'number' ||
		typeof date !== 'string' ||
		typeof guessNumber !== 'number' ||
		typeof guess !== 'string' ||
		!isMode(mode) ||
		!isDifficulty(difficulty) ||
		!Number.isInteger(guessNumber) ||
		guessNumber < 1 ||
		guess.length > 40 ||
		!/^[A-Z0-9.\/-]+$/.test(guess)
	)
		error(400, 'Bad request');

	let t: Term | undefined;
	if (date !== '') {
		if (!isAllowedDate(date)) error(400, 'Bad date');
		t = dailyTerm(date, mode);
	} else {
		t = terms.find((t) => t.id === termId);
	}
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
		termId: over ? t.id : null,
		answer: over ? t.term : null,
		objective: over ? t.objective : null,
		hints: unlockedHints(t, mode, difficulty, guessNumber, over)
	} satisfies GuessResult);
}
