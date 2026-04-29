"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

type MarkdownBodyProps = {
  markdown: string;
  className?: string;
};

// Page title is already <h1>; demote markdown headings by one level so the
// page never has more than one h1 (a11y / SEO).
/* eslint-disable @typescript-eslint/no-unused-vars */
const components: Components = {
  h1: ({ node, children, ...props }) => <h2 {...props}>{children}</h2>,
  h2: ({ node, children, ...props }) => <h3 {...props}>{children}</h3>,
  h3: ({ node, children, ...props }) => <h4 {...props}>{children}</h4>,
  h4: ({ node, children, ...props }) => <h5 {...props}>{children}</h5>,
  h5: ({ node, children, ...props }) => <h6 {...props}>{children}</h6>,
};
/* eslint-enable @typescript-eslint/no-unused-vars */

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
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
