export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Deterministic pastel tint derived from an id, for thumbnail fallbacks. */
export function tintForId(id: string) {
  const tints = ["bg-primary-50", "bg-subtle"];
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return tints[hash % tints.length];
}
