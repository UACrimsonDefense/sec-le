import type { HistoryEntry } from '#lib/types.js';

export function historyKey(e: HistoryEntry): string {
	if (e.day > 0) return `d:${e.mode}:${e.day}`;
	if (e.game) return `u:${e.game}`;
	return `u:${e.mode}:${e.termId}:${e.date}`;
}

export function mergeHistory(server: HistoryEntry[], local: HistoryEntry[]): HistoryEntry[] {
	const merged: HistoryEntry[] = [];
	const seen = new Set<string>();
	for (const e of server) {
		merged.push(e);
		seen.add(historyKey(e));
	}
	for (const e of local) {
		const key = historyKey(e);
		if (seen.has(key)) continue;
		merged.push(e);
		seen.add(key);
	}
	merged.sort(byDate);
	return merged;
}

function byDate(a: HistoryEntry, b: HistoryEntry): number {
	if (a.date < b.date) return -1;
	if (a.date > b.date) return 1;
	return 0;
}
