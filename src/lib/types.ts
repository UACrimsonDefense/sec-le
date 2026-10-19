export type Shape = (number | ' ')[];
export type Color = 'correct' | 'present' | 'absent';

export type NewGame = { termId: number; shape: Shape; maxGuesses: number; definition: string };
export type GuessBody = { termId: number; guess: string; guessNumber: number };
export type GuessResult = { colors: Color[]; solved: boolean; answer: string | null };
export type SkipBody = { termId: number };
export type SkipResult = { answer: string; definition: string };
