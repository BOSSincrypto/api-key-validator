import { useMemo } from "react";
import { toast } from "sonner";
import type { ValidationRun, ValidationResult } from "./Validator";

export function ResultsTable({ run }: { run: ValidationRun }) {
  const summary = useMemo(() => {
    const s = { valid: 0, invalid: 0, rate_limited: 0, error: 0, unknown: 0 };
    for (const r of run.results) s[r.status]++;
    return s;
  }, [run]);

  function exportCsv() {
    const header = ["provider", "masked_key", "status", "http_status", "latency_ms", "detail"];
    const rows = run.results.map((r) =>
      [r.provider, r.masked, r.status, r.http_status ?? "", r.latency_ms ?? "", (r.detail ?? "").replace(/"/g, '""')]
        .map((v) => `"${v}"`)
        .join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `akv-results-${run.run_id.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded.");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="badge badge-success">valid <span className="mono">{summary.valid}</span></span>
          <span className="badge badge-danger">invalid <span className="mono">{summary.invalid}</span></span>
          {summary.rate_limited > 0 && (
            <span className="badge badge-warn">rate-limited <span className="mono">{summary.rate_limited}</span></span>
          )}
          {summary.error > 0 && <span className="badge">error <span className="mono">{summary.error}</span></span>}
        </div>
        <button className="btn" onClick={exportCsv}>Export CSV</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-[var(--color-text-mute)] border-b border-[var(--color-border)]">
            <tr>
              <th className="text-left font-normal px-4 py-2.5">Provider</th>
              <th className="text-left font-normal px-4 py-2.5">Key</th>
              <th className="text-left font-normal px-4 py-2.5">Status</th>
              <th className="text-right font-normal px-4 py-2.5">HTTP</th>
              <th className="text-right font-normal px-4 py-2.5">ms</th>
              <th className="text-left font-normal px-4 py-2.5 hidden md:table-cell">Detail</th>
            </tr>
          </thead>
          <tbody>
            {run.results.map((r, i) => (
              <ResultRow key={i} r={r} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResultRow({ r }: { r: ValidationResult }) {
  const badge =
    r.status === "valid"
      ? "badge-success"
      : r.status === "invalid"
        ? "badge-danger"
        : r.status === "rate_limited"
          ? "badge-warn"
          : "";
  return (
    <tr className="border-b border-[var(--color-border)] last:border-0">
      <td className="px-4 py-2.5 mono text-[var(--color-text-dim)]">{r.provider}</td>
      <td className="px-4 py-2.5 mono text-[var(--color-text)]">{r.masked}</td>
      <td className="px-4 py-2.5"><span className={`badge ${badge}`}>{r.status}</span></td>
      <td className="px-4 py-2.5 text-right mono text-[var(--color-text-dim)]">{r.http_status ?? "-"}</td>
      <td className="px-4 py-2.5 text-right mono text-[var(--color-text-dim)]">{r.latency_ms ?? "-"}</td>
      <td className="px-4 py-2.5 text-[var(--color-text-mute)] text-xs hidden md:table-cell truncate max-w-[280px]">
        {r.detail ?? ""}
      </td>
    </tr>
  );
}
