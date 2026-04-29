import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { UrlInput } from "./UrlInput";

const VALIDATION_HINT = /올바른 URL을 입력해 주세요/;

describe("UrlInput — happy path", () => {
  it("calls onSubmit with the typed URL when the submit button is clicked", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<UrlInput onSubmit={onSubmit} isLoading={false} />);

    const input = screen.getByRole("textbox", { name: /url/i });
    await user.type(input, "https://example.com/post");
    await user.click(screen.getByRole("button", { name: /변환/ }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("https://example.com/post");
  });

  it("calls onSubmit when the user presses Enter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<UrlInput onSubmit={onSubmit} isLoading={false} />);

    const input = screen.getByRole("textbox", { name: /url/i });
    await user.type(input, "https://example.com/post{Enter}");

    expect(onSubmit).toHaveBeenCalledWith("https://example.com/post");
  });

  it("shows a spinner and disables the submit button while loading", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <UrlInput
        onSubmit={onSubmit}
        isLoading={true}
        initialValue="https://example.com"
      />
    );

    const submit = screen.getByRole("button", { name: /변환/ });
    expect(submit).toBeDisabled();
    expect(screen.getByRole("status", { name: /변환 중/ })).toBeInTheDocument();

    await user.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not display the inline 'arrow' label text while loading", () => {
    render(
      <UrlInput
        onSubmit={vi.fn()}
        isLoading={true}
        initialValue="https://example.com"
      />
    );
    expect(screen.queryByText(/변환 중\.\.\./)).not.toBeInTheDocument();
  });
});

describe("UrlInput — invalid URL handling", () => {
  it("disables the submit button while input is empty", () => {
    render(<UrlInput onSubmit={vi.fn()} isLoading={false} />);
    expect(screen.getByRole("button", { name: /변환/ })).toBeDisabled();
  });

  it("does not show the inline hint until a submit is attempted", () => {
    render(<UrlInput onSubmit={vi.fn()} isLoading={false} />);
    expect(screen.queryByText(VALIDATION_HINT)).not.toBeInTheDocument();
  });

  it("rejects submission of non-URL text and shows the inline hint", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<UrlInput onSubmit={onSubmit} isLoading={false} />);

    const input = screen.getByRole("textbox", { name: /url/i });
    await user.type(input, "abc{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(VALIDATION_HINT)).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("clears the inline hint as soon as the user edits the input", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<UrlInput onSubmit={onSubmit} isLoading={false} />);

    const input = screen.getByRole("textbox", { name: /url/i });
    await user.type(input, "abc{Enter}");
    expect(screen.getByText(VALIDATION_HINT)).toBeInTheDocument();

    await user.type(input, "d");
    expect(screen.queryByText(VALIDATION_HINT)).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-invalid", "true");
  });

  it("rejects empty submission attempts (defensive — though button is disabled)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<UrlInput onSubmit={onSubmit} isLoading={false} />);

    const input = screen.getByRole("textbox", { name: /url/i });
    await user.type(input, "{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
