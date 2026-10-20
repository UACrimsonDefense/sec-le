import list from '#lib/server/words.txt?raw';
import { terms, getShape } from '#lib/server/terms.js';

const words = new Set<string>(list.split('\n'));
for (const t of terms) {
	for (const word of t.term.toUpperCase().split(' ')) {
		words.add(word);
	}
	if (t.acronym !== '') words.add(t.acronym.toUpperCase());
}

function isWord(word: string): boolean {
	if (!/[A-Z]/.test(word)) return true;
	return words.has(word);
}

export function isValidGuess(guess: string, term: string): boolean {
	let start = 0;
	for (const part of getShape(term)) {
		if (part === ' ') continue;
		if (!isWord(guess.slice(start, start + part))) return false;
		start += part;
	}
	return true;
}
