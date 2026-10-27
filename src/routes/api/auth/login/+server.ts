import { json, error } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import { readBody, allowed, rejectLogin, TOO_MANY } from '#lib/server/auth/request.js';
import { cleanUsername, findUser, checkLogin } from '#lib/server/auth/account.js';
import { isPassword } from '#lib/server/auth/password.js';
import { startSession } from '#lib/server/auth/session.js';
import type { Account } from '#lib/types.js';

export const prerender = false;

const WRONG = 'Wrong username or password';

export async function POST({ request, cookies, getClientAddress }) {
	const body = await readBody(request, 200);
	const password = body.password;
	if (typeof body.username !== 'string' || !isPassword(password)) error(400, 'Bad request');

	if (!(await allowed(env.LOGIN_LIMIT, getClientAddress()))) error(429, TOO_MANY);
	const username = cleanUsername(body.username);
	let user = null;
	if (username) user = await findUser(username);
	if (!user) {
		console.log(JSON.stringify({ auth: 'unknown_user' }));
		error(401, WRONG);
	}

	rejectLogin(await checkLogin(user, password), WRONG);
	await startSession(cookies, user.id);
	return json({ username: user.username } satisfies Account);
}
