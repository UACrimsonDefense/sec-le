import { json, error } from '@sveltejs/kit';
import { currentUser, endAllSessions } from '#lib/server/auth/session.js';

export const prerender = false;

export async function POST({ cookies }) {
	const session = await currentUser(cookies);
	if (!session) error(401, 'Not signed in');
	await endAllSessions(cookies, session.id);
	return json({});
}
