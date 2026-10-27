<script lang="ts">
	import Modal from '#lib/components/Modal.svelte';
	import { settingsChanged } from '#lib/account.svelte.js';

	let open = $state(false);
	let theme = $state('light');
	let colorblind = $state(false);

	function show() {
		theme = document.documentElement.dataset.theme ?? 'light';
		colorblind = document.documentElement.dataset.colorblind !== undefined;
		open = true;
	}

	function changeTheme() {
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('theme', theme);
		} catch {}
		settingsChanged();
	}

	function changeColorblind() {
		if (colorblind) document.documentElement.dataset.colorblind = '';
		else delete document.documentElement.dataset.colorblind;
		try {
			if (colorblind) localStorage.setItem('colorblind', 'on');
			else localStorage.removeItem('colorblind');
		} catch {}
		settingsChanged();
	}
</script>

<button class="open" onclick={show}>Settings</button>

{#if open}
	<Modal title="Settings" onclose={() => (open = false)}>
		<div class="content">
			<label>
				Theme
				<select bind:value={theme} onchange={changeTheme}>
					<option value="light">Light</option>
					<option value="dark">Dark</option>
					<option value="crimson">Crimson Defense</option>
				</select>
			</label>
			<label>
				<input type="checkbox" bind:checked={colorblind} onchange={changeColorblind} />
				Colorblind colors (blue and yellow)
			</label>
		</div>
	</Modal>
{/if}

<style>
	.open {
		padding: 0;
		border: none;
		background: none;
		color: var(--text);
		font: inherit;
		text-decoration: underline;
		cursor: pointer;
	}
	.content {
		display: flex;
		flex-direction: column;
		gap: 16px;
		text-align: left;
	}
	label {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	select {
		font: inherit;
		background: var(--bg);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 4px;
	}
	input {
		width: 1.2rem;
		height: 1.2rem;
		margin: 0;
		accent-color: var(--green);
	}
</style>
