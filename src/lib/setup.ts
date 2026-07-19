// GitHub configuration held in localStorage. The PAT never leaves the browser
// except when dispatching a workflow / reading the `results` branch on the
// user's own fork.

export type GhConfig = { owner: string; repo: string; token: string };

const STORAGE_KEY = "akv.gh-config";

export function loadConfig(): GhConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && typeof p.owner === "string" && typeof p.repo === "string" && typeof p.token === "string") {
      return p;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveConfig(c: GhConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
}

export function clearConfig() {
  localStorage.removeItem(STORAGE_KEY);
}
