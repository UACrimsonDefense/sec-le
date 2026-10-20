import { defineParams } from '@sveltejs/kit/params';

function mode(param: string): string | undefined {
	if (param === 'term') return param;
}

export const params = defineParams({ mode });
