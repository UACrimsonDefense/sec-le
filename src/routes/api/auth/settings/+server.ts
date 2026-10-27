import { json, error } from '@sveltejs/kit';
import { readBody } from '#lib/server/auth/request.js';
import { currentUser } from '#lib/server/auth/session.js';
import { saveSettings } from '#lib/server/history.js';
import { isDifficulty } from '#lib/server/terms.js';
import type { SyncedSettings } from '#lib/types.js';

export const prerender = false;

const THEMES = ['', 'light', 'dark', 'crimson'];
const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST({ request, cookies }) {
	const body = await readBody(request, 200);
	const { difficulty, theme, colorblind, updated } = body;
	if (
		(difficulty !== '' && !isDifficulty(difficulty)) ||
		typeof theme !== 'string' ||
		!THEMES.includes(theme) ||
		typeof colorblind !== 'boolean' ||
		typeof updated !== 'number' ||
		!Number.isInteger(updated) ||
		updated <= 0 ||
		updated > Date.now() + DAY_MS
	) {
		error(400, 'Bad request');
	}

	const user = await currentUser(cookies);
	if (!user) error(401, 'Not signed in');
	await saveSettings(user.id, { difficulty, theme, colorblind, updated } satisfies SyncedSettings);
	return json({});
}
