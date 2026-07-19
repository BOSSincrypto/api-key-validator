// Server-side validator. Runs inside GitHub Actions.
// Input : env PAYLOAD = JSON string { run_id, keys: [{ provider, key }] }
// Output: writes ./results/<run_id>.json with { run_id, finished_at, results: [...] }
// Keys are used once to call each provider and never printed to stdout.

import { PROVIDERS } from "./providers.mjs";
import { mkdirSync, writeFileSync } from "node:fs";

function mask(key) {
  if (!key) return "";
  if (key.length <= 12) return key.slice(0, 2) + "…" + key.slice(-2);
  const dash = key.indexOf("-", 4);
  const prefixEnd = dash > 0 ? Math.min(dash + 1, 10) : 6;
  return key.slice(0, prefixEnd) + "…" + key.slice(-4);
}

function classify(status) {
  if (status >= 200 && status < 300) return "valid";
  if (status === 401 || status === 403) return "invalid";
  if (status === 429) return "rate_limited";
  return "error";
}

async function validateOne({ provider, key }) {
  const spec = PROVIDERS[provider];
  const masked = mask(key);
  if (!spec) return { provider, masked, status: "unknown", detail: "unknown provider" };

  const url = spec.u.replace("{key}", encodeURIComponent(key));
  const headers = { Accept: "application/json", ...(spec.extra ?? {}) };
  if (spec.h) headers[spec.h] = (spec.f ?? "Bearer {key}").replace("{key}", key);
  const init = { method: spec.m, headers };
  if (spec.body) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(spec.body);
  }
  const t0 = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timer);
    const latency_ms = Date.now() - t0;
    const status = classify(res.status);
    let detail;
    if (status !== "valid") {
      try {
        const txt = (await res.text()).slice(0, 180);
        detail = txt.replace(/\s+/g, " ").trim() || res.statusText;
      } catch {
        detail = res.statusText;
      }
    } else {
      detail = `ok (${res.status})`;
    }
    return { provider, masked, status, http_status: res.status, latency_ms, detail };
  } catch (e) {
    const latency_ms = Date.now() - t0;
    const msg = e instanceof Error ? e.message : String(e);
    return { provider, masked, status: "error", latency_ms, detail: msg.slice(0, 180) };
  }
}

async function runInBatches(items, size, worker) {
  const results = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      results[idx] = await worker(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}

const raw = process.env.PAYLOAD;
if (!raw) {
  console.error("PAYLOAD env not set");
  process.exit(1);
}
const payload = JSON.parse(raw);
const run_id = String(payload.run_id || Date.now());
const keys = Array.isArray(payload.keys) ? payload.keys : [];
const filtered = keys
  .filter((k) => k && typeof k.provider === "string" && typeof k.key === "string")
  .slice(0, 500);

console.log(`Validating ${filtered.length} keys for run ${run_id}...`);
const results = await runInBatches(filtered, 10, validateOne);
const output = { run_id, finished_at: new Date().toISOString(), results };

mkdirSync("results", { recursive: true });
writeFileSync(`results/${run_id}.json`, JSON.stringify(output, null, 2));
const summary = results.reduce((acc, r) => ((acc[r.status] = (acc[r.status] ?? 0) + 1), acc), {});
console.log("done:", JSON.stringify(summary));
