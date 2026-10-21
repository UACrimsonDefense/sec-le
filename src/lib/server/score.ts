import type { Color } from '#lib/types.js';

export function score(guess: string, term: string): Color[] {
	const answer = term.toUpperCase().replace(/ /g, '');
	const wordOf: number[] = [];
	let word = 0;
	for (const c of term) {
		if (c === ' ') word++;
		else wordOf.push(word);
	}

	const result: Color[] = Array(guess.length).fill('absent');
	const inWord: Record<string, number>[] = [];
	const anywhere: Record<string, number> = {};

	for (let i = 0; i < answer.length; i++) {
		if (guess[i] === answer[i]) {
			result[i] = 'correct';
		} else {
			const counts = inWord[wordOf[i]] ?? {};
			counts[answer[i]] = (counts[answer[i]] ?? 0) + 1;
			inWord[wordOf[i]] = counts;
			anywhere[answer[i]] = (anywhere[answer[i]] ?? 0) + 1;
		}
	}

	for (let i = 0; i < guess.length; i++) {
		const counts = inWord[wordOf[i]];
		if (result[i] === 'absent' && counts && counts[guess[i]]) {
			result[i] = 'present';
			counts[guess[i]]--;
			anywhere[guess[i]]--;
		}
	}

	for (let i = 0; i < guess.length; i++) {
		if (result[i] === 'absent' && anywhere[guess[i]]) {
			result[i] = 'elsewhere';
			anywhere[guess[i]]--;
		}
	}

	return result;
}
