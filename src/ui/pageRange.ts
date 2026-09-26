/* Which page numbers a pagination shows. Pure, so it can be checked without a browser:
   node src/ui/pageRange.check.ts

   `boundaries` pages stay at each end, `siblings` sit either side of the current page, and
   everything else collapses to an ellipsis — except that an ellipsis never stands in for a
   single page: if only one page would be hidden, that number is shown instead. With the
   defaults (1 and 1) a long range is always exactly seven items wide, so the control does
   not change width as you page through it. */

export type PageItem = number | "start-ellipsis" | "end-ellipsis";

const span = (from: number, to: number) => (to < from ? [] : Array.from({ length: to - from + 1 }, (_, i) => from + i));

export function pageRange(page: number, count: number, siblings = 1, boundaries = 1): PageItem[] {
  if (count < 1) return [];
  const start = span(1, Math.min(boundaries, count));
  const end = span(Math.max(count - boundaries + 1, boundaries + 1), count);
  const from = Math.max(Math.min(page - siblings, count - boundaries - siblings * 2 - 1), boundaries + 2);
  const to = Math.min(Math.max(page + siblings, boundaries + siblings * 2 + 2), count - boundaries - 1);
  return [
    ...start,
    ...(from > boundaries + 2 ? (["start-ellipsis"] as const) : boundaries + 1 < count - boundaries ? [boundaries + 1] : []),
    ...span(from, to),
    ...(to < count - boundaries - 1 ? (["end-ellipsis"] as const) : count - boundaries > boundaries ? [count - boundaries] : []),
    ...end,
  ];
}

/** The page a free-typed value lands on: digits only, clamped into 1…count. */
export function resolvePage(raw: string, count: number): { page: number | null; note?: string } {
  const text = raw.trim();
  if (!text) return { page: null, note: "Enter a page number." };
  if (!/^\d+$/.test(text)) return { page: null, note: "Use digits only." };
  const n = Number(text);
  if (n < 1) return { page: 1, note: "Pages start at 1 — showing page 1." };
  if (n > count) return { page: count, note: `There are ${count} pages — showing page ${count}.` };
  return { page: n };
}
