import { env } from 'cloudflare:workers';
import type { Cookies } from '@sveltejs/kit';
import { randomBytes, base64url, sha256 } from '#lib/server/auth/crypto.js';

export type SessionUser = { id: number; username: string };
type SessionRow = { id: number; username: string; expires: number };

const COOKIE = '__Host-session';
const DAY_MS = 24 * 60 * 60 * 1000;
const SESSION_DAYS = 30;
const RENEW_DAYS = 15;

function setCookie(cookies: Cookies, token: string) {
	cookies.set(COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
		maxAge: SESSION_DAYS * 24 * 60 * 60
	});
}

function clearCookie(cookies: Cookies) {
	cookies.delete(COOKIE, { path: '/', httpOnly: true, secure: true, sameSite: 'strict' });
}

async function sessionId(token: string): Promise<string> {
	return base64url(await sha256(token));
}

function readToken(cookies: Cookies): string | null {
	const token = cookies.get(COOKIE);
	if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
	return token;
}

export async function startSession(cookies: Cookies, userId: number) {
	const token = base64url(randomBytes(32));
	const now = Date.now();
	await env.AUTH.batch([
		env.AUTH.prepare('DELETE FROM sessions WHERE user_id = ? AND expires < ?').bind(userId, now),
		env.AUTH.prepare(
			'INSERT INTO sessions (id, user_id, expires, created) VALUES (?, ?, ?, ?)'
		).bind(await sessionId(token), userId, now + SESSION_DAYS * DAY_MS, now)
	]);
	setCookie(cookies, token);
}

export async function currentUser(cookies: Cookies): Promise<SessionUser | null> {
	const token = readToken(cookies);
	if (!token) return null;
	const id = await sessionId(token);
	const row = await env.AUTH.prepare(
		'SELECT users.id, users.username, sessions.expires FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.id = ?'
	)
		.bind(id)
		.first<SessionRow>();
	const now = Date.now();
	if (!row || row.expires <= now) {
		clearCookie(cookies);
		return null;
	}
	if (row.expires - now < RENEW_DAYS * DAY_MS) {
		await env.AUTH.prepare('UPDATE sessions SET expires = ? WHERE id = ?')
			.bind(now + SESSION_DAYS * DAY_MS, id)
			.run();
		setCookie(cookies, token);
	}
	return { id: row.id, username: row.username };
}

export async function endSession(cookies: Cookies) {
	const token = readToken(cookies);
	if (token) {
		await env.AUTH.prepare('DELETE FROM sessions WHERE id = ?')
			.bind(await sessionId(token))
			.run();
	}
	clearCookie(cookies);
}

export async function endAllSessions(cookies: Cookies, userId: number) {
	await env.AUTH.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
	clearCookie(cookies);
}
