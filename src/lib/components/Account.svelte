<script lang="ts">
	import { onMount } from 'svelte';
	import Modal from '#lib/components/Modal.svelte';
	import RecoveryCode from '#lib/components/RecoveryCode.svelte';
	import { account, checkAccount, signIn, post } from '#lib/account.svelte.js';
	import type { Account, NewAccount, RecoveryCode as Code } from '#lib/types.js';

	type View = 'login' | 'register' | 'recover' | 'code';

	const id = $props.id();

	let open = $state(false);
	let view = $state<View>('login');
	let username = $state('');
	let password = $state('');
	let code = $state('');
	let newCode = $state('');
	let error = $state('');
	let notice = $state('');
	let busy = $state(false);

	function title(view: View): string {
		if (view === 'register') return 'Create account';
		if (view === 'recover') return 'Reset password';
		if (view === 'code') return 'Save your recovery code';
		return 'Sign in';
	}

	function buttonText(view: View): string {
		if (view === 'register') return 'Create account';
		if (view === 'recover') return 'Reset password';
		return 'Sign in';
	}

	function show(next: View) {
		view = next;
		password = '';
		code = '';
		error = '';
		if (next !== 'login') notice = '';
		open = true;
	}

	function close() {
		open = false;
		password = '';
		code = '';
		notice = '';
	}

	async function login() {
		const reply = await post('login', { username, password });
		if (reply.error !== '') {
			error = reply.error;
			return;
		}
		signIn((reply.data as Account).username);
		close();
	}

	async function register() {
		const reply = await post('register', { username, password });
		if (reply.error !== '') {
			error = reply.error;
			return;
		}
		const data = reply.data as NewAccount;
		signIn(data.username);
		newCode = data.code;
		view = 'code';
	}

	async function recover() {
		const reply = await post('recover', { username, code, password });
		if (reply.error !== '') {
			error = reply.error;
			return;
		}
		newCode = (reply.data as Code).code;
		view = 'code';
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		error = '';
		if (view === 'login') await login();
		else if (view === 'register') await register();
		else if (view === 'recover') await recover();
		busy = false;
	}

	function codeDone() {
		newCode = '';
		if (account.username !== '') {
			close();
			return;
		}
		show('login');
		notice = 'Password reset. Sign in with your new password.';
	}

	onMount(() => {
		checkAccount();
	});
</script>

{#if account.username !== ''}
	<a href="/account">Account</a>
{:else}
	<button class="open" onclick={() => show('login')}>Sign in</button>
{/if}

{#if open}
	<Modal title={title(view)} onclose={view === 'code' ? undefined : close}>
		{#if view === 'code'}
			<RecoveryCode code={newCode} {username} ondone={codeDone} />
		{:else}
			{#if notice}
				<p class="notice" role="status">{notice}</p>
			{/if}
			<form onsubmit={submit}>
				<label>
					Username
					<input
						bind:value={username}
						autocomplete="username"
						autocapitalize="none"
						spellcheck="false"
						required
						minlength="3"
						maxlength="20"
						pattern="[A-Za-z0-9_\-]+"
						aria-describedby={view === 'register' ? `${id}-user` : undefined}
					/>
				</label>
				{#if view === 'register'}
					<p class="hint" id="{id}-user">3 to 20 letters, numbers, _ or -</p>
				{/if}
				{#if view === 'recover'}
					<label>
						Recovery code
						<input
							bind:value={code}
							autocomplete="off"
							autocapitalize="characters"
							spellcheck="false"
							required
							maxlength="40"
						/>
					</label>
				{/if}
				<label>
					{view === 'login' ? 'Password' : 'New password'}
					<input
						type="password"
						bind:value={password}
						autocomplete={view === 'login' ? 'current-password' : 'new-password'}
						required
						minlength={view === 'login' ? 1 : 12}
						maxlength="64"
						aria-describedby={view === 'login' ? undefined : `${id}-pass`}
					/>
				</label>
				{#if view !== 'login'}
					<p class="hint" id="{id}-pass">At least 12 characters. A few random words works well.</p>
				{/if}
				<p class="error" role="alert">{error}</p>
				<button class="primary" disabled={busy}>{buttonText(view)}</button>
			</form>
			{#if view === 'login'}
				<p class="links">
					<button class="link" onclick={() => show('register')}>Create an account</button>
					<button class="link" onclick={() => show('recover')}>Forgot password?</button>
				</p>
			{:else}
				<p class="links">
					<button class="link" onclick={() => show('login')}>Back to sign in</button>
				</p>
			{/if}
			<p class="hint">
				Accounts are optional. The game works without one. <a href="/privacy">Privacy</a>
			</p>
		{/if}
	</Modal>
{/if}

<style>
	.open,
	.link {
		padding: 0;
		border: none;
		background: none;
		color: var(--text);
		font: inherit;
		text-decoration: underline;
		cursor: pointer;
	}
	a {
		color: var(--text);
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 8px;
		text-align: left;
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
	.hint {
		margin: 0;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.notice {
		font-weight: bold;
	}
	.error {
		min-height: 1.2em;
		margin: 0;
		font-weight: bold;
	}
	.primary {
		font: inherit;
		font-weight: bold;
		padding: 8px 20px;
		border: none;
		border-radius: 4px;
		background: var(--green);
		color: white;
		cursor: pointer;
	}
	.primary:disabled {
		opacity: 0.5;
		cursor: wait;
	}
	.links {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 16px;
	}
</style>
