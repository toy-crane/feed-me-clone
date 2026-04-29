const RESERVED_FILENAME_RE = /[^A-Za-z0-9가-힣_\-.]/g;
const COLLAPSED_UNDERSCORES_ONLY_RE = /^_+$/;

export function sanitizeFilename(rawTitle: string): string | null {
  const trimmed = rawTitle.trim();
  if (trimmed.length === 0) return null;
  const replaced = trimmed.replace(RESERVED_FILENAME_RE, "_");
  if (replaced.length === 0) return null;
  if (COLLAPSED_UNDERSCORES_ONLY_RE.test(replaced)) return null;
  return replaced;
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function fallbackFilename(now: Date): string {
  const yyyy = now.getFullYear();
  const mm = pad2(now.getMonth() + 1);
  const dd = pad2(now.getDate());
  const hh = pad2(now.getHours());
  const mi = pad2(now.getMinutes());
  return `page-${yyyy}${mm}${dd}-${hh}${mi}`;
}

export function buildFilename(title: string, now: Date): string {
  return sanitizeFilename(title) ?? fallbackFilename(now);
}

export function downloadMarkdown(
  title: string,
  markdown: string,
  now: Date = new Date()
): void {
  const name = `${buildFilename(title, now)}.md`;
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
