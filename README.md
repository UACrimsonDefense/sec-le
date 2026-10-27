# Sec+le

Wordle for CompTIA Security+ (SY0-701) terms. Guess the term on the tiles, get hints based on your difficulty, and find out which exam domains you need to study.

## Developing

Needs [Nix](https://nixos.org) with flakes, which provides Node 24 and pnpm. With [nix-direnv](https://github.com/nix-community/nix-direnv), run `direnv allow` once and the shell loads automatically. Otherwise, run `nix develop` first.

Install dependencies and start a development server:

```sh
pnpm install
pnpm dev      # http://localhost:5173
```

Before committing:

```sh
pnpm format   # fix formatting
pnpm check    # type check
```

## Building

To create a production build:

```sh
pnpm build
```

You can preview the production build with `pnpm preview`.

The build needs a `DAILY_SEED`, which decides the daily puzzle order. The real one is secret, so for a local build put any value in `.env.seed`:

```sh
echo 'DAILY_SEED=local' > .env.seed
```

`pnpm dev` works without it.

## Accounts

Accounts are optional. The Worker keeps users and sessions in a D1 database (`secle-auth`) and sends password hashing to a separate Argon2id service run by Crimson Defense. That service never sees a real password and is only reachable from the Worker. What's stored is explained on the [privacy page](https://secle.crimsondefense.org/privacy).

To work on accounts locally, create the local database and a `.dev.vars` file (ignored by git) with any values:

```sh
pnpm migrate
printf 'HASHER_KEY=dev\nPEPPER=dev\n' > .dev.vars
```

`pnpm dev` runs entirely on your machine. The hashing service isn't reachable from there, so register and login return `503`. Everything else works.

Usernames are checked against [`blocked.txt`](src/lib/server/auth/blocked.txt) (whole parts of the name) and [`blocked-anywhere.txt`](src/lib/server/auth/blocked-anywhere.txt) (anywhere in the name). If a bad name gets through, rename it. The player stays signed in and sees the new name:

```sh
pnpm exec wrangler d1 execute secle-auth --remote --command "UPDATE users SET username = 'player-' || id WHERE username = 'badname'"
```

To remove the account instead, use `DELETE FROM users WHERE username = 'badname'`.

## Player stats

The API counts each puzzle started, won, lost or skipped in Workers Analytics Engine. It records only the event, daily or unlimited, mode, date, difficulty and guess count, never anything about the player. Data is kept for three months.

To see players per day, create a Cloudflare API token with only the **Account Analytics: Read** permission. Put it in a file named `.env.stats` (ignored by git) as one line, `CLOUDFLARE_STATS_TOKEN=` followed by the token. Then:

```sh
pnpm stats      # last 14 days
pnpm stats 30   # last 30 days
```

## Terms

All terms live in [`data/terms.csv`](data/terms.csv). To fix or suggest one, open an issue or use "Report this definition" at the end of a game. Pull requests are welcome too:

- Never delete a row or reuse an ID. Set `retired` to a date instead.
- New terms need an `added` date after today.
- Definitions must be your own words, at most two short sentences, and must not contain a word from the answer.
- `pnpm data` checks all of this.

## Credits and disclaimers

- Code is [MIT](LICENSE). The dictionary in `src/lib/server/words.txt` is from [SCOWL / ESDB](https://wordlist.aspell.net) by Kevin Atkinson, under its own license in [`scowl-license.txt`](src/lib/server/scowl-license.txt). The username blocklist is adapted (trimmed and extended) from the [List of Dirty, Naughty, Obscene, and Otherwise Bad Words](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Term selection follows the CompTIA SY0-701 exam objectives (term names and objective numbers only, no CompTIA text is reproduced). Definitions and category names are original, written with the [NIST CSRC Glossary](https://csrc.nist.gov/glossary) as a reference (linked per term in `data/terms.csv`).
- Crimson Defense is a registered student organization at the University of Alabama. Views and content are our own.
- Not affiliated with or endorsed by CompTIA. CompTIA and Security+ are registered trademarks of CompTIA, Inc.
- Not affiliated with The New York Times. Wordle is a trademark of The New York Times Company.
