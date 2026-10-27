<svelte:head>
	<title>Privacy · Sec+le</title>
</svelte:head>

<main>
	<h1>Privacy</h1>
	<p>
		Sec+le is run by Crimson Defense. This page lists what the site stores about you, where it goes
		and how long it's kept. We never sell it, there are no ads, and we only share it with the
		services listed at the bottom.
	</p>

	<h2>Stored in your browser</h2>
	<p>
		The game saves this in your browser's local storage, and clearing this site's data in your
		browser removes it. Without an account it never leaves your device. With one, your history and
		settings are also saved to your account (see below).
	</p>
	<ul>
		<li>
			Your game history: one entry per finished game with the date, mode, puzzle, category,
			difficulty, result and number of guesses.
		</li>
		<li>Your daily puzzle boards and your current unlimited game.</li>
		<li>Your settings: difficulty, theme and colorblind mode, and when you last changed them.</li>
		<li>Your username while you're signed in, to show it in the header.</li>
	</ul>

	<h2>Cookies</h2>
	<ul>
		<li>
			<code>__Host-session</code>: set only while you're signed in. It holds a random sign-in token
			and expires after 30 days unless you keep using your account.
		</li>
		<li>
			<code>__cf_bm</code>: may be set by Cloudflare, our host, to block bots. It expires after 30
			minutes of inactivity. If Cloudflare shows you a bot check, it can set
			<a
				href="https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/"
				>other security cookies</a
			>.
		</li>
	</ul>
	<p>None of these are used for tracking or ads.</p>

	<h2>When you play</h2>
	<p>
		Each guess is sent to our server to be scored. Guesses aren't saved. To see how many people
		play, we also count each game started, won, lost or skipped: whether it was daily or unlimited,
		the mode, date, difficulty and number of guesses, with nothing that identifies you. These
		site-wide counts are kept for three months. They aren't your history, which you keep for as long
		as you want.
	</p>
	<p>
		Cloudflare handles every request to the site and sees your IP address to deliver it and block
		abuse. Our server logs can include your IP address and are deleted after 3 days.
	</p>
	<p>
		The site's fonts load from Google Fonts, so your browser also connects to Google, which sees
		your IP address.
	</p>

	<h2>With an account</h2>
	<p>Accounts are optional. If you make one, our database stores:</p>
	<ul>
		<li>Your username and when the account was made.</li>
		<li>A hash of your password. We never store or log your password itself.</li>
		<li>A hash of your recovery code.</li>
		<li>
			Your sign-ins: a hash of each sign-in token, with when it started and when it expires. Expired
			sign-ins are removed the next time you sign in.
		</li>
		<li>
			How many wrong passwords were entered in a row and how long the account is locked, so we can
			slow down anyone guessing your password.
		</li>
		<li>
			Your game history, with the same details as in your browser. Each game is saved when it ends.
			When you sign in, games already in that browser are added too, including ones played before
			you had an account. It's kept until you delete your account.
		</li>
		<li>Your settings: difficulty, theme and colorblind mode, and when you last changed them.</li>
	</ul>
	<p>
		Your IP address is used to limit how fast anyone can sign in, register, recover an account or
		confirm a password. It isn't saved with your account. Wrong-password attempts and account
		deletions are logged with your account number, and those logs are deleted after 3 days.
	</p>
	<p>
		When you pick a password, we check it against
		<a href="https://haveibeenpwned.com/Passwords">Have I Been Pwned</a> by sending only the first 5 characters
		of its SHA-1 hash, which can't be turned back into your password.
	</p>

	<h2>Deleting your account</h2>
	<p>
		Go to <a href="/account">Account</a> and choose <b>Delete account</b>. Your account, sign-ins,
		game history and settings are removed from our database right away, and we never restore deleted
		accounts. Our database host keeps a 7-day history of the database for recovering from failures,
		and our logs are deleted after 3 days. After that, we have no way to get your data back.
		Cloudflare doesn't publish how long its own backups are kept; see
		<a href="https://www.cloudflare.com/privacypolicy/">Cloudflare's privacy policy</a>. Your
		browser data stays until you clear it.
	</p>

	<h2>Who handles your data</h2>
	<ul>
		<li>Cloudflare: hosting, bot protection, the database, logs and game counts.</li>
		<li>Have I Been Pwned: the 5-character password check.</li>
		<li>Google Fonts: the site's fonts.</li>
	</ul>

	<h2>Questions</h2>
	<p>
		Email <a href="mailto:crimsoncyberdefense@gmail.com">crimsoncyberdefense@gmail.com</a>.
	</p>
</main>

<style>
	main {
		box-sizing: border-box;
		width: 100%;
		max-width: 600px;
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
	a {
		color: var(--text);
	}
</style>
