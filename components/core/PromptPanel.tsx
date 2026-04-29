"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const PROMPT_PRESETS = [
  "요약해줘",
  "한국어로 번역해줘",
  "쉽게 설명해줘",
] as const;

const TOGGLE_LABEL = "프롬프트 추가하기";

type PromptPanelProps = {
  value: string;
  onChange: (next: string) => void;
  className?: string;
};

export function PromptPanel({ value, onChange, className }: PromptPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const ToggleIcon = isOpen ? ChevronDownIcon : ChevronRightIcon;

  return (
    <section
      data-slot="prompt-panel"
      className={cn(
        "flex flex-col gap-2 border-b border-border pb-3",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((s) => !s)}
        className="self-start text-muted-foreground"
      >
        <PlusIcon data-icon="inline-start" />
        {TOGGLE_LABEL}
        <ToggleIcon data-icon="inline-end" />
      </Button>

      {isOpen ? (
        <>
          <Textarea
            placeholder="ex) 이 글을 요약해줘"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="min-h-16"
          />
          <div className="flex flex-wrap gap-2">
            {PROMPT_PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange(preset)}
                className="rounded-full"
              >
                {preset}
              </Button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
