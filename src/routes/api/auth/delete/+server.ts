import { json, error } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import { readBody, confirmPassword } from '#lib/server/auth/request.js';
import { isPassword } from '#lib/server/auth/password.js';
import { endAllSessions } from '#lib/server/auth/session.js';

export const prerender = false;

export async function POST({ request, cookies, getClientAddress }) {
	const body = await readBody(request, 200);
	const password = body.password;
	if (!isPassword(password)) error(400, 'Bad request');

	const user = await confirmPassword(cookies, getClientAddress(), password, 'Wrong password');
	await endAllSessions(cookies, user.id);
	await env.AUTH.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();
	console.log(JSON.stringify({ auth: 'deleted', user: user.id }));
	return json({});
}
