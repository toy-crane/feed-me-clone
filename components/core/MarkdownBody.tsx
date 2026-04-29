"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

type MarkdownBodyProps = {
  markdown: string;
  className?: string;
};

export function MarkdownBody({ markdown, className }: MarkdownBodyProps) {
  return (
    <div
      data-slot="markdown-body"
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none break-words",
        "prose-headings:scroll-mt-20",
        "prose-pre:overflow-x-auto",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
