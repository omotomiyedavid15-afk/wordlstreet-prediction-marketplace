import type { CSSProperties } from "react";
import type { Domain } from "./Badge";

/* Loading, in three families that must not be confused for one another:

   - Wait states — Spinner (ring, ticks, pulse, bounce). A short wait with no known end:
     a button press, a field lookup, a figure recalculating. Anything with stages, a
     known duration, or steps someone should watch go by is a Progress Bar, not this.
   - Live status — LiveDot. Not a wait at all: "this is connected / this is on air".
   - Skeleton — shimmer / Skeleton. The shape of content that is about to arrive.

   Colour is currentColor throughout, so a spinner inside a primary button is on-accent
   ink, inside a tonal one it is the tonal text, and on a plain surface it is whatever the
   text around it is. `accent` is the one override, for a spinner that sits on a mode's
   own screen — it reads the mode's accent token; there is no hex in this file.

   Every animation has a still form under reduced motion that still reads as loading, not
   as a frame that stopped: the ring becomes a dimmed dashed ring, the ticks a dimmed
   burst, the dots a stepped ellipsis, the ping a fixed halo. The `still:` variant (app.css)
   matches the OS setting and also anything inside [data-still], so the docs can show them. */

export type SpinnerVariant = "ring" | "ticks" | "pulse" | "bounce";
export type SpinnerSize = "sm" | "md" | "lg" | "xl";

/* One scale for every context, so an icon-only button, a modal body and a page are the
   same component at a different step. The stroke is set in pixels and converted into the
   24-unit viewBox, so the line weight is chosen per size rather than scaling with it. */
const px: Record<SpinnerSize, number> = { sm: 16, md: 20, lg: 24, xl: 40 };
const ringStroke: Record<SpinnerSize, number> = { sm: 2, md: 2, lg: 2.5, xl: 3.5 };
const tickStroke: Record<SpinnerSize, number> = { sm: 1.5, md: 1.75, lg: 2, xl: 3 };
const dot: Record<SpinnerSize, number> = { sm: 4, md: 5, lg: 6, xl: 9 };

/* Core Finance runs on gold, so its "accent" is the gold used as ink — the fill gold is
   too light on white to carry a 2px line. Every other mode reads its own accent token. */
export const accentInk: Record<Domain, string> = {
  finance: "text-action-primary-text",
  social: "text-domain-social",
  vivid: "text-domain-vivid",
  xstream: "text-domain-xstream",
  marketplace: "text-domain-marketplace",
  vision: "text-domain-vision",
  academy: "text-domain-academy",
  prediction: "text-domain-prediction",
};

export function Spinner({
  variant = "ring",
  size = "sm",
  label = "Loading",
  accent,
  still = false,
  className = "",
}: {
  variant?: SpinnerVariant;
  size?: SpinnerSize;
  /** Read out by a screen reader through role="status". Pass null when the element
   *  around the spinner already says it is busy — a Button with aria-busy, a "Searching…"
   *  line — so it is not announced twice. */
  label?: string | null;
  /** The mode accent, for a spinner sitting on that mode's own screen. Leave it off
   *  everywhere else and the spinner takes the colour of the text around it. */
  accent?: Domain;
  /** Hold the still form — for the ring, the dimmed dashed ring — as a static "pending"
   *  glyph: a setup task not done yet. Nothing is loading, so pair it with label={null}. */
  still?: boolean;
  className?: string;
}) {
  const s = px[size];
  return (
    <span
      role={label ? "status" : undefined}
      aria-hidden={label ? undefined : true}
      data-still={still || undefined}
      className={`ws-spinner inline-flex shrink-0 items-center justify-center ${accent ? accentInk[accent] : ""} ${className}`}
    >
      {variant === "ring" ? (
        <Ring s={s} stroke={ringStroke[size]} />
      ) : variant === "ticks" ? (
        <Ticks s={s} stroke={tickStroke[size]} />
      ) : (
        <Dots s={s} d={dot[size]} kind={variant} />
      )}
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}

/* A faint full track with a quarter arc sweeping it — linear, because constant motion
   means "still working" and an eased sweep would read as arriving somewhere. */
function Ring({ s, stroke }: { s: number; stroke: number }) {
  const w = (stroke * 24) / s;
  const r = 12 - w / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" aria-hidden="true" className="block animate-spin still:animate-none">
      <circle
        cx="12"
        cy="12"
        r={r}
        stroke="currentColor"
        strokeWidth={w}
        className="opacity-25 still:opacity-55 still:[stroke-dasharray:var(--dash)]"
        style={{ "--dash": `${c / 24} ${c / 24}` } as CSSProperties}
      />
      <circle cx="12" cy="12" r={r} stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeDasharray={`${c * 0.28} ${c}`} className="still:hidden" />
    </svg>
  );
}

