import "server-only";

import { lookup } from "node:dns/promises";

export async function resolveHost(hostname: string): Promise<string | null> {
  try {
    const result = await lookup(hostname);
    return result.address;
  } catch {
    return null;
  }
}
