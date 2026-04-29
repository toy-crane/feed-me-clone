"use client";

import { ChevronDownIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { composeClipboardPayload } from "@/lib/core/compose-clipboard";

type ExportSplitButtonProps = {
  markdown: string;
  prompt: string;
  title: string;
};

export function ExportSplitButton({
  markdown,
  prompt,
}: ExportSplitButtonProps) {
  async function handleCopy() {
    const payload = composeClipboardPayload(prompt, markdown);
    await navigator.clipboard.writeText(payload);
    toast("복사됨");
  }

  return (
    <div className="inline-flex items-stretch">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="rounded-r-none border-r-0"
        aria-label="복사하기"
      >
        <CopyIcon data-icon="inline-start" />
        복사하기
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="더 많은 내보내기"
            className="rounded-l-none"
          >
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
