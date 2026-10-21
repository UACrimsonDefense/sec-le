export type Shape = (number | ' ')[];
export type Color = 'correct' | 'present' | 'absent';
export type Mode = 'term' | 'acronym';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Hints = { acronym: string; category: string; definition: string };

export type NewGame = {
	termId: number;
	day: number;
	shape: Shape;
	maxGuesses: number;
	hints: Hints;
};
export type GuessBody = {
	termId: number;
	date: string;
	guess: string;
	guessNumber: number;
	difficulty: Difficulty;
	mode: Mode;
};
export type GuessResult = {
	colors: Color[];
	solved: boolean;
	termId: number | null;
	answer: string | null;
	objective: string | null;
	hints: Hints;
};
export type SkipBody = { termId: number };
export type SkipResult = { answer: string; objective: string; hints: Hints };
export type Guess = { text: string; colors: Color[] };
export type Cell = { index: number; gap: boolean; more: boolean };
export type Result = 'won' | 'lost' | 'skipped';
export type HistoryEntry = {
	termId: number;
	day: number;
	mode: Mode;
	objective: string;
	difficulty: Difficulty;
	result: Result;
	guesses: number;
	date: string;
};
