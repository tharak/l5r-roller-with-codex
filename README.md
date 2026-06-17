# L5R Roller with Codex

A TypeScript + Vite web version of the Legend of the Five Rings roll-and-keep dice roller.

## Features

- Roll `XkY` dice pools with bonus modifiers.
- Apply the L5R ten dice rule from the Swift roller package.
- Toggle keep-high or keep-low results.
- Configure exploding dice for none, 10, or 9 and 10.
- Optionally re-roll initial 1s.
- Keep a local browser history of recent rolls.

## Reference Projects

This version was built from the behavior and UI ideas in:

- <https://github.com/tharak/LegendOfTheFiveRingsRoller>
- <https://github.com/tharak/LegendOfTheFiveRingsApp>
- <https://github.com/tharak/LegendOfTheFiveRings>

## Run Locally

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

## Deploy on GitHub Pages

The repository includes a GitHub Actions workflow that builds the app and publishes `dist/` to `gh-pages` when `main` is pushed.

After enabling Pages for the repository, use the `gh-pages` branch as the source. The app will be available at:

`https://tharak.github.io/l5r-roller-with-codex/`
