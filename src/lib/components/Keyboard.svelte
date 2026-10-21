<script lang="ts">
	import type { Color } from '#lib/types.js';

	type Props = { colors: Record<string, Color>; onkey: (key: string) => void };
	let { colors, onkey }: Props = $props();

	const rows: string[][] = [
		['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
		['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
		['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '-'],
		['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '.', '/', 'BACK']
	];

	function label(key: string): string {
		if (key === 'BACK') return '⌫';
		return key;
	}

	function name(key: string): string {
		let result = key;
		if (key === 'BACK') result = 'Backspace';
		if (key === 'ENTER') result = 'Enter';
		if (key === '-') result = 'Dash';
		if (key === '.') result = 'Dot';
		if (key === '/') result = 'Slash';
		const color = colors[key];
		if (color === 'correct') result += ', correct';
		if (color === 'present') result += ', wrong spot';
		if (color === 'elsewhere') result += ', in another word';
		if (color === 'absent') result += ', not in answer';
		return result;
	}
</script>

<div class="keyboard">
	{#each rows as row}
		<div class="row">
			{#each row as key}
				<button
					class="key {colors[key] ?? ''}"
					class:wide={key === 'ENTER' || key === 'BACK'}
					aria-label={name(key)}
					onmousedown={(e) => e.preventDefault()}
					onclick={() => onkey(key)}
				>
					{label(key)}
				</button>
			{/each}
		</div>
	{/each}
</div>

<style>
	.keyboard {
		max-width: 500px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 8px 0;
		background: var(--bg);
	}
	@media (max-width: 600px) {
		.keyboard {
			position: sticky;
			bottom: 0;
		}
	}
	.row {
		display: flex;
		justify-content: center;
		gap: 4px;
	}
	.key {
		position: relative;
		flex: 0 1 2.6rem;
		min-width: 0;
		height: 3.2rem;
		padding: 0;
		border: none;
		border-radius: 4px;
		background: var(--key);
		color: inherit;
		font: inherit;
		font-weight: bold;
		cursor: pointer;
		touch-action: manipulation;
	}
	.wide {
		flex-basis: 4rem;
		font-size: 0.75rem;
	}
	.correct {
		background: var(--green);
		color: white;
		box-shadow: inset 0 0 0 3px white;
	}
	.present {
		background: var(--yellow);
		color: var(--on-yellow);
	}
	.elsewhere {
		background: var(--purple);
		color: var(--on-purple);
	}
	.present::after,
	.elsewhere::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: 8px;
		width: 1rem;
		height: 3px;
		border-radius: 1px;
		background: currentColor;
		transform: translateX(-50%);
	}
	.elsewhere::after {
		top: 8px;
		bottom: auto;
	}
	.absent {
		background: var(--gray);
		color: white;
		text-decoration: line-through;
	}
</style>
