import "server-only";

import { JSDOM } from "jsdom";
import { Defuddle } from "defuddle/node";

export type DefuddleResult = {
  title: string;
  author?: string;
  markdown: string;
};

export async function extractMarkdown(
  html: string,
  url: string
): Promise<DefuddleResult> {
  const dom = new JSDOM(html, { url });
  const result = await Defuddle(dom.window.document, url, {
    markdown: true,
  });

  const author = typeof result.author === "string" ? result.author.trim() : "";

  return {
    title: typeof result.title === "string" ? result.title : "",
    author: author.length > 0 ? author : undefined,
    markdown: typeof result.content === "string" ? result.content : "",
  };
}
