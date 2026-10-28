import schedule from '#lib/server/schedule.json';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => ({ launch: schedule.launch });
