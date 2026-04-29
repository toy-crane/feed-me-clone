import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ResultView } from "./ResultView";

describe("ResultView", () => {
  it("renders title as a top-level heading", () => {
    render(
      <ResultView
        result={{
          title: "Getting Started with Defuddle",
          author: "Steph Ango",
          sourceUrl: "https://defuddle.md/docs/getting-started",
          markdown: "# Hello",
        }}
      />
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Getting Started with Defuddle",
      })
    ).toBeInTheDocument();
  });

  it("shows the author byline when an author is present", () => {
    render(
      <ResultView
        result={{
          title: "T",
          author: "Steph Ango",
          sourceUrl: "https://defuddle.md/x",
          markdown: "body",
        }}
      />
    );
    expect(screen.getByText(/Steph Ango/)).toBeInTheDocument();
  });

  it("does NOT render the author line when author is undefined", () => {
    render(
      <ResultView
        result={{
          title: "T",
          sourceUrl: "https://defuddle.md/x",
          markdown: "body",
        }}
      />
    );
    expect(screen.queryByTestId("result-author")).not.toBeInTheDocument();
  });

  it("always shows the source URL in the header", () => {
    render(
      <ResultView
        result={{
          title: "T",
          sourceUrl: "https://defuddle.md/docs/getting-started",
          markdown: "body",
        }}
      />
    );
    expect(
      screen.getByText("defuddle.md/docs/getting-started", { exact: false })
    ).toBeInTheDocument();
  });

  it("renders promptSlot between the header and the markdown body in DOM order", () => {
    render(
      <ResultView
        result={{
          title: "Article",
          sourceUrl: "https://example.com/x",
          markdown: "## Section\n\nbody",
        }}
        promptSlot={<div data-testid="prompt-slot">PROMPT</div>}
      />
    );

    const promptSlot = screen.getByTestId("prompt-slot");
    const headerTitle = screen.getByRole("heading", { level: 1, name: "Article" });
    const bodySection = screen.getByRole("heading", { level: 3, name: "Section" });

    const order = headerTitle.compareDocumentPosition(promptSlot);
    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const bodyOrder = promptSlot.compareDocumentPosition(bodySection);
    expect(bodyOrder & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders the markdown body via react-markdown (semantic h2/list/code)", () => {
    render(
      <ResultView
        result={{
          title: "T",
          sourceUrl: "https://defuddle.md/x",
          markdown:
            "## Section\n\n- one\n- two\n\n[link](https://example.com)\n\n```js\nconst x = 1;\n```",
        }}
      />
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Section" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "link" })).toHaveAttribute(
      "href",
      "https://example.com"
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("const x = 1;")).toBeInTheDocument();
  });
});
