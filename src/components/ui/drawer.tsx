"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Mobile-only slide-in drawer. Desktop renders the trigger as nothing —
 * callers gate the trigger with `md:hidden` and reuse their desktop layout.
 */
export function Drawer({
  trigger,
  children,
  label = "Menu",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Close on route change: popstate fires for client-side navigations via
  // link clicks too, but Next re-renders; simplest reliable signal is
  // pathname-independent — close when any drawer link is clicked.
  function closeOnClickPanel(event: React.MouseEvent) {
    if ((event.target as HTMLElement).closest("a")) setOpen(false);
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label={label}>
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line bg-subtle p-4 shadow-e3",
            )}
            onClick={closeOnClickPanel}
          >
            <div className="mb-4 flex items-center justify-between px-2">
              <p className="text-lg font-semibold tracking-tight text-content">Link</p>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-base"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
