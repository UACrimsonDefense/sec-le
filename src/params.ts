import { defineParams } from '@sveltejs/kit/params';
import type { Mode } from '#lib/types.js';

function mode(param: string): Mode | undefined {
	if (param === 'term' || param === 'acronym') return param;
}

export const params = defineParams({ mode });
