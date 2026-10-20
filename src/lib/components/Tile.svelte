<script lang="ts">
	import type { Color } from '#lib/types.js';

	type Props = { letter: string; color: Color | '' };
	let { letter, color }: Props = $props();
</script>

<div class="tile {color}" class:filled={letter !== '' && color === ''}>
	<span>{letter}</span>
</div>

<style>
	.tile {
		flex: 0 1 3rem;
		min-width: 0;
		aspect-ratio: 1;
		border: 2px solid var(--border);
		display: grid;
		place-items: center;
		font-weight: bold;
		container-type: inline-size;
	}
	span {
		font-size: 55cqi;
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
		color: white;
	}
	.absent {
		background: var(--gray);
		border-color: var(--gray);
		color: white;
	}
</style>
