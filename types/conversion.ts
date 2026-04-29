export type ConversionResult = {
  title: string;
  author?: string;
  sourceUrl: string;
  markdown: string;
};

export type ConversionError = {
  message: string;
};

export const GENERIC_CONVERSION_ERROR_MESSAGE =
  "변환에 실패했어요. 잠시 후 다시 시도해 주세요";
