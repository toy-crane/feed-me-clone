"use client";

import { useState, type FormEvent } from "react";
import { ArrowRightIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldDescription } from "@/components/ui/field";
import { isValidHttpUrl } from "@/lib/core/url";

const VALIDATION_HINT = "올바른 URL을 입력해 주세요";

type UrlInputProps = {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  initialValue?: string;
};

export function UrlInput({
  onSubmit,
  isLoading,
  initialValue = "",
}: UrlInputProps) {
  const [value, setValue] = useState(initialValue);
  const [showHint, setShowHint] = useState(false);

  const trimmed = value.trim();
  const isEmpty = trimmed.length === 0;
  const submitDisabled = isLoading || isEmpty;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    if (!isValidHttpUrl(value)) {
      setShowHint(true);
      return;
    }
    setShowHint(false);
    onSubmit(value);
  }

  function handleClear() {
    setValue("");
    setShowHint(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Field data-invalid={showHint || undefined}>
        <InputGroup>
          <InputGroupInput
            type="url"
            inputMode="url"
            autoComplete="off"
            aria-label="URL"
            aria-invalid={showHint || undefined}
            placeholder="https://..."
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (showHint) setShowHint(false);
            }}
            disabled={isLoading}
          />
          <InputGroupAddon align="inline-end">
            {value.length > 0 ? (
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                aria-label="입력 지우기"
                onClick={handleClear}
                disabled={isLoading}
              >
                <XIcon />
              </Button>
            ) : null}
            <Button
              type="submit"
              size="icon-sm"
              variant="default"
              aria-label="변환"
              disabled={submitDisabled}
            >
              {isLoading ? (
                <Spinner aria-label="변환 중" />
              ) : (
                <ArrowRightIcon />
              )}
            </Button>
          </InputGroupAddon>
        </InputGroup>
        {showHint ? (
          <FieldDescription className="text-destructive">
            {VALIDATION_HINT}
          </FieldDescription>
        ) : null}
      </Field>
    </form>
  );
}
