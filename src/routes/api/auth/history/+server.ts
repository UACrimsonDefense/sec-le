import { json, error } from '@sveltejs/kit';
import { readBody } from '#lib/server/auth/request.js';
import { currentUser } from '#lib/server/auth/session.js';
import { insertHistory, countHistory, MAX_HISTORY } from '#lib/server/history.js';
import { terms, maxGuesses, isMode, isDifficulty } from '#lib/server/terms.js';
import type { HistoryEntry } from '#lib/types.js';

export const prerender = false;

const MAX_ENTRIES = 500;

function cleanEntry(value: unknown): HistoryEntry | null {
	if (typeof value !== 'object' || value === null) return null;
	const e = value as Record<string, unknown>;
	if (typeof e.termId !== 'number' || typeof e.day !== 'number' || typeof e.guesses !== 'number') {
		return null;
	}
	if (!Number.isInteger(e.day) || e.day < 0 || e.day > 100000) return null;
	if (!isMode(e.mode) || !isDifficulty(e.difficulty)) return null;
	if (e.result !== 'won' && e.result !== 'lost' && e.result !== 'skipped') return null;
	if (typeof e.date !== 'string' || !/^\d{4}-\d{2}-\d{2}T[\d:.]{8,12}Z$/.test(e.date)) return null;
	if (e.game !== undefined && (typeof e.game !== 'string' || !/^[A-Za-z0-9_-]{16}$/.test(e.game))) {
		return null;
	}
	const t = terms.find((t) => t.id === e.termId);
	if (!t) return null;
	if (!Number.isInteger(e.guesses) || e.guesses < 0 || e.guesses > maxGuesses(t.term)) return null;
	const entry: HistoryEntry = {
		termId: t.id,
		day: e.day,
		mode: e.mode,
		objective: t.objective,
		difficulty: e.difficulty,
		result: e.result,
		guesses: e.guesses,
		date: e.date
	};
	if (typeof e.game === 'string') entry.game = e.game;
	return entry;
}

export async function POST({ request, cookies }) {
	const body = await readBody(request, 150000);
	if (!Array.isArray(body.entries) || body.entries.length > MAX_ENTRIES) error(400, 'Bad request');

	const user = await currentUser(cookies);
	if (!user) error(401, 'Not signed in');

	const entries: HistoryEntry[] = [];
	for (const value of body.entries) {
		const entry = cleanEntry(value);
		if (entry) entries.push(entry);
	}
	if ((await countHistory(user.id)) + entries.length > MAX_HISTORY) error(409, 'History is full');
	await insertHistory(user.id, entries, 'upload');
	return json({});
}
