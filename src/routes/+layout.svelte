<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	let theme = $state('light');

	onMount(() => {
		const saved = document.documentElement.dataset.theme;
		if (saved) theme = saved;
	});

	function changeTheme(e: Event) {
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('theme', theme);
		} catch {}
		(e.currentTarget as HTMLSelectElement).blur();
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@700&family=Kumbh+Sans:wght@400;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<select class="theme" aria-label="Theme" bind:value={theme} onchange={changeTheme}>
	<option value="light">Light</option>
	<option value="dark">Dark</option>
	<option value="crimson">Crimson Defense</option>
</select>

{@render children()}

<style>
	:global(:root) {
		--bg: #ffffff;
		--text: #1a1a1b;
		--green: #6aaa64;
		--yellow: #c9b458;
		--gray: #787c7e;
		--border: #d3d6da;
		--filled: #878a8c;
		--key: #d3d6da;
		--font: system-ui, sans-serif;
		--heading-font: system-ui, sans-serif;
	}
	:global(:root[data-theme='dark']) {
		--bg: #121213;
		--text: #f8f8f8;
		--green: #538d4e;
		--yellow: #b59f3b;
		--gray: #3a3a3c;
		--border: #3a3a3c;
		--filled: #565758;
		--key: #818384;
	}
	:global(:root[data-theme='crimson']) {
		--bg: #1a1a1a;
		--text: #f2f2f2;
		--green: #a3202f;
		--yellow: #c9a227;
		--gray: #3a3a3a;
		--border: rgba(242, 242, 242, 0.15);
		--filled: rgba(242, 242, 242, 0.55);
		--key: rgba(242, 242, 242, 0.15);
		--font: 'Kumbh Sans', sans-serif;
		--heading-font: 'Roboto Slab', serif;
	}
	:global(body) {
		margin: 0;
		font-family: var(--font);
		background: var(--bg);
		color: var(--text);
	}
	:global(h1) {
		font-family: var(--heading-font);
	}
	.theme {
		position: absolute;
		top: 12px;
		right: 16px;
		font: inherit;
		background: var(--bg);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 4px;
	}
</style>
