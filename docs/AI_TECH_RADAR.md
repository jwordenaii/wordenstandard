# AI Tech Radar

This project now includes a feed-first monitoring pipeline for tracking new AI capabilities and platform changes.

## What It Monitors

- OpenAI News RSS
- Google AI Blog RSS
- Cloudflare AI tag RSS
- Microsoft AI tag RSS
- Anthropic newsroom page (HTML fallback)
- Vercel changelog page (HTML fallback)

## Local Usage

Run a full collection + report generation:

```bash
npm run ops:tech-radar
```

Run compare-only mode (returns non-zero when new items are detected):

```bash
npm run ops:tech-radar:diff
```

Direct script options:

```bash
node scripts/ai-tech-radar.mjs --help
```

## Output Files

The script writes to `docs/tech-radar/`:

- `snapshot.json` - canonical baseline used for change detection
- `latest.json` - current run summary with new/changed items
- `source-health.json` - per-source fetch health and timing
- `latest-report.md` - human-readable report

## GitHub Actions Automation

Workflow: `.github/workflows/ai-tech-radar.yml`

Schedule:

- Every 6 hours
- Manual trigger via `workflow_dispatch`

The workflow restores prior `snapshot.json` from GitHub Actions cache, runs the radar, saves the updated snapshot back to cache, and uploads reports as artifacts. This keeps diffs meaningful across runs without writing commits to `main`.

## Capability Tagging

The script classifies signals into capability tags to make trends actionable:

- `agents-autonomy`
- `models-reasoning`
- `multimodal-voice-vision`
- `developer-platforms`
- `infra-inference-edge`
- `security-governance`
- `memory-state-personalization`
- `search-retrieval`

Update rules in `scripts/ai-tech-radar.mjs` as new categories become important.
