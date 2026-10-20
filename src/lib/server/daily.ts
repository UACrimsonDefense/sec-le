import schedule from '#lib/server/schedule.json';
import { terms } from '#lib/server/terms.js';
import type { Term } from '#lib/server/terms.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function toTime(date: string): number {
	return Date.parse(date + 'T00:00:00Z');
}

export function dayNumber(date: string): number {
	return Math.round((toTime(date) - toTime(schedule.launch)) / DAY_MS) + 1;
}

export function isAllowedDate(date: unknown): date is string {
	if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
	if (isNaN(toTime(date))) return false;
	const yesterday = new Date(Date.now() - DAY_MS).toISOString().slice(0, 10);
	const tomorrow = new Date(Date.now() + DAY_MS).toISOString().slice(0, 10);
	return date >= schedule.launch && date >= yesterday && date <= tomorrow;
}

export function dailyTerm(date: string): Term | undefined {
	const id = schedule.term[(dayNumber(date) - 1) % schedule.term.length];
	return terms.find((t) => t.id === id);
}
