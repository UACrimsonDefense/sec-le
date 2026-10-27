import { json, error } from '@sveltejs/kit';
import { currentUser } from '#lib/server/auth/session.js';
import type { Account } from '#lib/types.js';

export const prerender = false;

export async function GET({ cookies }) {
	const session = await currentUser(cookies);
	if (!session) error(401, 'Not signed in');
	return json({ username: session.username } satisfies Account);
}
