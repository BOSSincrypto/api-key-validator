import { useState } from "react";
import { PROVIDERS } from "@/lib/providers";

export function SupportedProviders() {
  const [open, setOpen] = useState(true);

  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-[var(--color-surface-hi)] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-baseline gap-3">
          <h2 className="text-sm font-medium tracking-tight">Supported providers</h2>
          <span className="text-xs text-[var(--color-text-mute)] mono">
            {PROVIDERS.length} total
          </span>
        </div>
        <span
          className="text-[var(--color-text-mute)] text-xs transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
          aria-hidden
        >
          ▸
        </span>
      </button>

      {open && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-[var(--color-border)] border-t border-[var(--color-border)]">
          {PROVIDERS.map((p) => (
            <li key={p.id} className="bg-[var(--color-surface)] px-4 py-3">
              <a
                href={p.docsUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="group block"
              >
                <div className="text-sm text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                  {p.name}
                </div>
                <div className="text-[10.5px] mono text-[var(--color-text-mute)] mt-0.5 truncate">
                  {samplePrefix(p.keyPattern)}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Extract a readable literal prefix from a keyPattern regex source, e.g. "sk-ant-…". */
function samplePrefix(re: RegExp): string {
  const src = re.source.replace(/^\^/, "").replace(/\$$/, "");
  const m = src.match(/^([A-Za-z0-9_-]+)/);
  if (m && m[1].length >= 2) return `${m[1]}…`;
  return "•••";
}
