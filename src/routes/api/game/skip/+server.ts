import { json, error } from '@sveltejs/kit';
import { unlockedHints } from '#lib/server/terms.js';
import { track } from '#lib/server/stats.js';
import { readToken, gameTerm, historyEntry, saveForUser } from '#lib/server/game.js';
import type { SkipBody, SkipResult } from '#lib/types.js';

export const prerender = false;

export async function POST({ request, cookies }) {
	const size = Number(request.headers.get('content-length'));
	if (Number.isNaN(size) || size === 0) error(411, 'Length required');
	if (size > 500) error(413, 'Too large');

	const body = (await request.json().catch(() => null)) as Partial<SkipBody> | null;
	const state = await readToken(body?.token);
	if (!state || state.date !== '') error(400, 'Bad game');
	const t = gameTerm(state);
	if (!t) error(400, 'Unknown term');

	track('skip', 'unlimited', '', '', '', 0);
	const entry = historyEntry(t, state, 'skipped', state.guesses);
	await saveForUser(cookies, entry);

	return json({
		answer: t.term,
		objective: t.objective,
		hints: unlockedHints(t, 'term', 'easy', 0, true),
		entry
	} satisfies SkipResult);
}
