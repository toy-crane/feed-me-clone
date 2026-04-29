"use client";

import { useState } from "react";

import type { ConversionResult } from "@/types/conversion";
import { UrlInput } from "./UrlInput";
import { ResultView } from "./ResultView";

export function Converter() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);

  async function handleSubmit(url: string) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        setResult(null);
        return;
      }

      const data = (await response.json()) as ConversionResult;
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <UrlInput onSubmit={handleSubmit} isLoading={isLoading} />
      {result ? <ResultView result={result} /> : null}
    </div>
  );
}
