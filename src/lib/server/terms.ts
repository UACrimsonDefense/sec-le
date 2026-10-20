import type { Shape } from '#lib/types.js';
import data from '#lib/server/terms.json';

export type Term = {
	id: number;
	term: string;
	acronym: string;
	definition: string;
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
