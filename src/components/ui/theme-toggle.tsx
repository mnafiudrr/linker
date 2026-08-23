"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const STORAGE_KEY = "theme";

export function ThemeToggle({ className }: { className?: string }) {
  // Render an inert placeholder until mounted so SSR markup matches and the
  // icon reflects the real (localStorage-applied) theme.
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      onClick={toggle}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-subtle",
        className,
      )}
    >
      {/* Server render and pre-mount show a neutral glyph; swaps after mount. */}
      {theme === "dark" ? "☀️" : theme === "light" ? "🌙" : "🌓"}
    </button>
  );
}
