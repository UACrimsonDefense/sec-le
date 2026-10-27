import { historyKey, mergeHistory } from '#lib/history.js';
import type { HistoryEntry, SyncedSettings, SyncData } from '#lib/types.js';

export type Reply = { data: unknown; error: string };

export const account = $state({ username: '', synced: 0 });

const UPLOAD_SIZE = 500;

export function signIn(username: string) {
	account.username = username;
	try {
		localStorage.setItem('account', username);
	} catch {}
}

export function signOut() {
	account.username = '';
	try {
		localStorage.removeItem('account');
	} catch {}
}

export async function checkAccount() {
	let saved = '';
	try {
		saved = localStorage.getItem('account') ?? '';
	} catch {}
	if (saved === '') return;
	account.username = saved;
	await syncAccount();
}

function readHistory(): HistoryEntry[] {
	try {
		const text = localStorage.getItem('history');
		if (text) return JSON.parse(text) as HistoryEntry[];
	} catch {}
	return [];
}

function localSettings(): SyncedSettings {
	const settings: SyncedSettings = { difficulty: '', theme: '', colorblind: false, updated: 0 };
	try {
		const difficulty = localStorage.getItem('difficulty');
		if (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') {
			settings.difficulty = difficulty;
		}
		settings.theme = localStorage.getItem('theme') ?? '';
		settings.colorblind = localStorage.getItem('colorblind') !== null;
		settings.updated = Number(localStorage.getItem('settings-updated') ?? 0);
	} catch {}
	return settings;
}

function applySettings(settings: SyncedSettings) {
	const root = document.documentElement;
	if (settings.theme !== '') root.dataset.theme = settings.theme;
	if (settings.colorblind) root.dataset.colorblind = '';
	else delete root.dataset.colorblind;
	try {
		if (settings.difficulty !== '') localStorage.setItem('difficulty', settings.difficulty);
		if (settings.theme !== '') localStorage.setItem('theme', settings.theme);
		else localStorage.removeItem('theme');
		if (settings.colorblind) localStorage.setItem('colorblind', 'on');
		else localStorage.removeItem('colorblind');
		localStorage.setItem('settings-updated', String(settings.updated));
	} catch {}
}

export function settingsChanged() {
	try {
		localStorage.setItem('settings-updated', String(Date.now()));
	} catch {}
	if (account.username !== '') post('settings', localSettings());
}

export async function syncAccount() {
	let res: Response;
	try {
		res = await fetch('/api/auth/sync');
	} catch {
		return;
	}
	if (res.status === 401) {
		signOut();
		return;
	}
	if (!res.ok) return;
	const data = (await res.json()) as SyncData;
	signIn(data.username);

	const local = readHistory();
	const onServer = new Set<string>();
	for (const e of data.history) onServer.add(historyKey(e));
	const missing: HistoryEntry[] = [];
	for (const e of local) {
		if (!onServer.has(historyKey(e))) missing.push(e);
	}
	for (let i = 0; i < missing.length; i += UPLOAD_SIZE) {
		const reply = await post('history', { entries: missing.slice(i, i + UPLOAD_SIZE) });
		if (reply.error !== '') break;
	}
	try {
		localStorage.setItem('history', JSON.stringify(mergeHistory(data.history, local)));
	} catch {}

	const mine = localSettings();
	if (data.settings !== null && data.settings.updated > mine.updated) {
		applySettings(data.settings);
	} else if (mine.updated > 0) {
		await post('settings', mine);
	}
	account.synced++;
}

export async function post(path: string, body: object): Promise<Reply> {
	let res: Response;
	try {
		res = await fetch('/api/auth/' + path, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
	} catch {
		return { data: null, error: 'Could not reach the server. Try again' };
	}
	let data: unknown = null;
	try {
		data = await res.json();
	} catch {}
	if (res.ok) return { data, error: '' };
	let error = 'Something went wrong. Try again';
	const message = (data as { message?: unknown } | null)?.message;
	if (typeof message === 'string' && message !== '') error = message;
	return { data: null, error };
}
