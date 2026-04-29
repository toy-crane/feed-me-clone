"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // next-themes hydration gate: avoid icon mismatch on first paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  function handleToggle() {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="다크모드 토글"
      onClick={handleToggle}
    >
      {mounted && resolvedTheme === "dark" ? <MoonIcon /> : <SunIcon />}
    </Button>
  );
}
