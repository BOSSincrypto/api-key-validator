// Dispatch a validation run to the user's GitHub Actions fork and poll the
// `results` branch for the resulting JSON file. All requests go directly
// from the browser to api.github.com / raw.githubusercontent.com using the
// user's fine-grained PAT — no third-party backend involved.

import type { GhConfig } from "./setup";
import type { ValidationRun } from "@/components/Validator";

const GH = "https://api.github.com";

async function ghFetch(cfg: GhConfig, path: string, init: RequestInit = {}) {
  const res = await fetch(`${GH}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${cfg.token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  return res;
}

export async function verifyConfig(cfg: GhConfig): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await ghFetch(cfg, `/repos/${cfg.owner}/${cfg.repo}`);
  if (res.status === 200) return { ok: true };
  if (res.status === 401) return { ok: false, error: "Invalid token." };
  if (res.status === 404) return { ok: false, error: `Repo ${cfg.owner}/${cfg.repo} not found or token has no access.` };
  return { ok: false, error: `GitHub returned ${res.status}.` };
}

export async function dispatchRun(
  cfg: GhConfig,
  run_id: string,
  keys: { provider: string; key: string }[],
): Promise<void> {
  const res = await ghFetch(cfg, `/repos/${cfg.owner}/${cfg.repo}/dispatches`, {
    method: "POST",
    body: JSON.stringify({
      event_type: "validate-keys",
      client_payload: { run_id, keys },
    }),
  });
  if (res.status !== 204) {
    const text = await res.text().catch(() => "");
    throw new Error(
      res.status === 404
        ? "Workflow not found. Push the .github/workflows/validate-keys.yml file to your fork's default branch."
        : `Dispatch failed (${res.status}). ${text.slice(0, 160)}`,
    );
  }
}

export async function pollResults(
  cfg: GhConfig,
  run_id: string,
  opts: { timeoutMs?: number; intervalMs?: number; onTick?: (elapsedSec: number) => void } = {},
): Promise<ValidationRun> {
  const timeoutMs = opts.timeoutMs ?? 180_000;
  const intervalMs = opts.intervalMs ?? 3_000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const res = await ghFetch(
      cfg,
      `/repos/${cfg.owner}/${cfg.repo}/contents/results/${run_id}.json?ref=results`,
    );
    if (res.status === 200) {
      const json = await res.json();
      // decode base64 content
      const b64 = (json.content as string).replace(/\n/g, "");
      const decoded = atob(b64);
      const parsed = JSON.parse(decoded);
      return {
        run_id: parsed.run_id,
        finished_at: parsed.finished_at,
        results: parsed.results,
      };
    }
    if (res.status !== 404) {
      const t = await res.text().catch(() => "");
      throw new Error(`Poll failed (${res.status}). ${t.slice(0, 160)}`);
    }
    opts.onTick?.(Math.floor((Date.now() - started) / 1000));
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Timed out waiting for GitHub Actions to publish results. Check the Actions tab in your fork.");
}
