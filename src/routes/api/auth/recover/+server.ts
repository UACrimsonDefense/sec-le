import { json, error } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import { readBody, allowed, hashNewPassword, TOO_MANY } from '#lib/server/auth/request.js';
import {
	cleanUsername,
	cleanRecoveryCode,
	findUser,
	isRecoveryCode,
	newRecoveryCode,
	hashRecoveryCode
} from '#lib/server/auth/account.js';
import { isNewPassword } from '#lib/server/auth/password.js';
import type { RecoveryCode } from '#lib/types.js';

export const prerender = false;

const WRONG = 'Wrong username or recovery code';

export async function POST({ request, getClientAddress }) {
	const body = await readBody(request, 300);
	const username = cleanUsername(body.username);
	const code = cleanRecoveryCode(body.code);
	const password = body.password;
	if (typeof body.username !== 'string' || !isNewPassword(password)) error(400, 'Bad request');

	if (!(await allowed(env.RECOVER_LIMIT, getClientAddress()))) error(429, TOO_MANY);
	if (!username || !code) error(400, WRONG);
	const user = await findUser(username);
	if (!user || !(await isRecoveryCode(code, user.recovery))) {
		console.log(JSON.stringify({ auth: 'wrong_recovery_code' }));
		error(400, WRONG);
	}

	const hash = await hashNewPassword(password);
	const next = newRecoveryCode();
	await env.AUTH.batch([
		env.AUTH.prepare(
			'UPDATE users SET hash = ?, recovery = ?, failed = 0, locked_until = 0 WHERE id = ?'
		).bind(hash, await hashRecoveryCode(next), user.id),
		env.AUTH.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id)
	]);
	console.log(JSON.stringify({ auth: 'recovered', user: user.id }));
	return json({ code: next } satisfies RecoveryCode);
}
