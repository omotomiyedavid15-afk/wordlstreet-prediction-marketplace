import { CheckBadgeIcon, ChevronDownIcon, UserIcon } from "@heroicons/react/24/solid";
import { useState, type ReactNode } from "react";
import { CountBadge, PresenceDot, type Presence } from "./Badge";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "square";

/* Sizes come off the core size scale. xs exists for dense rows — order history and
   leaderboards — where a 28px avatar would set the row height on its own. A photo at
   20px is hard to identify; initials stay legible, so xs rows usually want initials. */
const box: Record<AvatarSize, string> = {
  xs: "size-5 text-[8px]",
  sm: "size-7 text-[10px]",
  md: "size-9 text-[12px]",
  lg: "size-11 text-[14px]",
  xl: "size-14 text-[18px]",
};

const glyph: Record<AvatarSize, string> = {
  xs: "size-3",
  sm: "size-3.5",
  md: "size-[18px]",
  lg: "size-5",
  xl: "size-7",
};

// A squared avatar keeps a proportional corner rather than a constant one, the same
// rule the Radius foundation sets: 8px on a 20px box is nearly a circle.
const corner: Record<AvatarSize, string> = {
  xs: "rounded-[5px]",
  sm: "rounded-md",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
};

export function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* Illustrated placeholders. Ten hand-drawn personas shipped as assets rather than
   generated — a real illustration set beats a procedural one for a small fixed cast,
   and it keeps the faces on-brand instead of on-library.

   The pick is deterministic: the same seed always lands on the same face, so a user
   does not change appearance between renders or between sessions. */
const personas = Object.values(
  import.meta.glob<string>("./avatars/persona-*.svg", {
    eager: true,
    query: "?url",
    import: "default",
  }),
).sort();

// FNV-1a. Small, stable across runs, and good enough to spread ten buckets evenly —
// Math.random() would give a different face on every render, and a naive charCode sum
// would collide on anagrams like "Bakare Adunni" and "Adunni Bakare".
function seedIndex(seed: string, buckets: number) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h) % buckets;
}

export function personaFor(seed: string) {
  return personas[seedIndex(seed, personas.length)];
}

/** The persona at a fixed position, for a caller that needs to hand out distinct faces —
 *  a table where two rows sharing a face would read as a duplicate record. */
export function personaAt(index: number) {
  return personas[((index % personas.length) + personas.length) % personas.length];
}

export const personaCount = personas.length;

/* Initials get a colour, picked from the same seed. A column of identical grey circles
   reads as missing data; varied tints read as people. Gold plus the seven mode accents,
   at 30% over the surface with neutral text on top — measured, the worst pairing in that
   set is 6.9:1 in dark and 10.3:1 in light. Accent-coloured text on its own tint was the
   obvious alternative and it fails at 3.1:1, so the label stays neutral.

   These are decorative, not semantic: the colour identifies a person, it never means the
   person belongs to that mode. */
const initialsTones = [
  "bg-action-primary/30",
  "bg-domain-social/30",
  "bg-domain-vivid/30",
  "bg-domain-xstream/30",
  "bg-domain-marketplace/30",
  "bg-domain-vision/30",
  "bg-domain-academy/30",
  "bg-domain-prediction/30",
];

export function initialsToneFor(seed: string) {
  return initialsTones[seedIndex(`tone:${seed}`, initialsTones.length)];
}

