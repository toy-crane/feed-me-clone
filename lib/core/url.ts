export function isValidHttpUrl(value: string): boolean {
  if (typeof value !== "string" || value.trim().length === 0) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  return parsed.protocol === "http:" || parsed.protocol === "https:";
}

// Block private / loopback / link-local hostnames at the URL level (cheap, syntactic).
// Does NOT defend against DNS rebinding (a public hostname whose A record resolves
// into a private range). Network-level resolution is handled in services/convert.ts.
export function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, ""); // strip IPv6 brackets

  if (host === "localhost") return true;
  if (host === "::1" || host === "0:0:0:0:0:0:0:1") return true;
  if (host.endsWith(".localhost")) return true;
  if (host.endsWith(".local")) return true;

  // IPv4 literal — match private ranges
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [parseInt(v4[1], 10), parseInt(v4[2], 10)];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local incl. AWS metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }

  // IPv6 literal — match common private/loopback/link-local patterns
  if (/^fc[0-9a-f]{2}:/.test(host)) return true; // unique-local
  if (/^fd[0-9a-f]{2}:/.test(host)) return true; // unique-local
  if (/^fe80:/.test(host)) return true; // link-local
  if (/^::ffff:127\./.test(host)) return true; // IPv4-mapped loopback

  return false;
}
