export function safeText(v: any, fallback = ""): string {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s.length ? s : fallback;
}

export function initials(v: any, fallback = "?"): string {
  const s = safeText(v, "");
  if (!s) return fallback;

  const parts = s.split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? "";
  const last = (parts.length > 1 ? parts[parts.length - 1] : "")?.charAt(0) ?? "";

  const ini = (first + last).toUpperCase();
  return ini || fallback;
}
