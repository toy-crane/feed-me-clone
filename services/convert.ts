import "server-only";

import type { ConversionResult } from "@/types/conversion";
import { extractMarkdown } from "@/lib/core/defuddle";
import { resolveHost } from "@/lib/core/dns-resolver";
import { isPrivateHostname } from "@/lib/core/url";

export const CONVERT_TIMEOUT_MS = 5000;
export const MAX_RESPONSE_BYTES = 10 * 1024 * 1024; // 10 MB

const USER_AGENT =
  "Mozilla/5.0 (compatible; URL-to-Markdown/1.0; +https://example.com/bot)";

async function ensurePublicHost(rawUrl: string) {
  const u = new URL(rawUrl);
  if (isPrivateHostname(u.hostname)) {
    throw new Error("private host blocked");
  }
  // DNS rebinding defense: resolve and check the resolved IP too.
  const address = await resolveHost(u.hostname);
  if (address && isPrivateHostname(address)) {
    throw new Error("private host blocked");
  }
}

async function readBodyWithCap(
  response: Response,
  maxBytes: number
): Promise<string> {
  const lengthHeader = response.headers.get("content-length");
  if (lengthHeader) {
    const len = Number.parseInt(lengthHeader, 10);
    if (Number.isFinite(len) && len > maxBytes) {
      throw new Error("response too large");
    }
  }
  if (!response.body) {
    return await response.text();
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      reader.cancel().catch(() => {});
      throw new Error("response too large");
    }
    chunks.push(value);
  }
  const buf = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buf.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8").decode(buf);
}

export async function convertUrl(url: string): Promise<ConversionResult> {
  await ensurePublicHost(url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONVERT_TIMEOUT_MS);

  // Promise that rejects when the AbortController fires — covers extractMarkdown
  // (synchronous JSDOM/Defuddle work that does not observe the signal). Set up
  // lazily so we can attach a noop catch when not awaited.
  function abortRejection(): Promise<never> {
    return new Promise<never>((_, reject) => {
      if (controller.signal.aborted) {
        reject(new Error("conversion timed out"));
        return;
      }
      controller.signal.addEventListener(
        "abort",
        () => reject(new Error("conversion timed out")),
        { once: true }
      );
    });
  }

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": USER_AGENT },
    });
    if (!response.ok) {
      throw new Error(`upstream responded with ${response.status}`);
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!/^text\/|application\/(xhtml|xml)/i.test(contentType)) {
      throw new Error(`unsupported content-type: ${contentType}`);
    }

    const html = await readBodyWithCap(response, MAX_RESPONSE_BYTES);
    const extracted = await Promise.race([
      extractMarkdown(html, url),
      abortRejection(),
    ]);

    return {
      title: extracted.title,
      author: extracted.author,
      sourceUrl: url,
      markdown: extracted.markdown,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
