# Hacker News Automation Framework

## Description

An automated UI test for [Hacker News](https://news.ycombinator.com/), written in TypeScript with [Playwright](https://playwright.dev/).

The test visits [Hacker News – Newest](https://news.ycombinator.com/newest) and validates that exactly the first 100 articles are sorted from newest to oldest.

## Prerequisites

- [Node.js](https://nodejs.org/) - the version is pinned in `.node-version`. With [fnm](https://github.com/Schniz/fnm) set up, it switches to this version automatically when you `cd` into the project.
- [pnpm](https://pnpm.io/installation) - the version is pinned in the `packageManager` field of `package.json`.

## Usage

Install the dependencies and the Chromium browser:

```sh
pnpm install
pnpm exec playwright install chromium
```

Run the test (any Playwright CLI options can be appended, e.g. `pnpm test --ui` to step through it in UI mode):

```sh
pnpm test
```

Open the HTML report of the last run:

```sh
pnpm report
```

Other scripts:

| Script           | Description                       |
| ---------------- | --------------------------------- |
| `pnpm typecheck` | Type checks the project with tsc  |
| `pnpm format`    | Formats the project with Prettier |

## How the Test Works

The test opens `/newest` and walks down the page with one `Rank n` step per article (1 to 100), clicking **More** at the bottom of each page of 30. Every step checks, on the page itself:

1. Rank `n` is shown at the expected position on the page.
2. Rank `n - 1` is the article directly above rank `n`. At a page split (31, 61 and 91), rank `n - 1` must be the bottom article before clicking **More**, rank `n` must be the top article after it, and the URL must be `/newest?next=<id of rank n>&n=<n>`, e.g. `/newest?next=50270743&n=61`.
3. Rank `n - 1` was posted later than rank `n`. The posted time is read from the `title` attribute of each article's age, e.g. `<span class="age" title="2026-10-28T09:12:55">`, which is precise to the second, unlike the displayed "5 minutes ago". If both were posted in the same second, rank `n - 1` must have the higher article ID, as IDs increase with every submission.

The time checks are soft assertions, so every out-of-order article is reported in a single run. The position checks stop the test, as later ranks can't be checked once the page structure is wrong. Each step and assertion is listed in `pnpm test --ui` and the HTML report.

## CI/CD

The [Playwright Tests](.github/workflows/playwright.yml) GitHub Actions workflow runs on every commit to `main`, and can also be run manually. It type checks the project, runs the test in Chromium and uploads the HTML report as a `playwright-report` artifact.

## Project Structure

```text
├── .github/workflows/playwright.yml   # CI pipeline
├── src
│   ├── pages
│   │   ├── article-row.ts             # An article on /newest (extends NewestPage)
│   │   └── newest-page.ts             # Page object for /newest
│   └── specs
│       └── newest.spec.ts             # Test
└── playwright.config.ts               # Playwright configuration
```
