import { json, error } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import { readBody, confirmPassword } from '#lib/server/auth/request.js';
import { newRecoveryCode, hashRecoveryCode } from '#lib/server/auth/account.js';
import { isPassword } from '#lib/server/auth/password.js';
import type { RecoveryCode } from '#lib/types.js';

export const prerender = false;

export async function POST({ request, cookies, getClientAddress }) {
	const body = await readBody(request, 200);
	const password = body.password;
	if (!isPassword(password)) error(400, 'Bad request');

	const user = await confirmPassword(cookies, getClientAddress(), password, 'Wrong password');
	const code = newRecoveryCode();
	await env.AUTH.prepare('UPDATE users SET recovery = ? WHERE id = ?')
		.bind(await hashRecoveryCode(code), user.id)
		.run();
	return json({ code } satisfies RecoveryCode);
}
