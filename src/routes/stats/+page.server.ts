import schedule from '#lib/server/schedule.json';
import { terms } from '#lib/server/terms.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const categories: Record<string, string> = {};
	for (const t of terms) categories[t.objective] = t.category;
	return { launch: schedule.launch, categories };
};
