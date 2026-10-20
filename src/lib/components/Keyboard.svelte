<script lang="ts">
	import type { Color } from '#lib/types.js';

	type Props = { colors: Record<string, Color>; onkey: (key: string) => void };
	let { colors, onkey }: Props = $props();

	const rows: string[][] = [
		['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '.', '/'],
		['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
		['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
		['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
	];

	function label(key: string): string {
		if (key === 'BACK') return '⌫';
		return key;
	}
</script>

<div class="keyboard">
	{#each rows as row}
		<div class="row">
			{#each row as key}
				<button
					class="key {colors[key] ?? ''}"
					class:wide={key === 'ENTER' || key === 'BACK'}
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
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.row {
		display: flex;
		justify-content: center;
		gap: 4px;
	}
	.key {
		flex: 0 1 2.6rem;
		min-width: 0;
		height: 3.2rem;
		padding: 0;
		border: none;
		border-radius: 4px;
		background: var(--key);
		color: inherit;
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
	}
	.present {
		background: var(--yellow);
		color: white;
	}
	.absent {
		background: var(--gray);
		color: white;
	}
</style>
