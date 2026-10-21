<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const description =
		'A Wordle-style game for Security+ (SY0-701) terms. Guess the term, unlock hints and find your weak exam domains.';

	let theme = $state('light');

	onMount(() => {
		const saved = document.documentElement.dataset.theme;
		if (saved) theme = saved;
	});

	function changeTheme() {
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('theme', theme);
		} catch {}
	}
</script>

<svelte:head>
	<meta name="description" content={description} />
	<meta property="og:title" content="Sec+le" />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://secle.crimsondefense.org" />
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@700&family=Kumbh+Sans:wght@400;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<header>
	<select aria-label="Theme" bind:value={theme} onchange={changeTheme}>
		<option value="light">Light</option>
		<option value="dark">Dark</option>
		<option value="crimson">Crimson Defense</option>
	</select>
</header>

{@render children()}

<footer>
	<p>
		Made with ❤️ by <a href="https://github.com/SamuelBozeman">Samuel Bozeman</a> for
		<a href="https://crimsondefense.org">Crimson Defense</a> and every future Sec+ holder
	</p>
	<a class="repo" href="https://github.com/UACrimsonDefense/sec-le" aria-label="Source on GitHub">
		<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
			<path
				fill="currentColor"
				d="M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656"
			/>
		</svg>
	</a>
</footer>

<style>
	:global(:root) {
		--bg: #ffffff;
		--text: #1a1a1b;
		--green: #2f7d32;
		--yellow: #c9b458;
		--on-yellow: #1a1a1b;
		--gray: #6b6e70;
		--border: #8e9194;
		--filled: #565758;
		--muted: #5f6368;
		--key: #d3d6da;
		--github: #000000;
		--font: system-ui, sans-serif;
		--heading-font: system-ui, sans-serif;
	}
	:global(:root[data-theme='dark']) {
		--bg: #121213;
		--text: #f8f8f8;
		--green: #3e7a3a;
		--yellow: #b59f3b;
		--on-yellow: #121213;
		--gray: #3a3a3c;
		--border: #656669;
		--filled: #8a8b8d;
		--muted: #a1a2a4;
		--key: #56585a;
		--github: #ffffff;
	}
	:global(:root[data-theme='crimson']) {
		--bg: #1a1a1a;
		--text: #f2f2f2;
		--green: #a3202f;
		--yellow: #c9a227;
		--on-yellow: #1a1a1a;
		--gray: #3a3a3a;
		--border: #6a6a6a;
		--filled: #9a9a9a;
		--muted: #a6a6a6;
		--key: #3d3d3d;
		--github: #ffffff;
		--font: 'Kumbh Sans', sans-serif;
		--heading-font: 'Roboto Slab', serif;
	}
	:global(body) {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
		margin: 0;
		font-family: var(--font);
		background: var(--bg);
		color: var(--text);
	}
	:global(h1) {
		font-family: var(--heading-font);
	}
	:global(.sr-only) {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	footer {
		position: relative;
		margin-top: auto;
		padding: 16px 48px;
		text-align: center;
		font-size: 0.8rem;
		color: var(--muted);
	}
	footer p {
		margin: 0;
	}
	footer a {
		color: inherit;
	}
	.repo {
		color: var(--github);
		position: absolute;
		right: 16px;
		bottom: 14px;
		display: flex;
	}
	header {
		display: flex;
		justify-content: flex-end;
		padding: 12px 16px 0;
	}
	select {
		font: inherit;
		background: var(--bg);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 4px;
	}
</style>
