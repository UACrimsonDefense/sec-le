import type { Color } from '#lib/types.js';

export function score(guess: string, answer: string): Color[] {
	const result: Color[] = Array(guess.length).fill('absent');
	const unused: Record<string, number> = {};

	for (let i = 0; i < answer.length; i++) {
		if (guess[i] === answer[i]) result[i] = 'correct';
		else unused[answer[i]] = (unused[answer[i]] ?? 0) + 1;
	}

	for (let i = 0; i < guess.length; i++) {
		if (result[i] !== 'correct' && unused[guess[i]]) {
			result[i] = 'present';
			unused[guess[i]]--;
		}
	}

	return result;
}