export function Avatar({
  src,
  name,
  size = "md",
  shape = "circle",
  /** Falls back to a generated illustration instead of the person glyph. For anonymous
   *  and demo users, where a grey silhouette repeated down a list reads as broken. */
  illustrated = false,
  loading = false,
  className = "",
}: {
  src?: string;
  /** Drives the initials, the alt text, and the illustration seed. */
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  illustrated?: boolean;
  loading?: boolean;
  className?: string;
}) {
  // A broken URL must not surface the browser's broken-image glyph, so a failed load
  // drops back into the same chain as a missing one.
  const [failed, setFailed] = useState(false);
  const illustration = personaFor(name || "anonymous");

  const radius = shape === "circle" ? "rounded-full" : corner[size];

  const initials = name ? initialsFrom(name) : "";
  const showImage = src && !failed;
  const showIllustration = !showImage && illustrated;
  const showInitials = !showImage && !showIllustration && initials.length > 0;

  /* Light theme collapses surface base, raised and overlay all to white, so a plain
     raised fill would be an invisible circle on a card. Initials carry their own tint;
     the glyph fallback takes a border so it still has an edge in either theme. */
  const fill = showInitials
    ? `${initialsToneFor(name ?? "")} text-text-primary`
    : showImage || showIllustration
      ? "bg-surface-raised"
      : "border border-border-default bg-surface-raised text-text-tertiary";

  const frame = `relative inline-flex shrink-0 items-center justify-center overflow-hidden font-semibold select-none ${fill} ${box[size]} ${radius} ${className}`;

  return (
    <span className={frame}>
      {showImage ? (
        <img
          src={src}
          alt={name ?? ""}
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : showIllustration ? (
        <img src={illustration} alt={name ?? ""} className="size-full object-cover" />
      ) : showInitials ? (
        <span aria-hidden="true">{initials}</span>
      ) : (
        <UserIcon className={glyph[size]} aria-hidden="true" />
      )}

      {/* The name still reaches a screen reader when the visual is initials or a glyph. */}
      {!showImage && !showIllustration && name ? <span className="sr-only">{name}</span> : null}

      {loading ? (
        <span
          aria-hidden="true"
          className={`absolute inset-0 animate-spin border-2 border-action-primary border-t-transparent ${radius}`}
        />
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------- Overlays ---- */

const overlayInset: Record<AvatarSize, string> = {
  xs: "-right-0.5 -bottom-0.5",
  sm: "-right-0.5 -bottom-0.5",
  md: "right-0 bottom-0",
  lg: "right-0 bottom-0",
  xl: "right-0.5 bottom-0.5",
};

/** Wraps an avatar and docks an indicator to it. Presence and verification sit on the
 *  bottom edge, counts on the top — the same split the Badge component documents, so an
 *  avatar can carry both without them colliding. */
export function AvatarIndicator({
  presence,
  verified = false,
  count,
  size = "md",
  children,
}: {
  presence?: Presence;
  verified?: boolean;
  count?: number;
  size?: AvatarSize;
  children: ReactNode;
}) {
  const ring = "ring-2 ring-surface-base";
  return (
    <span className="relative inline-flex">
      {children}
      {presence ? (
        <span className={`absolute ${overlayInset[size]} rounded-full ${ring}`}>
          <PresenceDot presence={presence} size={size === "xs" || size === "sm" ? "sm" : "md"} />
        </span>
      ) : null}
      {verified ? (
        <span className={`absolute ${overlayInset[size]} rounded-full ${ring}`}>
          <CheckBadgeIcon
            className={`${size === "xs" ? "size-3" : size === "xl" ? "size-5" : "size-4"} block text-feedback-info`}
            aria-label="Verified"
          />
        </span>
      ) : null}
      {count !== undefined && count > 0 ? (
        <span className={`absolute -top-1.5 -right-2 rounded-full ${ring}`}>
          <CountBadge count={count} size={size === "xs" || size === "sm" ? "sm" : "md"} />
        </span>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------- Compound rows ----- */

export function AvatarLabel({
  name,
  secondary,
  src,
  size = "md",
  illustrated,
}: {
  name: string;
  /** Handle, email, or role. Omit for a single-line row. */
  secondary?: string;
  src?: string;
  size?: AvatarSize;
  illustrated?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Avatar src={src} name={name} size={size} illustrated={illustrated} />
      <span className="min-w-0">
        <span className="block truncate text-[13px] text-text-primary">{name}</span>
        {secondary ? (
          <span className="block truncate text-[12px] text-text-tertiary">{secondary}</span>
        ) : null}
      </span>
    </span>
  );
}

/** The account-switcher trigger. Visual only — it becomes a real menu when a dropdown
 *  component exists to hang it on. */
export function AvatarMenu({
  name,
  handle,
  src,
  illustrated,
}: {
  name: string;
  handle: string;
  src?: string;
  illustrated?: boolean;
}) {
  return (
    <button
      type="button"
      className="ws-pressable-flat inline-flex items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors duration-150 hover:border-border-default hover:bg-surface-base"
    >
      <Avatar src={src} name={name} size="md" illustrated={illustrated} />
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-text-primary">{name}</span>
        <span className="block truncate text-[11.5px] text-text-tertiary">{handle}</span>
      </span>
      <ChevronDownIcon className="size-3.5 shrink-0 text-text-tertiary" />
    </button>
  );
}

/* ----------------------------------------------------------- Stacking ------ */

const overlap: Record<AvatarSize, string> = {
  xs: "-ml-1.5",
  sm: "-ml-2",
  md: "-ml-2.5",
  lg: "-ml-3",
  xl: "-ml-4",
};

export type AvatarGroupMember = { name: string; src?: string };

const stackRing: Record<AvatarSize, string> = {
  xs: "ring-2",
  sm: "ring-[3px]",
  md: "ring-[3px]",
  lg: "ring-4",
  xl: "ring-4",
};

/** Overlapping stack. Each avatar carries a ring in the surface colour so the faces read
 *  as separate on any background — without it the stack becomes one blurred shape. The
 *  ring thickens with the avatar, because a 2px gap between two 56px faces disappears.
 *  `overflow` renders a "+N" circle shaped like an avatar; `trailing` takes anything
 *  else — a plain count badge, or an add button — which read as different intents. */
export function AvatarGroup({
  members,
  max = 4,
  size = "md",
  overflow = true,
  trailing,
  illustrated,
  ringClass = "ring-surface-base",
}: {
  members: AvatarGroupMember[];
  max?: number;
  size?: AvatarSize;
  /** false when `trailing` supplies its own ending. */
  overflow?: boolean;
  trailing?: ReactNode;
  illustrated?: boolean;
  /** Must match the surface behind the stack. The default suits a card; a stack sitting
   *  directly on the page passes ring-surface-canvas, and one in the sidebar passes
   *  ring-surface-sunken. A ring in the wrong colour reads as an outline, not a gap. */
  ringClass?: string;
}) {
  const shown = members.slice(0, max);
  const rest = members.length - shown.length;

  // The ring goes on the avatar itself, not a wrapper. A wrapping span is display:inline
  // by default, so its box is text-sized and the ring draws in the wrong place — the
  // faces end up flush against each other with no gap at all.
  const ring = `${stackRing[size]} ${ringClass}`;

  return (
    <span className="inline-flex items-center">
      {shown.map((m, i) => (
        <Avatar
          key={m.name}
          src={m.src}
          name={m.name}
          size={size}
          illustrated={illustrated}
          className={`${ring} ${i === 0 ? "" : overlap[size]}`}
        />
      ))}

      {overflow && rest > 0 ? (
        <span
          className={`inline-flex shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-overlay font-semibold text-text-primary ${box[size]} ${ring} ${overlap[size]}`}
          aria-label={`${rest} more`}
        >
          +{rest}
        </span>
      ) : null}

      {trailing ? (
        <span className={`inline-flex shrink-0 rounded-full ${ring} ${overlap[size]}`}>
          {trailing}
        </span>
      ) : null}
    </span>
  );
}

/** The plain-badge ending from the reference: a grey circle carrying the overflow count,
 *  deliberately not avatar-shaped. AvatarGroup+ says "these are more people"; this says
 *  "there is a number left over". */
export function GroupOverflowBadge({
  count,
  size = "md",
}: {
  count: number;
  size?: AvatarSize;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-raised font-semibold text-text-secondary ${box[size]}`}
      aria-label={`${count} more`}
    >
      +{count}
    </span>
  );
}
