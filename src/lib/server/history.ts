import { env } from 'cloudflare:workers';
import { historyKey } from '#lib/history.js';
import type { HistoryEntry, SyncedSettings, Mode, Difficulty, Result } from '#lib/types.js';

export const MAX_HISTORY = 20000;

type HistoryRow = {
	term_id: number;
	day: number;
	mode: Mode;
	objective: string;
	difficulty: Difficulty;
	result: Result;
	guesses: number;
	date: string;
	game: string | null;
};
type SettingsRow = { difficulty: string; theme: string; colorblind: number; updated: number };

export async function insertHistory(userId: number, entries: HistoryEntry[], source: string) {
	const statements: D1PreparedStatement[] = [];
	for (const e of entries) {
		statements.push(
			env.GAME.prepare(
				'INSERT OR IGNORE INTO history (user_id, key, term_id, day, mode, objective, difficulty, result, guesses, date, game, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
			).bind(
				userId,
				historyKey(e),
				e.termId,
				e.day,
				e.mode,
				e.objective,
				e.difficulty,
				e.result,
				e.guesses,
				e.date,
				e.game ?? null,
				source
			)
		);
	}
	if (statements.length > 0) await env.GAME.batch(statements);
}

export async function countHistory(userId: number): Promise<number> {
	const row = await env.GAME.prepare('SELECT count(*) AS count FROM history WHERE user_id = ?')
		.bind(userId)
		.first<{ count: number }>();
	return row?.count ?? 0;
}

export async function loadHistory(userId: number): Promise<HistoryEntry[]> {
	const { results } = await env.GAME.prepare(
		'SELECT term_id, day, mode, objective, difficulty, result, guesses, date, game FROM history WHERE user_id = ? ORDER BY date'
	)
		.bind(userId)
		.all<HistoryRow>();
	const history: HistoryEntry[] = [];
	for (const row of results) {
		const entry: HistoryEntry = {
			termId: row.term_id,
			day: row.day,
			mode: row.mode,
			objective: row.objective,
			difficulty: row.difficulty,
			result: row.result,
			guesses: row.guesses,
			date: row.date
		};
		if (row.game) entry.game = row.game;
		history.push(entry);
	}
	return history;
}

export async function loadSettings(userId: number): Promise<SyncedSettings | null> {
	const row = await env.GAME.prepare(
		'SELECT difficulty, theme, colorblind, updated FROM settings WHERE user_id = ?'
	)
		.bind(userId)
		.first<SettingsRow>();
	if (!row) return null;
	return {
		difficulty: row.difficulty as Difficulty | '',
		theme: row.theme,
		colorblind: row.colorblind === 1,
		updated: row.updated
	};
}

export async function saveSettings(userId: number, s: SyncedSettings) {
	await env.GAME.prepare(
		'INSERT INTO settings (user_id, difficulty, theme, colorblind, updated) VALUES (?, ?, ?, ?, ?) ON CONFLICT (user_id) DO UPDATE SET difficulty = excluded.difficulty, theme = excluded.theme, colorblind = excluded.colorblind, updated = excluded.updated WHERE excluded.updated > settings.updated'
	)
		.bind(userId, s.difficulty, s.theme, s.colorblind ? 1 : 0, s.updated)
		.run();
}

export async function deleteGameData(userId: number) {
	await env.GAME.batch([
		env.GAME.prepare('DELETE FROM history WHERE user_id = ?').bind(userId),
		env.GAME.prepare('DELETE FROM settings WHERE user_id = ?').bind(userId)
	]);
}
