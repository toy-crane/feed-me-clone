export function composeClipboardPayload(prompt: string, body: string): string {
  if (prompt.trim().length === 0) {
    return body;
  }
  return `${prompt}\n\n${body}`;
}
