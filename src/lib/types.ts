export type Shape = (number | ' ')[];
export type Color = 'correct' | 'present' | 'elsewhere' | 'absent';
export type Mode = 'term' | 'acronym';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Hints = { acronym: string; category: string; definition: string };

export type NewGame = {
	termId: number;
	day: number;
	shape: Shape;
	maxGuesses: number;
	hints: Hints;
	token: string;
};
export type GuessBody = { token: string; guess: string };
export type GuessResult = {
	colors: Color[];
	solved: boolean;
	token: string;
	termId: number | null;
	answer: string | null;
	objective: string | null;
	hints: Hints;
	entry: HistoryEntry | null;
};
export type SkipBody = { token: string };
export type SkipResult = { answer: string; objective: string; hints: Hints; entry: HistoryEntry };
export type Guess = { text: string; colors: Color[] };
export type Cell = { index: number; gap: boolean; more: boolean };
export type Result = 'won' | 'lost' | 'skipped';
export type Account = { username: string };
export type NewAccount = { username: string; code: string };
export type RecoveryCode = { code: string };
export type HistoryEntry = {
	termId: number;
	day: number;
	mode: Mode;
	objective: string;
	difficulty: Difficulty;
	result: Result;
	guesses: number;
	date: string;
	game?: string;
};
export type SyncedSettings = {
	difficulty: Difficulty | '';
	theme: string;
	colorblind: boolean;
	updated: number;
};
export type SyncData = {
	username: string;
	history: HistoryEntry[];
	settings: SyncedSettings | null;
};
