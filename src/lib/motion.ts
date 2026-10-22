export const FLIP_MS = 500;
export const BOUNCE_MS = 400;
export const SHAKE_MS = 400;

export function stepMs(tiles: number): number {
	return Math.min(250, Math.round(1500 / Math.max(tiles, 1)));
}

export function revealMs(tiles: number): number {
	return (tiles - 1) * stepMs(tiles) + FLIP_MS;
}

export function winMs(tiles: number): number {
	return revealMs(tiles) + (tiles - 1) * stepMs(tiles) + BOUNCE_MS;
}

export function reducedMotion(): boolean {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
