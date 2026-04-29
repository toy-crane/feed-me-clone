import {
  GENERIC_CONVERSION_ERROR_MESSAGE,
  type ConversionError,
} from "@/types/conversion";
import { isValidHttpUrl } from "@/lib/core/url";
import { convertUrl } from "@/services/convert";

const errorBody: ConversionError = { message: GENERIC_CONVERSION_ERROR_MESSAGE };

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(errorBody, { status: 400 });
  }

  const url = (payload as { url?: unknown } | null)?.url;
  if (typeof url !== "string" || !isValidHttpUrl(url)) {
    return Response.json(errorBody, { status: 400 });
  }

  try {
    const result = await convertUrl(url);
    return Response.json(result, { status: 200 });
  } catch {
    return Response.json(errorBody, { status: 502 });
  }
}
