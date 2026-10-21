import type { Shape, Mode, Difficulty, Hints } from '#lib/types.js';
import data from '#lib/server/terms.json';

export type Term = {
	id: number;
	term: string;
	acronym: string;
	definition: string;
	objective: string;
	domain: number;
	category: string;
	added: string;
	retired: string;
};

export const terms: Term[] = data;

export function playable(): Term[] {
	const today = new Date().toISOString().slice(0, 10);
	const result: Term[] = [];
	for (const t of terms) {
		if (t.added <= today && (t.retired === '' || t.retired > today)) result.push(t);
	}
	return result;
}

export function getShape(term: string): Shape {
	return (term.match(/[^ ]+| /g) ?? []).map((part) => (part === ' ' ? part : part.length));
}

export function letters(term: string): string {
	return term.toUpperCase().replace(/ /g, '');
}

export function maxGuesses(term: string): number {
	return Math.min(8, Math.max(5, letters(term).length + 2));
}

export function isMode(value: unknown): value is Mode {
	return value === 'term' || value === 'acronym';
}

export function isDifficulty(value: unknown): value is Difficulty {
	return value === 'easy' || value === 'medium' || value === 'hard';
}

export function unlockedHints(
	t: Term,
	mode: Mode,
	difficulty: Difficulty,
	guessNumber: number,
	over: boolean
): Hints {
	const hints: Hints = { acronym: '', category: '', definition: '' };
	const max = maxGuesses(t.term);

	if (over || mode === 'acronym') hints.acronym = t.acronym;

	if (over || difficulty === 'easy') {
		hints.category = t.category;
		hints.definition = t.definition;
	} else if (difficulty === 'medium') {
		if (guessNumber >= Math.round(max / 3)) hints.category = t.category;
		if (guessNumber >= Math.round((max * 2) / 3)) hints.definition = t.definition;
	}
	return hints;
}
