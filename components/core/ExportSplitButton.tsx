"use client";

import {
  ChevronDownIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { composeClipboardPayload } from "@/lib/core/compose-clipboard";
import { downloadMarkdown } from "@/lib/core/download-md";

const CHATGPT_URL = "https://chatgpt.com/";
const CLAUDE_URL = "https://claude.ai/new";
const HANDOFF_TOAST = "클립보드에 복사했어요. 입력창에 붙여넣어 주세요";
const CLIPBOARD_ERROR_TOAST = "클립보드 복사에 실패했어요";

type ExportSplitButtonProps = {
  markdown: string;
  prompt: string;
  title: string;
};

export function ExportSplitButton({
  markdown,
  prompt,
  title,
}: ExportSplitButtonProps) {
  async function handleCopy() {
    const payload = composeClipboardPayload(prompt, markdown);
    try {
      await navigator.clipboard.writeText(payload);
      toast("복사됨");
    } catch {
      toast.error(CLIPBOARD_ERROR_TOAST);
    }
  }

  function handleDownload() {
    downloadMarkdown(title, markdown);
  }

  function handleHandoff(target: typeof CHATGPT_URL | typeof CLAUDE_URL) {
    // Open the new tab synchronously to preserve the user-gesture frame
    // (Safari/strict Firefox block popups created after an `await`).
    window.open(target, "_blank", "noopener,noreferrer");
    const payload = composeClipboardPayload(prompt, markdown);
    navigator.clipboard
      .writeText(payload)
      .then(() => toast(HANDOFF_TOAST))
      .catch(() => toast.error(CLIPBOARD_ERROR_TOAST));
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
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={handleDownload}>
              <DownloadIcon />
              마크다운 다운로드
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleHandoff(CHATGPT_URL)}>
              <ExternalLinkIcon />
              ChatGPT에서 열기
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleHandoff(CLAUDE_URL)}>
              <ExternalLinkIcon />
              Claude에서 열기
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
