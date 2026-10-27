import { json } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';

function isJson(request: Request): boolean {
	const type = request.headers.get('content-type') ?? '';
	return type.split(';')[0].trim().toLowerCase() === 'application/json';
}

function isSameOrigin(request: Request, origin: string): boolean {
	const site = request.headers.get('sec-fetch-site');
	if (site !== null) return site === 'same-origin';
	return request.headers.get('origin') === origin;
}

export const handle: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith('/api/auth/')) return resolve(event);

	const headers = { 'Cache-Control': 'no-store' };
	if (event.request.method === 'POST') {
		if (!isJson(event.request)) return json({ message: 'Use JSON' }, { status: 415, headers });
		if (!isSameOrigin(event.request, event.url.origin)) {
			return json({ message: 'Forbidden' }, { status: 403, headers });
		}
	}

	const response = await resolve(event);
	response.headers.set('Cache-Control', 'no-store');
	return response;
};
