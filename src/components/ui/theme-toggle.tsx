"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

const STORAGE_KEY = "theme";

export function ThemeToggle({ className }: { className?: string }) {
  // Lazy init reads the class applied pre-paint by the inline script in the
  // root layout; suppressHydrationWarning covers the SSR (light) default.
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
  );

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable — theme still applies for this page view.
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      onClick={toggle}
      suppressHydrationWarning
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-subtle",
        className,
      )}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
