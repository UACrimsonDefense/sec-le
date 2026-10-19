import type { Shape } from '#lib/types.js';

export type Term = { id: number; term: string; definition: string };

export const terms: Term[] = [
	{
		id: 1,
		term: 'PHISHING',
		definition:
			'Tricking people into giving up credentials or info, usually through fake emails or sites.'
	},
	{
		id: 2,
		term: 'DEFENSE IN DEPTH',
		definition:
			'Layering multiple independent security controls so one failure does not expose everything.'
	},
	{
		id: 3,
		term: 'SHA-256',
		definition: 'A hashing algorithm that produces a 256-bit digest, used to verify integrity.'
	},
	{
		id: 4,
		term: 'HONEYPOT',
		definition: 'A decoy system set up to attract attackers and study their behavior.'
	}
];

export function getShape(term: string): Shape {
	return (term.match(/[^ ]+| /g) ?? []).map((part) => (part === ' ' ? part : part.length));
}

export function letters(term: string): string {
	return term.replace(/ /g, '');
}

export function maxGuesses(term: string): number {
	return Math.min(8, Math.max(5, letters(term).length + 2));
}
