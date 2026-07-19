/** Mask a key so only the prefix and last 4 chars are visible. */
export function maskKey(key: string): string {
  if (key.length <= 12) return key.slice(0, 2) + "…" + key.slice(-2);
  const prefixEnd = Math.min(key.indexOf("-", 4) + 1 || 6, 10);
  return key.slice(0, prefixEnd) + "…" + key.slice(-4);
}
