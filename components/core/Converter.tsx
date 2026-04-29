"use client";

import { useState } from "react";
import { AlertCircleIcon } from "lucide-react";

import {
  GENERIC_CONVERSION_ERROR_MESSAGE,
  type ConversionResult,
} from "@/types/conversion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UrlInput } from "./UrlInput";
import { ResultView } from "./ResultView";

export function Converter() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [hasError, setHasError] = useState(false);

  async function handleSubmit(url: string) {
    setIsLoading(true);
    setHasError(false);
    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        setResult(null);
        setHasError(true);
        return;
      }

      const data = (await response.json()) as ConversionResult;
      setResult(data);
    } catch {
      setResult(null);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <UrlInput onSubmit={handleSubmit} isLoading={isLoading} />
      {hasError ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{GENERIC_CONVERSION_ERROR_MESSAGE}</AlertDescription>
        </Alert>
      ) : null}
      {result && !hasError ? <ResultView result={result} /> : null}
    </div>
  );
}
