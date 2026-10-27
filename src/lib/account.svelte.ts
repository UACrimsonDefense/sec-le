import type { Account } from '#lib/types.js';

export type Reply = { data: unknown; error: string };

export const account = $state({ username: '' });

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
	try {
		const res = await fetch('/api/auth/me');
		if (res.status === 401) signOut();
		else if (res.ok) signIn(((await res.json()) as Account).username);
	} catch {}
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
