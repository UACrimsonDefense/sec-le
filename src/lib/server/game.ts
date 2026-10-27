import { env } from 'cloudflare:workers';
import type { Cookies } from '@sveltejs/kit';
import { base64url, fromBase64, randomBytes, equal } from '#lib/server/auth/crypto.js';
import { currentUser } from '#lib/server/auth/session.js';
import { insertHistory } from '#lib/server/history.js';
import { terms, type Term } from '#lib/server/terms.js';
import { isAllowedDate, dailyTerm, dayNumber } from '#lib/server/daily.js';
import type { Mode, Difficulty, Result, HistoryEntry } from '#lib/types.js';

export type GameState = {
	termId: number;
	date: string;
	mode: Mode;
	difficulty: Difficulty;
	guesses: number;
	game: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function sign(payload: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode('game-token:' + (env.PEPPER || 'dev')),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
	return base64url(new Uint8Array(signature));
}

export function newGameId(): string {
	return base64url(randomBytes(12));
}

export async function makeToken(state: GameState): Promise<string> {
	const payload = base64url(encoder.encode(JSON.stringify(state)));
	return payload + '.' + (await sign(payload));
}

export async function readToken(token: unknown): Promise<GameState | null> {
	if (typeof token !== 'string' || token.length > 400) return null;
	const parts = token.split('.');
	if (parts.length !== 2) return null;
	const expected = await sign(parts[0]);
	if (!equal(encoder.encode(expected), encoder.encode(parts[1]))) return null;
	try {
		return JSON.parse(decoder.decode(fromBase64(parts[0]))) as GameState;
	} catch {
		return null;
	}
}

export function gameTerm(state: GameState): Term | undefined {
	if (state.date === '') return terms.find((t) => t.id === state.termId);
	if (!isAllowedDate(state.date)) return undefined;
	return dailyTerm(state.date, state.mode);
}

export function historyEntry(
	t: Term,
	state: GameState,
	result: Result,
	guesses: number
): HistoryEntry {
	let day = 0;
	if (state.date !== '') day = dayNumber(state.date);
	return {
		termId: t.id,
		day,
		mode: state.mode,
		objective: t.objective,
		difficulty: state.difficulty,
		result,
		guesses,
		date: new Date().toISOString(),
		game: state.game
	};
}

export async function saveForUser(cookies: Cookies, entry: HistoryEntry) {
	try {
		const user = await currentUser(cookies);
		if (user) await insertHistory(user.id, [entry], 'server');
	} catch {
		console.error(JSON.stringify({ game: 'history_save_failed' }));
	}
}
