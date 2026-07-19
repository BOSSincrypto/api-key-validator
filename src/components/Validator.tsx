import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { detectProvider, parseBulkInput } from "@/lib/detect";
import { PROVIDERS } from "@/lib/providers";
import { clearConfig, loadConfig, type GhConfig } from "@/lib/setup";
import { dispatchRun, pollResults } from "@/lib/dispatch";
import { ResultsTable } from "./ResultsTable";
import { SetupScreen } from "./SetupScreen";

const MAX_KEYS = 500;

export type ValidationResult = {
  provider: string;
  masked: string;
  status: "valid" | "invalid" | "rate_limited" | "error" | "unknown";
  http_status?: number;
  latency_ms?: number;
  detail?: string;
};

export type ValidationRun = {
  run_id: string;
  finished_at: string;
  results: ValidationResult[];
};

export function Validator() {
  const [cfg, setCfg] = useState<GhConfig | null>(null);
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [run, setRun] = useState<ValidationRun | null>(null);

  useEffect(() => {
    setCfg(loadConfig());
  }, []);

  const parsed = useMemo(() => {
    const keys = parseBulkInput(text);
    const rows = keys.map((k) => ({ raw: k, detected: detectProvider(k) }));
    const byProvider = new Map<string, number>();
    let unknown = 0;
    for (const r of rows) {
      if (r.detected.provider) {
        byProvider.set(r.detected.provider.id, (byProvider.get(r.detected.provider.id) ?? 0) + 1);
      } else unknown++;
    }
    return { rows, byProvider, unknown, total: rows.length };
  }, [text]);

  async function validate() {
    if (!cfg) return;
    if (parsed.total === 0) return toast.error("Paste at least one key.");
    if (parsed.total > MAX_KEYS) return toast.error(`Max ${MAX_KEYS} keys per run.`);
    const identified = parsed.rows.filter((r) => r.detected.provider);
    if (identified.length === 0)
      return toast.error("No pasted values matched a known provider format.");

    const payload = identified.map((r) => ({ provider: r.detected.provider!.id, key: r.raw }));
    const run_id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setRunning(true);
    setRun(null);
    setElapsed(0);
    try {
      await dispatchRun(cfg, run_id, payload);
      const result = await pollResults(cfg, run_id, { onTick: setElapsed });
      setRun(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Validation failed.");
    } finally {
      setRunning(false);
    }
  }

  if (!cfg) return <SetupScreen onDone={setCfg} />;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Validate AI API keys</h1>
          <p className="text-sm text-[var(--color-text-dim)] mt-1">
            Runs inside your fork:{" "}
            <span className="mono text-[var(--color-text)]">
              {cfg.owner}/{cfg.repo}
            </span>{" "}
            ·{" "}
            <button
              className="text-[var(--color-text-mute)] hover:text-[var(--color-text)] underline underline-offset-2"
              onClick={() => {
                clearConfig();
                setCfg(null);
              }}
            >
              disconnect
            </button>
          </p>
        </div>
        <span className="text-xs text-[var(--color-text-mute)] mono">
          {PROVIDERS.length} providers supported
        </span>
      </div>

      <div>
        <label htmlFor="keys" className="text-xs text-[var(--color-text-dim)] block mb-1.5">
          One key per line
        </label>
        <textarea
          id="keys"
          className="textarea"
          placeholder={"sk-proj-...\nsk-ant-...\nAIzaSy...\ngsk_..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          disabled={running}
        />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[var(--color-text-dim)]">
            <span className="mono text-[var(--color-text)]">{parsed.total}</span> keys detected
          </span>
          {[...parsed.byProvider.entries()].map(([id, n]) => (
            <span key={id} className="badge">
              {id} <span className="mono opacity-60">×{n}</span>
            </span>
          ))}
          {parsed.unknown > 0 && (
            <span className="badge badge-warn">
              unknown <span className="mono opacity-60">×{parsed.unknown}</span>
            </span>
          )}
        </div>
        <button
          className="btn btn-primary"
          onClick={validate}
          disabled={running || parsed.total === 0}
        >
          {running ? "Validating..." : "Validate"}
        </button>
      </div>

      {running && (
        <div className="card p-4 text-sm text-[var(--color-text-dim)] flex items-start gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-warn)] mt-2 animate-pulse" />
          <div>
            Waiting on your GitHub Actions runner...{" "}
            <span className="mono text-[var(--color-text-mute)]">{elapsed}s</span>
            <div className="text-[var(--color-text-mute)] text-xs mt-1">
              Cold starts usually finish in 15–40s.
            </div>
          </div>
        </div>
      )}

      {run && <ResultsTable run={run} />}
    </div>
  );
}
