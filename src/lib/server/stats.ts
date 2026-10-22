import { env } from 'cloudflare:workers';

export type Event = 'start' | 'win' | 'loss' | 'skip';
export type Kind = 'daily' | 'unlimited';

export function track(
	event: Event,
	kind: Kind,
	mode: string,
	day: string,
	difficulty: string,
	guesses: number
) {
	if (day === '') day = new Date().toISOString().slice(0, 10);
	try {
		env.STATS?.writeDataPoint({
			blobs: [event, kind, mode, day, difficulty],
			doubles: [guesses],
			indexes: [kind]
		});
	} catch {}
}
