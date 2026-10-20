export type Shape = (number | ' ')[];
export type Color = 'correct' | 'present' | 'absent';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Hints = { category: string; definition: string };

export type NewGame = { termId: number; shape: Shape; maxGuesses: number; hints: Hints };
export type GuessBody = {
	termId: number;
	guess: string;
	guessNumber: number;
	difficulty: Difficulty;
};
export type GuessResult = {
	colors: Color[];
	solved: boolean;
	answer: string | null;
	objective: string | null;
	hints: Hints;
};
export type SkipBody = { termId: number };
export type SkipResult = { answer: string; objective: string; hints: Hints };
export type Guess = { text: string; colors: Color[] };
export type Result = 'won' | 'lost' | 'skipped';
export type HistoryEntry = {
	termId: number;
	objective: string;
	difficulty: Difficulty;
	result: Result;
	guesses: number;
	date: string;
};
