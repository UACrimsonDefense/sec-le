import { env } from 'cloudflare:workers';

const encoder = new TextEncoder();

export function randomBytes(length: number): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(length));
}

export function base64(bytes: Uint8Array): string {
	let text = '';
	for (let i = 0; i < bytes.length; i++) {
		text += String.fromCharCode(bytes[i]);
	}
	return btoa(text).replaceAll('=', '');
}

export function base64url(bytes: Uint8Array): string {
	return base64(bytes).replaceAll('+', '-').replaceAll('/', '_');
}

export function fromBase64(text: string): Uint8Array {
	const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

export async function sha256(text: string): Promise<Uint8Array> {
	return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
}

export async function sha1Hex(text: string): Promise<string> {
	const bytes = new Uint8Array(await crypto.subtle.digest('SHA-1', encoder.encode(text)));
	let hex = '';
	for (let i = 0; i < bytes.length; i++) {
		hex += bytes[i].toString(16).padStart(2, '0');
	}
	return hex.toUpperCase();
}

export async function hmac(text: string): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(env.PEPPER),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(text)));
}

export function equal(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) return false;
	let difference = 0;
	for (let i = 0; i < a.length; i++) {
		difference |= a[i] ^ b[i];
	}
	return difference === 0;
}
