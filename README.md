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

## Credits and disclaimers

- Code is [MIT](LICENSE). The dictionary in `src/lib/server/words.txt` is from [SCOWL / ESDB](https://wordlist.aspell.net) by Kevin Atkinson, under its own license in [`scowl-license.txt`](src/lib/server/scowl-license.txt).
- Not affiliated with or endorsed by CompTIA. CompTIA and Security+ are registered trademarks of CompTIA, Inc.
- Not affiliated with The New York Times. Wordle is a trademark of The New York Times Company.