/* Twelve spokes, graded from faint to full, turned one spoke at a time with steps(12) —
   the head jumps rather than glides, which is what makes it read as mechanical and
   precise next to the ring's smooth sweep. Still, every spoke drops to one even weight. */
function Ticks({ s, stroke }: { s: number; stroke: number }) {
  const w = (stroke * 24) / s;
  const outer = 12 - w / 2;
  const inner = 6.5;
  return (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
      fill="none"
      stroke="currentColor"
      strokeWidth={w}
      strokeLinecap="round"
      aria-hidden="true"
      className="block animate-[spin_1s_steps(12)_infinite] still:animate-none"
    >
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          x1="12"
          y1={12 - inner}
          x2="12"
          y2={12 - outer}
          transform={`rotate(${i * 30} 12 12)`}
          strokeOpacity={0.12 + (0.88 * (i + 1)) / 12}
          className="still:[stroke-opacity:0.5]"
        />
      ))}
    </svg>
  );
}

/* Three dots in a box as tall as the spinner would be, so a bounce never pushes the line
   it sits in and swapping variants never changes the row height. */
function Dots({ s, d, kind }: { s: number; d: number; kind: "pulse" | "bounce" }) {
  return (
    <span aria-hidden="true" className={`flex items-center ${kind === "pulse" ? "ws-dots-pulse" : "ws-dots-bounce"}`} style={{ height: s, gap: d * 0.6 }}>
      <span className="block rounded-full bg-current" style={{ width: d, height: d }} />
      <span className="block rounded-full bg-current" style={{ width: d, height: d }} />
      <span className="block rounded-full bg-current" style={{ width: d, height: d }} />
    </span>
  );
}

/* ------------------------------------------------------------ Live status ---- */

export type LiveTone = "success" | "warning" | "danger" | "neutral";

const liveInk: Record<LiveTone, string> = {
  success: "text-feedback-success",
  warning: "text-feedback-warning",
  danger: "text-feedback-danger",
  neutral: "text-text-tertiary",
};

/** A solid dot with a ring rippling out of it: something is live right now — a market
 *  taking bids, a stream on air, a price feed connected. It is a status, not a wait, and
 *  it never stands in for a spinner. Colour is a feedback tone because "live" is a state;
 *  a mode accent never carries meaning. `active={false}` stops the ripple — a feed that
 *  has dropped should look still, not busy. */
export function LiveDot({
  tone = "success",
  active = true,
  size = "md",
  label,
  className = "",
}: {
  tone?: LiveTone;
  active?: boolean;
  size?: "sm" | "md";
  /** Only when nothing beside the dot says what it means. Usually the word next to it
   *  ("Live", "Connected") is the label and the dot is decoration. */
  label?: string;
  className?: string;
}) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`relative inline-flex shrink-0 ${size === "sm" ? "size-1.5" : "size-2"} ${liveInk[tone]} ${className}`}
    >
      {active ? <span className="ws-ping absolute inset-0 rounded-full border border-current" /> : null}
      <span className="relative block size-full rounded-full bg-current" />
    </span>
  );
}

/* --------------------------------------------------------------- Skeleton ---- */

/** The shimmer: one gradient fixed to the viewport, so every placeholder on screen shows a
 *  slice of the same band — the wave crosses a whole table or card as one, instead of each
 *  bar pulsing on its own. Still, it is the flat tint alone. */
export const shimmer =
  "bg-text-primary/[0.07] bg-[linear-gradient(100deg,transparent_30%,color-mix(in_srgb,var(--ws-text-primary)_7%,transparent)_50%,transparent_70%)] bg-[length:200vw_100%] bg-fixed animate-[ws-shimmer_1.6s_linear_infinite] still:animate-none";

/** One placeholder block. Give it the size and corner of what it stands in for — a line
 *  is `h-2.5 rounded-full`, an avatar `size-8 rounded-full`, a thumbnail `rounded-lg`.
 *  Hidden from assistive tech: the container says it is loading (aria-busy + a status
 *  line), a hundred empty shapes do not. */
export function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" className={`block ${shimmer} ${className}`} style={style} />;
}
