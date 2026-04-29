"use client";

import { useState, type FormEvent } from "react";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldDescription } from "@/components/ui/field";

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    onSubmit(value);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Field>
        <InputGroup>
          <InputGroupInput
            type="url"
            inputMode="url"
            autoComplete="off"
            aria-label="URL"
            placeholder="https://..."
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={isLoading}
          />
          <InputGroupAddon align="inline-end">
            <Button
              type="submit"
              size="icon-sm"
              variant="default"
              aria-label="변환"
              disabled={isLoading}
            >
              {isLoading ? (
                <Spinner aria-label="변환 중" />
              ) : (
                <ArrowRightIcon />
              )}
            </Button>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription className="sr-only">
          URL을 입력하고 화살표를 누르세요
        </FieldDescription>
      </Field>
    </form>
  );
}
