"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function Dialog({
  trigger,
  title,
  children,
  contentClassName,
}: {
  trigger: React.ReactNode;
  title: string;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  contentClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "w-full max-w-md rounded-xl border border-line bg-base p-6 text-content shadow-e3",
              contentClassName,
            )}
          >
            <h2 className="mb-4 text-lg font-semibold">{title}</h2>
            {typeof children === "function" ? children(close) : children}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function Field({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <div>
      <label htmlFor={props.id} className="mb-1 block text-xs font-medium">
        {label}
      </label>
      <input
        {...props}
        className="h-9 w-full rounded-lg border border-line bg-base px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-300 dark:focus-visible:ring-primary-400"
      />
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-xs text-danger">
      {message}
    </p>
  );
}
