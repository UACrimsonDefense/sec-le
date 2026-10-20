import list from '#lib/server/words.txt?raw';
import { terms } from '#lib/server/terms.js';

const words = new Set<string>(list.split('\n'));
for (const t of terms) {
	addRuns(t.term);
	addRuns(t.acronym);
}

function addRuns(text: string) {
	for (const run of text.toUpperCase().split(/[^A-Z]+/)) {
		if (run !== '') words.add(run);
	}
}

function isChain(run: string): boolean {
	const ok: boolean[] = [true];
	for (let end = 1; end <= run.length; end++) {
		ok[end] = false;
		for (let start = 0; start < end; start++) {
			if (ok[start] && words.has(run.slice(start, end))) {
				ok[end] = true;
				break;
			}
		}
	}
	return ok[run.length];
}

export function isValidGuess(guess: string): boolean {
	for (const run of guess.split(/[^A-Z]+/)) {
		if (run !== '' && !isChain(run)) return false;
	}
	return true;
}
