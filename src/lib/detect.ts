import { PROVIDERS, type Provider } from "./providers";

export type DetectedKey = {
  raw: string;
  provider: Provider | null;
  /** True when multiple providers matched — user should pick manually. */
  ambiguous: boolean;
};

/**
 * Auto-detect a provider from a raw key string.
 *
 * Order of precedence: providers with a distinctive prefix (`sk-ant-`,
 * `AIza`, `xai-`, ...) win over generic hex/alphanum patterns.
 */
export function detectProvider(raw: string): DetectedKey {
  const trimmed = raw.trim();
  if (!trimmed) return { raw, provider: null, ambiguous: false };
  const matches = PROVIDERS.filter((p) => p.keyPattern.test(trimmed));
  if (matches.length === 0) return { raw: trimmed, provider: null, ambiguous: false };
  if (matches.length === 1) return { raw: trimmed, provider: matches[0], ambiguous: false };

  // Prefer the match whose regex source is the most specific (longest & has a literal prefix).
  const scored = matches
    .map((p) => ({
      p,
      score:
        (p.keyPattern.source.startsWith("^") ? 1 : 0) +
        (p.keyPattern.source.replace(/[^A-Za-z0-9_-]/g, "").length),
    }))
    .sort((a, b) => b.score - a.score);
  return { raw: trimmed, provider: scored[0].p, ambiguous: scored[0].score === scored[1].score };
}

/** Split a bulk-paste blob into keys, filter blanks, dedupe. */
export function parseBulkInput(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split(/[\r\n,;]+/)) {
    const t = line.trim();
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}
