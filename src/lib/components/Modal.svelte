<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = { title: string; onclose?: () => void; children: Snippet };
	let { title, onclose, children }: Props = $props();
</script>

<div class="backdrop">
	<div class="modal" role="dialog" aria-modal="true" aria-label={title}>
		{#if onclose}
			<button class="close" aria-label="Close" onclick={onclose}>✕</button>
		{/if}
		<h2>{title}</h2>
		{@render children()}
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		background: rgba(0, 0, 0, 0.5);
	}
	.modal {
		position: relative;
		width: 100%;
		max-width: 400px;
		padding: 24px;
		border-radius: 8px;
		background: var(--bg);
		color: var(--text);
		text-align: center;
	}
	h2 {
		margin-top: 0;
		font-family: var(--heading-font);
	}
	.close {
		position: absolute;
		top: 8px;
		right: 8px;
		border: none;
		background: none;
		color: var(--text);
		font-size: 1.2rem;
		cursor: pointer;
	}
</style>
