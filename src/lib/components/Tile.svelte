<script lang="ts">
	import type { Color } from '#lib/types.js';

	type Props = { letter: string; color: Color | '' };
	let { letter, color }: Props = $props();
</script>

<div class="tile {color}" class:filled={letter !== '' && color === ''}>
	{letter}
</div>

<style>
	.tile {
		position: relative;
		box-sizing: border-box;
		flex: 0 0 var(--size);
		height: var(--size);
		border: 2px solid var(--border);
		display: grid;
		place-items: center;
		font-weight: bold;
		font-size: calc(var(--size) * 0.55);
	}
	.filled {
		border-color: var(--filled);
	}
	.correct {
		background: var(--green);
		border-color: var(--green);
		color: white;
	}
	.present {
		background: var(--yellow);
		border-color: var(--yellow);
		color: var(--on-yellow);
	}
	.elsewhere {
		background: var(--purple);
		border-color: var(--purple);
		color: var(--on-purple);
	}
	.present::after,
	.elsewhere::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: calc(var(--size) * 0.1);
		width: calc(var(--size) * 0.4);
		height: max(2px, calc(var(--size) * 0.07));
		border-radius: 1px;
		background: currentColor;
		transform: translateX(-50%);
	}
	.elsewhere::after {
		top: calc(var(--size) * 0.1);
		bottom: auto;
	}
	.absent {
		color: var(--muted);
	}
</style>
