# RK9 Team Viewer

A responsive Pokémon VGC teamsheet viewer for iPad, phones and desktop. Select an RK9 tournament, search a player name, and view their public teamsheet.

This standalone version runs on your Cloudflare account. It does not require ChatGPT, OpenAI API keys, RK9 credentials, databases or paid Pokémon data services. By default its Cloudflare URL is publicly accessible; only public RK9 data is fetched.

## Deploy from GitHub to Cloudflare

1. Sign in at https://dash.cloudflare.com/ (create a Cloudflare account first if needed).
2. Open **Workers & Pages**, then **Create application**.
3. Choose **Import a repository** / **Connect to Git**, select GitHub, and authorize access to this repository.
4. Select **rk9-team-viewer**. Create a **Worker** application.
5. Use these settings:

| Setting | Value |
| --- | --- |
| Worker/project name | `rk9-team-viewer` |
| Production branch | `main` |
| Root directory | Repository root (leave blank) |
| Build command | `pnpm run build` |
| Deploy command | `pnpm run deploy` |
| Non-production branch deploy command, if shown | `pnpm exec wrangler versions upload --config dist/server/wrangler.json` |
| Build environment variable | `NODE_VERSION` = `22.16.0` |

Cloudflare installs dependencies using the committed pnpm lockfile. Keep the Worker name equal to the name in `wrangler.jsonc`.

6. Click **Save and Deploy**. Wait for the build and deployment to succeed.
7. Open the resulting `workers.dev` URL. If Cloudflare asks you to choose a Workers subdomain, choose one and continue.
8. Select a completed tournament whose teamsheets have been published, search a player, and open their sheet. Upcoming events may have rosters without published teamsheets.

Changes pushed to `main` will rebuild and deploy automatically. No custom domain is required. Your GitHub repository can remain private; that does not make the deployed website private.

Official setup instructions: https://developers.cloudflare.com/workers/ci-cd/builds/

## Local development

Use Node.js 22.13 or newer and the pnpm version declared in package.json.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Build and manually deploy (alternative to Git integration):

```sh
pnpm build
pnpm exec wrangler login
pnpm deploy
```

`pnpm deploy` uses the generated `dist/server/wrangler.json`, which points at the compiled Worker and client assets. Do not deploy the unbuilt source entrypoint.

## RK9 integration

- `/api/rk9` fetches only allowlisted public RK9 paths and does not forward cookies.
- `lib/rk9.ts` parses tournament listings, rosters, and English teamsheets.
- Both Scarlet/Violet Tera-type sheets and Champions stat-alignment sheets are supported.
- Pokémon sprites come directly from the URLs in the source RK9 teamsheets.
- Directory responses cache for ten minutes; rosters and sheets cache for one minute per Worker instance.
- Unpublished sheets are marked unavailable. RK9 outages or markup changes may temporarily stop lookups.

## Troubleshooting

**Repository missing in Cloudflare:** adjust the Cloudflare GitHub App installation to allow this repository.

**Worker name mismatch:** use `rk9-team-viewer` in Cloudflare and in `wrangler.jsonc`.

**Node engine error:** set `NODE_VERSION=22.16.0` under the build environment settings and retry the build.

**Build succeeds, deployment fails:** confirm the deploy command is `pnpm run deploy`. It deploys the generated configuration, not the source configuration.

**Teamsheet not published:** this is an RK9 availability condition. Try a completed tournament and a player with a public sheet.

## Verification

The original RK9 parsers were checked against public Worlds 2026 and Brisbane 2026 rosters and teamsheets. Standalone build and deployment configuration are validated locally before delivery; the actual Cloudflare deployment must still be completed in your account.
