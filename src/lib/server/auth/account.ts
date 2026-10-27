import { env } from 'cloudflare:workers';
import blocked from '#lib/server/auth/blocked.txt?raw';
import blockedAnywhere from '#lib/server/auth/blocked-anywhere.txt?raw';
import { randomBytes, base64url, fromBase64, hmac, equal } from '#lib/server/auth/crypto.js';
import { verifyPassword, hashPassword, needsRehash } from '#lib/server/auth/password.js';

export type User = {
	id: number;
	username: string;
	hash: string;
	recovery: string;
	failed: number;
	locked_until: number;
};
export type Login = 'ok' | 'wrong' | 'locked' | 'down';

const BLOCKED = new Set<string>(blocked.trim().split('\n'));
const BLOCKED_ANYWHERE = blockedAnywhere.trim().split('\n');
const DIGITS = '0123456789';
const DIGIT_LETTERS = 'oizeasgtbg';
const DIGIT_LETTERS_L = 'olzeasgtbg';
const CODE_LETTERS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_LENGTH = 16;
const FREE_TRIES = 5;
const MAX_LOCK_MINUTES = 60;
const MINUTE_MS = 60 * 1000;

export function cleanUsername(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const username = value.trim().toLowerCase();
	if (!/^[a-z0-9_-]{3,20}$/.test(username)) return null;
	return username;
}

function spellings(word: string): string[] {
	let noDigits = '';
	let letters = '';
	let lettersL = '';
	for (const c of word) {
		const digit = DIGITS.indexOf(c);
		if (digit === -1) {
			noDigits += c;
			letters += c;
			lettersL += c;
		} else {
			letters += DIGIT_LETTERS[digit];
			lettersL += DIGIT_LETTERS_L[digit];
		}
	}
	return [word, noDigits, letters, lettersL];
}

function isBlocked(word: string): boolean {
	if (BLOCKED.has(word)) return true;
	for (const bad of BLOCKED_ANYWHERE) {
		if (word.includes(bad)) return true;
	}
	return false;
}

export function isAllowedUsername(username: string): boolean {
	const words = username.split(/[_-]/);
	words.push(username.replaceAll('_', '').replaceAll('-', ''));
	for (const word of words) {
		for (const spelling of spellings(word)) {
			if (isBlocked(spelling)) return false;
		}
	}
	return true;
}

export async function findUser(username: string): Promise<User | null> {
	return env.AUTH.prepare(
		'SELECT id, username, hash, recovery, failed, locked_until FROM users WHERE username = ?'
	)
		.bind(username)
		.first<User>();
}

export function newRecoveryCode(): string {
	const bytes = randomBytes(CODE_LENGTH);
	let code = '';
	for (let i = 0; i < CODE_LENGTH; i++) {
		if (i > 0 && i % 4 === 0) code += '-';
		code += CODE_LETTERS[bytes[i] % CODE_LETTERS.length];
	}
	return code;
}

export function cleanRecoveryCode(value: unknown): string | null {
	if (typeof value !== 'string' || value.length > 40) return null;
	let code = value.toUpperCase().replace(/[\s-]/g, '');
	code = code.replaceAll('O', '0').replaceAll('I', '1').replaceAll('L', '1');
	if (code.length !== CODE_LENGTH) return null;
	for (const c of code) {
		if (!CODE_LETTERS.includes(c)) return null;
	}
	return code;
}

export async function hashRecoveryCode(code: string): Promise<string> {
	return base64url(await hmac(code.replaceAll('-', '')));
}

export async function isRecoveryCode(code: string, stored: string): Promise<boolean> {
	return equal(await hmac(code.replaceAll('-', '')), fromBase64(stored));
}

function lockMinutes(failed: number): number {
	if (failed < FREE_TRIES) return 0;
	const minutes = 2 ** (failed - FREE_TRIES);
	if (minutes > MAX_LOCK_MINUTES) return MAX_LOCK_MINUTES;
	return minutes;
}

export async function checkLogin(user: User, password: string): Promise<Login> {
	const now = Date.now();
	if (user.locked_until > now) return 'locked';

	const result = await verifyPassword(password, user.hash);
	if (result === 'down') return 'down';

	if (result === 'wrong') {
		const failed = user.failed + 1;
		const minutes = lockMinutes(failed);
		let lockedUntil = 0;
		if (minutes > 0) lockedUntil = now + minutes * MINUTE_MS;
		await env.AUTH.prepare('UPDATE users SET failed = ?, locked_until = ? WHERE id = ?')
			.bind(failed, lockedUntil, user.id)
			.run();
		console.log(JSON.stringify({ auth: 'wrong_password', user: user.id, failed, minutes }));
		return 'wrong';
	}

	let hash = user.hash;
	if (needsRehash(user.hash)) {
		const fresh = await hashPassword(password);
		if (fresh) hash = fresh;
	}
	if (user.failed > 0 || hash !== user.hash) {
		await env.AUTH.prepare('UPDATE users SET failed = 0, locked_until = 0, hash = ? WHERE id = ?')
			.bind(hash, user.id)
			.run();
	}
	return 'ok';
}
