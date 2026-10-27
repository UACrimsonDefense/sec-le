import { error, type Cookies } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import { findUser, checkLogin, type Login, type User } from '#lib/server/auth/account.js';
import { isBreached, hashPassword } from '#lib/server/auth/password.js';
import { currentUser } from '#lib/server/auth/session.js';

const DOWN = 'Accounts are down right now. Try again later';
export const TOO_MANY = 'Too many tries. Wait a minute and try again';

export async function readBody(request: Request, max: number): Promise<Record<string, unknown>> {
	const size = Number(request.headers.get('content-length'));
	if (Number.isNaN(size) || size === 0) error(411, 'Length required');
	if (size > max) error(413, 'Too large');
	const body: unknown = await request.json().catch(() => null);
	if (typeof body !== 'object' || body === null || Array.isArray(body)) error(400, 'Bad request');
	return body as Record<string, unknown>;
}

export async function allowed(limiter: RateLimit, key: string): Promise<boolean> {
	try {
		const result = await limiter.limit({ key });
		return result.success;
	} catch {
		return true;
	}
}

export function rejectLogin(result: Login, wrong: string) {
	if (result === 'locked') error(429, 'Too many wrong passwords. Try again later');
	if (result === 'down') error(503, DOWN);
	if (result === 'wrong') error(401, wrong);
}

export async function confirmPassword(
	cookies: Cookies,
	ip: string,
	password: string,
	wrong: string
): Promise<User> {
	const session = await currentUser(cookies);
	if (!session) error(401, 'Not signed in');
	if (!(await allowed(env.LOGIN_LIMIT, ip))) error(429, TOO_MANY);
	const user = await findUser(session.username);
	if (!user) error(401, 'Not signed in');
	rejectLogin(await checkLogin(user, password), wrong);
	return user;
}

export async function hashNewPassword(password: string): Promise<string> {
	if (await isBreached(password)) {
		error(422, 'That password has shown up in a data breach. Pick another');
	}
	const hash = await hashPassword(password);
	if (!hash) error(503, DOWN);
	return hash;
}
