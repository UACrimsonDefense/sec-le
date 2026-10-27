import { json } from '@sveltejs/kit';
import { endSession } from '#lib/server/auth/session.js';

export const prerender = false;

export async function POST({ cookies }) {
	await endSession(cookies);
	return json({});
}
