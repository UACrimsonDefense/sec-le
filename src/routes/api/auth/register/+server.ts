import { json, error } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import { readBody, allowed, hashNewPassword, TOO_MANY } from '#lib/server/auth/request.js';
import {
	cleanUsername,
	isAllowedUsername,
	findUser,
	newRecoveryCode,
	hashRecoveryCode
} from '#lib/server/auth/account.js';
import { isNewPassword } from '#lib/server/auth/password.js';
import { startSession } from '#lib/server/auth/session.js';
import type { NewAccount } from '#lib/types.js';

export const prerender = false;

export async function POST({ request, cookies, getClientAddress }) {
	const body = await readBody(request, 300);
	const username = cleanUsername(body.username);
	const password = body.password;
	if (!username || !isNewPassword(password)) error(400, 'Bad request');
	if (!isAllowedUsername(username)) error(400, 'Pick a different username');

	if (!(await allowed(env.REGISTER_LIMIT, getClientAddress()))) error(429, TOO_MANY);
	if (await findUser(username)) error(409, 'That username is taken');

	const hash = await hashNewPassword(password);
	const code = newRecoveryCode();
	const user = await env.AUTH.prepare(
		'INSERT INTO users (username, hash, recovery, created) VALUES (?, ?, ?, ?) ON CONFLICT (username) DO NOTHING RETURNING id'
	)
		.bind(username, hash, await hashRecoveryCode(code), Date.now())
		.first<{ id: number }>();
	if (!user) error(409, 'That username is taken');

	await startSession(cookies, user.id);
	return json({ username, code } satisfies NewAccount);
}
