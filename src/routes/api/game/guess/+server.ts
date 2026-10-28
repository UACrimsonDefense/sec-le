import { json, error } from '@sveltejs/kit';
import { letters, maxGuesses, unlockedHints } from '#lib/server/terms.js';
import { score } from '#lib/server/score.js';
import { isValidGuess } from '#lib/server/dictionary.js';
import { isArchiveDate } from '#lib/server/daily.js';
import { track, type Kind } from '#lib/server/stats.js';
import { readToken, makeToken, gameTerm, historyEntry, saveForUser } from '#lib/server/game.js';
import type { GuessBody, GuessResult, HistoryEntry } from '#lib/types.js';

export const prerender = false;

export async function POST({ request, cookies }) {
	const size = Number(request.headers.get('content-length'));
	if (Number.isNaN(size) || size === 0) error(411, 'Length required');
	if (size > 600) error(413, 'Too large');

	const body = (await request.json().catch(() => null)) as Partial<GuessBody> | null;
	const guess = body?.guess;
	if (typeof guess !== 'string' || guess.length > 40 || !/^[A-Z0-9.\/-]+$/.test(guess)) {
		error(400, 'Bad request');
	}

	const state = await readToken(body?.token);
	if (!state) error(400, 'Bad game');
	const t = gameTerm(state);
	if (!t) error(400, 'Unknown term');

	const guessNumber = state.guesses + 1;
	const answer = letters(t.term);
	if (guess.length !== answer.length || guessNumber > maxGuesses(t.term)) error(400, 'Bad guess');
	if (!isValidGuess(guess)) error(422, 'Not a word');

	const colors = score(guess, t.term);
	const solved = guess === answer;
	const over = solved || guessNumber === maxGuesses(t.term);

	let token = '';
	let entry: HistoryEntry | null = null;
	if (over) {
		let kind: Kind = 'daily';
		if (state.date === '') kind = 'unlimited';
		else if (isArchiveDate(state.date)) kind = 'archive';
		track(solved ? 'win' : 'loss', kind, state.mode, state.date, state.difficulty, guessNumber);
		entry = historyEntry(t, state, solved ? 'won' : 'lost', guessNumber);
		await saveForUser(cookies, entry);
	} else {
		token = await makeToken({ ...state, guesses: guessNumber });
	}

	return json({
		colors,
		solved,
		token,
		termId: over ? t.id : null,
		answer: over ? t.term : null,
		objective: over ? t.objective : null,
		hints: unlockedHints(t, state.mode, state.difficulty, guessNumber, over),
		entry
	} satisfies GuessResult);
}
