<script lang="ts">
	import { goto } from '$app/navigation';
	import RecoveryCode from '#lib/components/RecoveryCode.svelte';
	import { account, signOut, post } from '#lib/account.svelte.js';
	import type { RecoveryCode as Code } from '#lib/types.js';

	const id = $props.id();

	let current = $state('');
	let password = $state('');
	let passwordError = $state('');
	let passwordNotice = $state('');
	let codePassword = $state('');
	let codeError = $state('');
	let newCode = $state('');
	let sessionsError = $state('');
	let deletePassword = $state('');
	let sure = $state(false);
	let deleteError = $state('');
	let busy = $state(false);

	async function changePassword(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		passwordNotice = '';
		const reply = await post('password', { current, password });
		passwordError = reply.error;
		if (reply.error === '') {
			current = '';
			password = '';
			passwordNotice = 'Password changed. Your other devices were signed out.';
		}
		busy = false;
	}

	async function replaceCode(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		const reply = await post('recovery-code', { password: codePassword });
		codeError = reply.error;
		if (reply.error === '') {
			codePassword = '';
			newCode = (reply.data as Code).code;
		}
		busy = false;
	}

	async function logOut(path: string) {
		busy = true;
		const reply = await post(path, {});
		busy = false;
		if (reply.error !== '') {
			sessionsError = reply.error;
			return;
		}
		signOut();
		goto('/daily/term');
	}

	async function deleteAccount(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		const reply = await post('delete', { password: deletePassword });
		busy = false;
		if (reply.error !== '') {
			deleteError = reply.error;
			return;
		}
		signOut();
		goto('/daily/term');
	}
</script>

<svelte:head>
	<title>Account · Sec+le</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main>
	<h1>Account</h1>

	{#if account.username === ''}
		<p>You're not signed in. Use <b>Sign in</b> at the top of the page.</p>
	{:else}
		<p>Signed in as <b>{account.username}</b></p>

		<section aria-labelledby="{id}-password">
			<h2 id="{id}-password">Change password</h2>
			<form onsubmit={changePassword}>
				<input type="text" autocomplete="username" value={account.username} hidden readonly />
				<label>
					Current password
					<input
						type="password"
						bind:value={current}
						autocomplete="current-password"
						required
						maxlength="64"
					/>
				</label>
				<label>
					New password
					<input
						type="password"
						bind:value={password}
						autocomplete="new-password"
						required
						minlength="12"
						maxlength="64"
						aria-describedby="{id}-hint"
					/>
				</label>
				<p class="hint" id="{id}-hint">At least 12 characters. A few random words works well.</p>
				<p class="error" role="alert">{passwordError}</p>
				<p class="notice" role="status">{passwordNotice}</p>
				<button class="primary" disabled={busy}>Change password</button>
			</form>
		</section>

		<section aria-labelledby="{id}-code">
			<h2 id="{id}-code">Recovery code</h2>
			{#if newCode !== ''}
				<RecoveryCode code={newCode} username={account.username} ondone={() => (newCode = '')} />
			{:else}
				<p>Lost your code? Get a new one. The old one stops working.</p>
				<form onsubmit={replaceCode}>
					<label>
						Password
						<input
							type="password"
							bind:value={codePassword}
							autocomplete="current-password"
							required
							maxlength="64"
						/>
					</label>
					<p class="error" role="alert">{codeError}</p>
					<button class="primary" disabled={busy}>Get a new code</button>
				</form>
			{/if}
		</section>

		<section aria-labelledby="{id}-sessions">
			<h2 id="{id}-sessions">Sign out</h2>
			<div class="buttons">
				<button class="secondary" disabled={busy} onclick={() => logOut('logout')}>Sign out</button>
				<button class="secondary" disabled={busy} onclick={() => logOut('logout-all')}
					>Sign out everywhere</button
				>
			</div>
			<p class="error" role="alert">{sessionsError}</p>
		</section>

		<section aria-labelledby="{id}-delete">
			<h2 id="{id}-delete">Delete account</h2>
			<p>This removes your account right away. Your game history on this device stays.</p>
			<form onsubmit={deleteAccount}>
				<label>
					Password
					<input
						type="password"
						bind:value={deletePassword}
						autocomplete="current-password"
						required
						maxlength="64"
					/>
				</label>
				<label class="check">
					<input type="checkbox" bind:checked={sure} />
					I understand this can't be undone
				</label>
				<p class="error" role="alert">{deleteError}</p>
				<button class="secondary" disabled={busy || !sure}>Delete my account</button>
			</form>
		</section>
	{/if}

	<p><a href="/privacy">Privacy</a></p>
</main>

<style>
	main {
		box-sizing: border-box;
		width: 100%;
		max-width: 480px;
		margin: 0 auto;
		padding: 0 16px 16px;
	}
	h1 {
		text-align: center;
	}
	h2 {
		font-size: 1.1rem;
		margin: 24px 0 8px;
	}
	section {
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border);
	}
	a {
		color: var(--text);
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-weight: bold;
	}
	input {
		font: inherit;
		font-weight: normal;
		background: var(--bg);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 6px;
	}
	.check {
		flex-direction: row;
		align-items: center;
		gap: 8px;
		font-weight: normal;
	}
	.check input {
		width: 1.2rem;
		height: 1.2rem;
		margin: 0;
		accent-color: var(--green);
	}
	.hint {
		margin: 0;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.error,
	.notice {
		margin: 0;
		font-weight: bold;
	}
	.error:empty,
	.notice:empty {
		display: none;
	}
	.buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	button {
		font: inherit;
		font-weight: bold;
		padding: 8px 20px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}
	.primary {
		background: var(--green);
		color: white;
	}
	.secondary {
		background: var(--key);
		color: var(--text);
	}
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
