import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-300 text-on-primary font-medium hover:bg-primary-400 active:scale-[0.98]",
  secondary:
    "bg-base text-content border border-line hover:bg-subtle active:scale-[0.98]",
  ghost: "text-content-secondary hover:bg-subtle hover:text-content",
  danger: "text-danger border border-danger/40 hover:bg-danger-bg",
};

export function Button({
  variant = "secondary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-primary-300 dark:focus-visible:ring-primary-400 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
