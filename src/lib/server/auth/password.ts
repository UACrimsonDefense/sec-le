import { env } from 'cloudflare:workers';
import {
	randomBytes,
	base64,
	base64url,
	fromBase64,
	sha1Hex,
	hmac,
	equal
} from '#lib/server/auth/crypto.js';

type Params = { m: number; t: number; p: number };
export type Check = 'ok' | 'wrong' | 'down';

const CURRENT: Params = { m: 19456, t: 2, p: 1 };
const MIN_LENGTH = 12;
const MAX_LENGTH = 64;
const SALT_BYTES = 16;
const TAG_BYTES = 32;
const HASHER_TIMEOUT_MS = 3000;
const RETRY_MS = 250;
const PWNED_TIMEOUT_MS = 2000;

function countCharacters(password: string): number {
	return Array.from(password.normalize('NFKC')).length;
}

export function isPassword(password: unknown): password is string {
	if (typeof password !== 'string') return false;
	const count = countCharacters(password);
	return count >= 1 && count <= MAX_LENGTH;
}

export function isNewPassword(password: unknown): password is string {
	return isPassword(password) && countCharacters(password) >= MIN_LENGTH;
}

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readTag(res: Response): Promise<Uint8Array | null> {
	try {
		const data = (await res.json()) as { tag: string };
		return fromBase64(data.tag);
	} catch {
		return null;
	}
}

async function argon2(
	password: string,
	salt: Uint8Array,
	params: Params
): Promise<Uint8Array | null> {
	const input = await hmac(password.normalize('NFKC'));
	const body = JSON.stringify({
		input: base64url(input),
		salt: base64url(salt),
		m: params.m,
		t: params.t,
		p: params.p
	});
	for (let attempt = 1; attempt <= 2; attempt++) {
		let res: Response;
		try {
			res = await env.HASHER.fetch('http://hasher:8080/argon2', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'X-Hasher-Key': env.HASHER_KEY },
				body: body,
				signal: AbortSignal.timeout(HASHER_TIMEOUT_MS)
			});
		} catch {
			console.error(JSON.stringify({ auth: 'hasher_unreachable' }));
			return null;
		}
		if (res.ok) {
			const tag = await readTag(res);
			if (tag && tag.length === TAG_BYTES) return tag;
			console.error(JSON.stringify({ auth: 'hasher_bad_reply' }));
			return null;
		}
		if (res.status !== 503 || attempt === 2) {
			console.error(JSON.stringify({ auth: 'hasher_error', status: res.status }));
			return null;
		}
		await wait(RETRY_MS);
	}
	return null;
}

function prefix(params: Params): string {
	return `$argon2id$v=19$m=${params.m},t=${params.t},p=${params.p}$`;
}

export async function hashPassword(password: string): Promise<string | null> {
	const salt = randomBytes(SALT_BYTES);
	const tag = await argon2(password, salt, CURRENT);
	if (!tag) return null;
	return prefix(CURRENT) + base64(salt) + '$' + base64(tag);
}

function readParams(text: string): Params | null {
	const match = /^m=(\d+),t=(\d+),p=(\d+)$/.exec(text);
	if (!match) return null;
	return { m: Number(match[1]), t: Number(match[2]), p: Number(match[3]) };
}

export async function verifyPassword(password: string, stored: string): Promise<Check> {
	const parts = stored.split('$');
	if (parts.length !== 6 || parts[1] !== 'argon2id') return 'down';
	const params = readParams(parts[3]);
	if (!params) return 'down';
	const tag = await argon2(password, fromBase64(parts[4]), params);
	if (!tag) return 'down';
	if (equal(tag, fromBase64(parts[5]))) return 'ok';
	return 'wrong';
}

export function needsRehash(stored: string): boolean {
	return !stored.startsWith(prefix(CURRENT));
}

export async function isBreached(password: string): Promise<boolean> {
	const hex = await sha1Hex(password.normalize('NFKC'));
	let text: string;
	try {
		const res = await fetch('https://api.pwnedpasswords.com/range/' + hex.slice(0, 5), {
			headers: { 'Add-Padding': 'true' },
			signal: AbortSignal.timeout(PWNED_TIMEOUT_MS)
		});
		if (!res.ok) return false;
		text = await res.text();
	} catch {
		return false;
	}
	const line = hex.slice(5) + ':';
	const start = text.indexOf(line);
	if (start === -1) return false;
	return parseInt(text.slice(start + line.length), 10) > 0;
}
