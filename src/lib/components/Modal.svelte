<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	type Props = { title: string; onclose?: () => void; children: Snippet };
	let { title, onclose, children }: Props = $props();

	const id = $props.id();
	let dialog: HTMLDialogElement;

	onMount(() => {
		const previous = document.activeElement;
		dialog.showModal();
		return () => {
			if (previous instanceof HTMLElement) previous.focus();
		};
	});

	function oncancel(e: Event) {
		e.preventDefault();
		if (onclose) onclose();
	}
</script>

<dialog bind:this={dialog} aria-labelledby={id} {oncancel}>
	<h2 {id}>{title}</h2>
	{@render children()}
	{#if onclose}
		<button class="close" aria-label="Close" onclick={onclose}>✕</button>
	{/if}
</dialog>

<style>
	dialog {
		box-sizing: border-box;
		width: calc(100% - 32px);
		max-width: 400px;
		padding: 24px;
		border: none;
		border-radius: 8px;
		background: var(--bg);
		color: var(--text);
		text-align: center;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.5);
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
