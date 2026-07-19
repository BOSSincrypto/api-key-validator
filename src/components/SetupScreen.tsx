import { useState } from "react";
import { toast } from "sonner";
import { saveConfig, type GhConfig } from "@/lib/setup";
import { verifyConfig } from "@/lib/dispatch";

export function SetupScreen({ onDone }: { onDone: (cfg: GhConfig) => void }) {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("api-key-validator");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!owner || !repo || !token) return toast.error("Fill all three fields.");
    setBusy(true);
    try {
      const cfg = { owner: owner.trim(), repo: repo.trim(), token: token.trim() };
      const check = await verifyConfig(cfg);
      if (!check.ok) return toast.error(check.error);
      saveConfig(cfg);
      toast.success("Connected.");
      onDone(cfg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-6 space-y-5 max-w-xl mx-auto">
      <div className="space-y-1">
        <h2 className="text-lg font-medium tracking-tight">One-time setup</h2>
        <p className="text-sm text-[var(--color-text-dim)]">
          Validation runs inside your own GitHub Actions runner. Fork this repo, then paste a fine-grained
          Personal Access Token scoped to it.
        </p>
      </div>

      <ol className="text-sm text-[var(--color-text-dim)] space-y-2 list-decimal pl-5">
        <li>
          Fork{" "}
          <a
            className="text-[var(--color-accent)] hover:underline"
            href="https://github.com/BOSSincrypto/api-key-validator"
            target="_blank"
            rel="noreferrer"
          >
            this repo
          </a>{" "}
          to your account.
        </li>
        <li>
          Create a{" "}
          <a
            className="text-[var(--color-accent)] hover:underline"
            href="https://github.com/settings/personal-access-tokens/new"
            target="_blank"
            rel="noreferrer"
          >
            fine-grained PAT
          </a>{" "}
          restricted to that fork with:
          <ul className="list-disc pl-5 mt-1 text-[var(--color-text-mute)]">
            <li>
              <span className="mono">Actions</span>: Read and write
            </li>
            <li>
              <span className="mono">Contents</span>: Read and write
            </li>
            <li>
              <span className="mono">Metadata</span>: Read (auto)
            </li>
          </ul>
        </li>
        <li>Paste the details below. They stay in your browser's localStorage.</li>
      </ol>

      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[var(--color-text-dim)] block mb-1.5">GitHub owner</label>
            <input
              className="input"
              placeholder="your-username"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-dim)] block mb-1.5">Repo</label>
            <input
              className="input"
              placeholder="api-key-validator"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-[var(--color-text-dim)] block mb-1.5">Fine-grained PAT</label>
          <input
            className="input mono"
            placeholder="github_pat_..."
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button className="btn btn-primary w-full" disabled={busy} type="submit">
          {busy ? "Verifying..." : "Connect"}
        </button>
      </form>
    </div>
  );
}
