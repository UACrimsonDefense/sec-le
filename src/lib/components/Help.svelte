<script lang="ts">
	import Modal from '#lib/components/Modal.svelte';
	import Tile from '#lib/components/Tile.svelte';

	let open = $state(false);
</script>

<button class="help" onclick={() => (open = true)}>Help</button>

{#if open}
	<Modal title="How to play" onclose={() => (open = false)}>
		<div class="content">
			<p>
				Guess the Security+ term. Every guess must be real words, chained together if needed, like
				THE + ANALYTICS. Gaps show where the spaces are, and symbols like - . / are typed.
			</p>
			<ul class="examples">
				<li>
					<span class="tile" aria-hidden="true"><Tile letter="S" color="correct" /></span>
					<span><b>Solid:</b> right letter, right spot</span>
				</li>
				<li>
					<span class="tile" aria-hidden="true"><Tile letter="E" color="present" /></span>
					<span><b>Bar:</b> in the answer, wrong spot</span>
				</li>
				<li>
					<span class="tile" aria-hidden="true"><Tile letter="C" color="absent" /></span>
					<span><b>Hollow:</b> not in the answer</span>
				</li>
			</ul>
			<p>
				<b>Easy</b> shows the definition from the start, <b>Medium</b> unlocks hints as you guess,
				<b>Hard</b> gives none.
			</p>
			<p>
				<b>Acronym</b> mode shows the acronym and you guess what it stands for. <b>Daily</b> is the
				same puzzle for everyone, new each midnight. <b>Unlimited</b> lets you practice by domain.
			</p>
		</div>
	</Modal>
{/if}

<style>
	.help {
		padding: 0;
		border: none;
		background: none;
		color: var(--text);
		font: inherit;
		text-decoration: underline;
		cursor: pointer;
	}
	.content {
		text-align: left;
	}
	.examples {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.examples li {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 8px;
	}
	.tile {
		display: flex;
		--size: 2.5rem;
	}
</style>
