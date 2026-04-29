"use client";

import { ExternalLinkIcon } from "lucide-react";

import type { ConversionResult } from "@/types/conversion";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownBody } from "./MarkdownBody";

type ResultViewProps = {
  result: ConversionResult;
  exportSlot?: React.ReactNode;
  promptSlot?: React.ReactNode;
};

function formatDisplayUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    return `${u.host}${u.pathname}${u.search}`.replace(/\/$/, "");
  } catch {
    return rawUrl;
  }
}

export function ResultView({ result, exportSlot, promptSlot }: ResultViewProps) {
  return (
    <section
      data-slot="result-view"
      aria-label="변환 결과"
      className="flex w-full flex-col gap-4"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="truncate text-xl font-bold leading-snug">
            {result.title}
          </h1>
          {result.author ? (
            <p
              data-testid="result-author"
              className="text-xs text-muted-foreground"
            >
              by {result.author}
            </p>
          ) : null}
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <ExternalLinkIcon className="size-3 shrink-0" />
            <a
              href={result.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:underline"
            >
              {formatDisplayUrl(result.sourceUrl)}
            </a>
          </p>
        </div>
        {exportSlot ? <div className="shrink-0">{exportSlot}</div> : null}
      </header>

      {promptSlot}

      <Card>
        <CardContent className="px-4 py-4 sm:px-6">
          <MarkdownBody markdown={result.markdown} />
        </CardContent>
      </Card>
    </section>
  );
}
