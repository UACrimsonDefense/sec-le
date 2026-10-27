<script lang="ts">
	type Props = { code: string; username: string; ondone: () => void };
	let { code, username, ondone }: Props = $props();

	let saved = $state(false);
	let copied = $state(false);
	let message = $state('');

	async function copy() {
		try {
			await navigator.clipboard.writeText(code);
			copied = true;
		} catch {
			message = 'Could not copy. Write it down instead';
		}
	}

	function download() {
		let text = 'Sec+le recovery code\n\n';
		text += `Username: ${username}\nCode: ${code}\n\n`;
		text += 'Use it once to reset your password at https://secle.crimsondefense.org\n';
		const link = document.createElement('a');
		link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
		link.download = 'secle-recovery-code.txt';
		link.click();
	}
</script>

<div class="content">
	<p>
		This code is the only way back in if you forget your password. You won't see it again, so save
		it somewhere safe.
	</p>
	<p class="code">{code}</p>
	<div class="buttons">
		<button class="secondary" onclick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
		<button class="secondary" onclick={download}>Download .txt</button>
	</div>
	<p class="message" role="status">{message}</p>
	<label>
		<input type="checkbox" bind:checked={saved} />
		I saved my code
	</label>
	<button class="primary" disabled={!saved} onclick={ondone}>Done</button>
</div>

<style>
	.content {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	p {
		margin: 0;
	}
	.code {
		font-family: ui-monospace, monospace;
		font-size: 1.3rem;
		font-weight: bold;
		letter-spacing: 0.05em;
		overflow-wrap: anywhere;
	}
	.buttons {
		display: flex;
		justify-content: center;
		gap: 8px;
	}
	.message {
		min-height: 1.2em;
		font-weight: bold;
	}
	label {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
	}
	input {
		width: 1.2rem;
		height: 1.2rem;
		margin: 0;
		accent-color: var(--green);
	}
	button {
		font: inherit;
		font-weight: bold;
		padding: 8px 20px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}
	.secondary {
		background: var(--key);
		color: var(--text);
	}
	.primary {
		background: var(--green);
		color: white;
	}
	.primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
