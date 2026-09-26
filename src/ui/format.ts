/* Number formatting for money and market data. One place, so a table, a toast and a
   balance card cannot disagree about how ₦212,904.00 is written.

   Two things this exists to get right:
   - The currency sign. `Intl` with a plain "symbol" display writes NGN as "NGN 1,000.00"
     in most locales; "narrowSymbol" gives "₦1,000.00". The glyph itself renders because
     index.html loads a one-codepoint Noto Sans subset for U+20A6 — Instrument Sans has
     no Naira sign, and without that subset the browser falls back mid-word.
   - The minus. A negative amount takes U+2212 (−), the typographic minus, not the
     hyphen-minus Intl emits: the hyphen is shorter and sits lower, so in a right-aligned
     column of tabular figures a debit's sign looks like a stray dash. */

export type CurrencyCode = "NGN" | "USD" | "EUR" | "GBP" | "USDT";

const MINUS = "−";

const cache = new Map<string, Intl.NumberFormat>();
function nf(key: string, make: () => Intl.NumberFormat) {
  let f = cache.get(key);
  if (!f) cache.set(key, (f = make()));
  return f;
}

/** "₦6,789,012.00", "−$1,240.50", "+₦40,000.00" (with `sign: "always"`).
 *  USDT is not an ISO code, so it is written as a suffix: "1,250.00 USDT". */
export function formatMoney(
  amount: number,
  currency: CurrencyCode,
  { sign = "negative", decimals = 2 }: { sign?: "negative" | "always"; decimals?: number } = {},
) {
  const abs = Math.abs(amount);
  const body =
    currency === "USDT"
      ? `${formatNumber(abs, decimals)} USDT`
      : nf(`${currency}:${decimals}`, () =>
          new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            currencyDisplay: "narrowSymbol",
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }),
        ).format(abs);
  const lead = amount < 0 ? MINUS : sign === "always" && amount > 0 ? "+" : "";
  return lead + body;
}

/** Grouped figures with a fixed number of decimals, typographic minus. */
export function formatNumber(value: number, decimals = 2) {
  const s = nf(`n:${decimals}`, () =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
  ).format(Math.abs(value));
  return value < 0 ? MINUS + s : s;
}

/** The sign alone — "₦", "$", "€". USDT has none; it is written as a suffix. */
export function currencySymbol(currency: CurrencyCode) {
  return currency === "USDT" ? "" : formatMoney(0, currency).replace(/[\d.,\s]/g, "");
}

/** Decimal places implied by a step: 0.001 → 3, 5 → 0. */
export function decimalsOf(step: number) {
  const s = String(step);
  return s.includes("e-") ? Number(s.split("e-")[1]) : (s.split(".")[1]?.length ?? 0);
}

/** Formats an amount while it is being typed: groups the whole part with commas, keeps
 *  one decimal point, caps the decimals, and says where the caret belongs afterwards.
 *
 *  The caret is tracked by counting the characters that carry meaning — digits and the
 *  point — to its left, then walking the new string to the same count. Commas coming and
 *  going around it never make it jump. */
export function reformatAmount(raw: string, caret: number, decimals = 2) {
  let clean = "";
  let before = 0;
  let dot = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const keep = /\d/.test(ch) || (ch === "." && !dot && decimals > 0);
    if (!keep) continue;
    if (ch === ".") dot = true;
    clean += ch;
    if (i < caret) before++;
  }
  let [whole, frac] = clean.split(".") as [string, string | undefined];
  const stripped = whole.length - whole.replace(/^0+(?=\d)/, "").length;
  whole = whole.slice(stripped);
  before -= Math.min(stripped, before);
  if (whole === "" && frac !== undefined) {
    whole = "0"; // ".5" reads as "0.5"
    if (before > 0) before++;
  }
  // More decimals than allowed. Reported, so a caller can refuse a keystroke that would
  // have cut digits off (a point typed mid-number) instead of silently truncating.
  const overflow = frac !== undefined && frac.length > decimals;
  if (frac !== undefined) frac = frac.slice(0, decimals);

  const text = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (frac !== undefined ? `.${frac}` : "");
  let pos = 0;
  for (let seen = 0; pos < text.length && seen < before; pos++) if (text[pos] !== ",") seen++;
  const value = whole === "" ? null : Number(`${whole}.${frac ?? ""}`);
  return { text, caret: Math.min(pos, text.length), value, overflow };
}

/** "Just now", "6 min ago", "3h ago", "2d ago", then the date. `now` is injectable so a
 *  demo or a test can pin the clock. */
export function relativeTime(iso: string, now = Date.now()) {
  const seconds = Math.round((now - new Date(iso).getTime()) / 1000);
  if (seconds < 45) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days}d ago` : formatDate(iso);
}

/** "+2.41%" / "−0.87%" — for Trend Pills, which expect the value already signed. */
export function formatPercent(value: number, decimals = 2) {
  const s = formatNumber(Math.abs(value), decimals);
  return `${value < 0 ? MINUS : value > 0 ? "+" : ""}${s}%`;
}

/** Splits a formatted amount into its whole part and its minor units, so a ledger column
 *  can set the kobo/cents quieter than the naira/dollars. "₦6,789,012.00" →
 *  ["₦6,789,012", ".00"]. A suffix like " USDT" stays with the minor part. */
export function splitMinor(formatted: string): [string, string] {
  const i = formatted.lastIndexOf(".");
  return i === -1 ? [formatted, ""] : [formatted.slice(0, i), formatted.slice(i)];
}

// Written out by hand rather than through Intl: en-GB now abbreviates September as
// "Sept", which breaks the three-letter rhythm of a date column.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");

export function formatDate(iso: string, { year = true }: { year?: boolean } = {}) {
  const d = new Date(iso);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]}${year ? ` ${d.getFullYear()}` : ""}`;
}

/** "29 Sep 2026, 22:15" — day first, 24-hour, the way the rest of WorldStreet writes it.
 *  Numeric month-first dates (09-29-2026) are ambiguous to a Nigerian reader. */
export function formatDateTime(iso: string, { year = true }: { year?: boolean } = {}) {
  const d = new Date(iso);
  return `${formatDate(iso, { year })}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
