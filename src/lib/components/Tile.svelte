<script lang="ts">
	import type { Color } from '#lib/types.js';

	type Props = {
		letter: string;
		color: Color | '';
		index?: number;
		reveal?: boolean;
		win?: boolean;
	};
	let { letter, color, index = 0, reveal = false, win = false }: Props = $props();
</script>

<div
	class="tile {color}"
	class:filled={letter !== '' && color === ''}
	class:reveal
	class:win
	style="--i: {index}"
>
	{letter}
</div>

<style>
	.tile {
		--tile-bg: transparent;
		--tile-border: var(--border);
		--tile-text: var(--text);
		position: relative;
		box-sizing: border-box;
		flex: 0 0 var(--size);
		height: var(--size);
		border: 2px solid var(--tile-border);
		background: var(--tile-bg);
		color: var(--tile-text);
		display: grid;
		place-items: center;
		font-weight: bold;
		font-size: calc(var(--size) * 0.55);
	}
	.filled {
		--tile-border: var(--filled);
		animation: pop 100ms ease-out;
	}
	.correct {
		--tile-bg: var(--green);
		--tile-border: var(--green);
		--tile-text: white;
	}
	.present {
		--tile-bg: var(--yellow);
		--tile-border: var(--yellow);
		--tile-text: var(--on-yellow);
	}
	.elsewhere {
		--tile-bg: var(--purple);
		--tile-border: var(--purple);
		--tile-text: var(--on-purple);
	}
	.absent {
		--tile-text: var(--muted);
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
	.reveal {
		animation: flip var(--flip) ease-in-out calc(var(--i) * var(--step)) backwards;
	}
	.reveal::after {
		animation: hide var(--flip) calc(var(--i) * var(--step)) backwards;
	}
	.reveal.win {
		animation:
			flip var(--flip) ease-in-out calc(var(--i) * var(--step)) backwards,
			bounce var(--bounce) ease-out calc(var(--reveal) + var(--i) * var(--step));
	}
	@keyframes pop {
		50% {
			transform: scale(1.1);
		}
	}
	@keyframes flip {
		0% {
			transform: rotateX(0);
		}
		50% {
			transform: rotateX(-90deg);
		}
		100% {
			transform: rotateX(0);
		}
		0%,
		49.9% {
			background: transparent;
			border-color: var(--filled);
			color: var(--text);
		}
		50%,
		100% {
			background: var(--tile-bg);
			border-color: var(--tile-border);
			color: var(--tile-text);
		}
	}
	@keyframes hide {
		0%,
		49.9% {
			opacity: 0;
		}
		50%,
		100% {
			opacity: 1;
		}
	}
	@keyframes bounce {
		40% {
			transform: translateY(-30%);
		}
		70% {
			transform: translateY(5%);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.tile,
		.tile::after {
			animation: none !important;
		}
	}
</style>
