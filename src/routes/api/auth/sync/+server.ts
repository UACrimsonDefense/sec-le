import { json, error } from '@sveltejs/kit';
import { currentUser } from '#lib/server/auth/session.js';
import { loadHistory, loadSettings } from '#lib/server/history.js';
import type { SyncData } from '#lib/types.js';

export const prerender = false;

export async function GET({ cookies }) {
	const user = await currentUser(cookies);
	if (!user) error(401, 'Not signed in');
	return json({
		username: user.username,
		history: await loadHistory(user.id),
		settings: await loadSettings(user.id)
	} satisfies SyncData);
}
