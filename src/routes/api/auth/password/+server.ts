import { json, error } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import { readBody, confirmPassword, hashNewPassword } from '#lib/server/auth/request.js';
import { isPassword, isNewPassword } from '#lib/server/auth/password.js';
import { endAllSessions, startSession } from '#lib/server/auth/session.js';

export const prerender = false;

export async function POST({ request, cookies, getClientAddress }) {
	const body = await readBody(request, 300);
	const current = body.current;
	const password = body.password;
	if (!isPassword(current) || !isNewPassword(password)) error(400, 'Bad request');

	const user = await confirmPassword(
		cookies,
		getClientAddress(),
		current,
		'Wrong current password'
	);
	const hash = await hashNewPassword(password);
	await env.AUTH.prepare('UPDATE users SET hash = ? WHERE id = ?').bind(hash, user.id).run();
	await endAllSessions(cookies, user.id);
	await startSession(cookies, user.id);
	return json({});
}
