import "server-only";

import type { ConversionResult } from "@/types/conversion";
import { extractMarkdown } from "@/lib/core/defuddle";

export const CONVERT_TIMEOUT_MS = 5000;

export async function convertUrl(url: string): Promise<ConversionResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONVERT_TIMEOUT_MS);

  let html: string;
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
    });
    if (!response.ok) {
      throw new Error(`upstream responded with ${response.status}`);
    }
    html = await response.text();
  } finally {
    clearTimeout(timeoutId);
  }

  const extracted = await extractMarkdown(html, url);

  return {
    title: extracted.title,
    author: extracted.author,
    sourceUrl: url,
    markdown: extracted.markdown,
  };
}
