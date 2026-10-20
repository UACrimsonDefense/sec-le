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
export type GuessResult = { colors: Color[]; solved: boolean; answer: string | null; hints: Hints };
export type SkipBody = { termId: number };
export type SkipResult = { answer: string; hints: Hints };
export type Guess = { text: string; colors: Color[] };
