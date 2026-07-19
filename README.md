# AI Key Validator

**Bulk-validate API keys for 100+ providers — in your browser, on your runner.**

Paste a wall of keys. Auto-detect the provider. Hit each real auth endpoint from a GitHub Actions runner you control. Get `valid` / `invalid` / `rate_limited` / `error` for every one.

[![Live](https://img.shields.io/badge/live-GitHub%20Pages-6366f1?style=for-the-badge)](https://bossincrypto.github.io/api-key-validator/)
[![Providers](https://img.shields.io/badge/providers-113-0ea5e9?style=for-the-badge)](#supported-providers)
[![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20Actions-10b981?style=for-the-badge)](#stack)
[![License](https://img.shields.io/badge/license-MIT-f59e0b?style=for-the-badge)](#license)

**[Live demo](https://bossincrypto.github.io/api-key-validator/)** ·
[Custom domain setup](#custom-domain) ·
[Report bug](https://github.com/BOSSincrypto/api-key-validator/issues) ·
[Request provider](https://github.com/BOSSincrypto/api-key-validator/issues/new)

---

## Why

Rotated a batch of keys and don't know which still work? Inherited a `.env` graveyard? Need a quick sanity check before a deploy?

Most validators send your keys to someone else's backend. This one does not.

- Keys leave the browser only for GitHub API dispatch / poll (HTTPS) and then from **your** Actions runner to each provider.
- Results are masked (`sk-proj...abcd`) before they land on the orphan `results` branch.
- No accounts, no analytics, no third-party storage of raw keys.

## Features

| Feature | Detail |
| --- | --- |
| Auto-detect | Regex registry for 113 providers (`sk-ant-...`, `AIza...`, `xai-...`, `sk-proj-...`) |
| Parallel validate | Cheap authenticated endpoints (models list, whoami, credits, ...) |
| Clear verdicts | `valid` · `invalid` · `rate_limited` · `error` + HTTP status + latency + snippet |
| Masked UI | Keys never shown or stored in full in the SPA |
| CSV export | One-click download of a finished run |
| Zero backend | Static Pages site + your fork's workflow only |

## How it works

```text
Browser  --repository_dispatch-->  GitHub API
   ^                                   |
   | poll results/<run_id>.json        v
   |                            Actions runner
   |                                   |
   +----- masked JSON <---- results branch
                                   |
                                   v
                            Provider APIs (OpenAI, Anthropic, ...)
```

1. SPA parses paste, dedupes, auto-detects provider per key.
2. Fine-grained PAT triggers `validate-keys` workflow via `repository_dispatch`.
3. Runner (`scripts/validate.mjs`) fires one auth request per key (batched, 15s timeout).
4. JSON result is committed to the orphan `results` branch; files older than 24h are pruned.
5. SPA polls GitHub Contents API until the file appears (typical cold start 15–40s).

Deploy path is separate: every push to `main` builds the SPA and publishes to GitHub Pages automatically.

## Live demo

**Site (now):** https://bossincrypto.github.io/api-key-validator/  
**Custom domain (after DNS):** https://api-key-validator.bossincrypto.dev

1. Fork this repo.
2. Create a [fine-grained PAT](https://github.com/settings/personal-access-tokens/new) limited to that fork:
   - **Actions**: Read and write
   - **Contents**: Read and write
   - **Metadata**: Read (auto)
3. Open the demo, paste `owner` / `repo` / PAT (stored only in `localStorage`).
4. Paste keys → **Validate**.

## Local development

Requires [Bun](https://bun.sh).

```bash
bun install
bun dev          # http://localhost:8080
bun run build    # production build → dist/
bun run preview  # serve dist/
```

No `VITE_*` secrets required for the GitHub Actions validation path.

## Supported providers

### AI / LLMs

OpenAI · Anthropic · Google Gemini · xAI (Grok) · Groq · Mistral · DeepSeek · OpenRouter · Perplexity · Cohere · Together · Fireworks · Cerebras · Novita · Anyscale · Hugging Face · Replicate · NVIDIA · GitHub Models · Hyperbolic · SambaNova · AI21 · Friendli · GLHF · Zhipu

### Voice / Audio / Video

ElevenLabs · AssemblyAI · Deepgram · Cartesia · Stability · Runway · Luma · Twelve Labs

### Embeddings / Vector / Search

Voyage · Jina · Nomic · Pinecone · Exa · Tavily · Brave Search · Firecrawl

### Infra / DevOps

Supabase · Neon · Netlify · Render · Sentry · New Relic · Databricks · Snyk · Modal · Baseten · Runpod · Fal · Segmind · DataStax · Trigger.dev · Xata · Buildkite · CircleCI · Docker Hub · npm · GitLab · Bitbucket · LaunchDarkly · Statsig · Honeybadger

### Product / Growth / Comms

Resend · SendGrid · Brevo · MailerSend · Courier · Notion · Linear · Airtable · HubSpot · Stripe · Discord · Intercom · Klaviyo · Contentful · Cal.com · Asana · ClickUp · Figma · Dropbox · Typeform · Twitter/X · Pushbullet · Modrinth

### Data / Utility

DeepL · PostHog · LangSmith · Langfuse · Helicone · Portkey · Browserbase · Apify · OpenPipe · PromptLayer · ScrapingBee · Scrapfly · Mem0 · Tinybird · CoinGecko · AbuseIPDB · Pexels · Pixabay · WolframAlpha · IPinfo · CurrencyAPI · Duffel · Leonardo

Machine-readable registries:

- UI detect: [`src/lib/providers.ts`](src/lib/providers.ts)
- Runner specs: [`scripts/providers.mjs`](scripts/providers.mjs)

## Add a provider

Keep both registries in sync.

| File | Role |
| --- | --- |
| `src/lib/providers.ts` | Frontend `keyPattern` + display metadata |
| `scripts/providers.mjs` | Runner HTTP call (`m`, `u`, `h`, `f`, optional body) |

Prefer distinctive key prefixes and the **cheapest** authenticated endpoint that returns 2xx vs 401/403.

## Security

- Raw keys are not persisted by the SPA. The PAT lives in `localStorage` only.
- Runner never prints full keys to logs; results store **masked** keys.
- `results` branch auto-prunes JSON older than 24 hours.
- Treat this as a diagnostic tool. Rotate anything you validated against infra you do not fully trust.
- Prefer a short-lived fine-grained PAT restricted to a private fork if your keys are production-grade.

## Stack

React 19 · Vite 7 · Tailwind 4 · TypeScript 5 · Bun · GitHub Actions · GitHub Pages

## Deploy

This repo ships two workflows:

| Workflow | Trigger | Purpose |
| --- | --- |
| [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) | push to `main` / manual | Build SPA → GitHub Pages |
| [`.github/workflows/validate-keys.yml`](.github/workflows/validate-keys.yml) | `repository_dispatch` | Run validation → `results` branch |

### Custom domain

Target: **https://api-key-validator.bossincrypto.dev**

Current DNS for that host still points at Porkbun parking (`pixie.porkbun.com`), not GitHub Pages. Until that changes, the live site is the project URL above.

**1. Porkbun DNS (one record):**

| Type | Host | Answer | TTL |
| --- | --- | --- | --- |
| `CNAME` | `api-key-validator` | `bossincrypto.github.io` | 600 |

Delete any conflicting A/AAAA/URL-forward for `api-key-validator`.

**2. After DNS propagates** (`dig api-key-validator.bossincrypto.dev` should show `bossincrypto.github.io`):

```bash
# redeploy with CNAME published into the Pages artifact
gh workflow run "Deploy to GitHub Pages" -f unused=1   # or push with ENABLE_CUSTOM_DOMAIN
```

Or set repo variable / re-enable in workflow by setting `ENABLE_CUSTOM_DOMAIN=true` on the build job env, then push.

**3. GitHub Pages settings**

- Custom domain: `api-key-validator.bossincrypto.dev`
- Wait for DNS check + TLS certificate
- Enforce HTTPS

Build already uses relative asset paths (`./`) so both the subdomain root and `github.io/api-key-validator/` resolve assets correctly.

## License

MIT

---

Built for operators who rotate keys faster than they inventory them.
