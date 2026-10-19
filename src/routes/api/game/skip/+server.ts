import { json, error } from '@sveltejs/kit';
import { terms } from '#lib/server/terms.js';
import type { SkipBody, SkipResult } from '#lib/types.js';

export async function POST({ request }) {
	if (Number(request.headers.get('content-length')) > 100) error(413, 'Too large');

	const body = (await request.json().catch(() => null)) as Partial<SkipBody> | null;
	const termId = body?.termId;
	if (typeof termId !== 'number') error(400, 'Bad request');

	const t = terms.find((t) => t.id === termId);
	if (!t) error(400, 'Unknown term');

	return json({ answer: t.term, definition: t.definition } satisfies SkipResult);
}
