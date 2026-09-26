import { ArrowPathIcon, CheckIcon } from "@heroicons/react/20/solid";
import type { ComponentType, ReactNode } from "react";

/* The step-state language, shared by the Stepper Toast, the horizontal step row and the
   vertical stepper. Three states, and each is carried by shape before colour:

     done      a filled disc with a check
     current   a ring around the step's number, dot or icon
     upcoming  an empty disc, the glyph in muted ink

   A step never announces its state by hue alone — in greyscale, or to someone who cannot
   tell gold from grey, the check, the ring and the empty disc still read. */

export type StepState = "done" | "current" | "upcoming";

/** State of step `index` when `current` is the active one. Both are zero-based; a
 *  `current` past the last step means the whole sequence is done. */
export function stepState(index: number, current: number): StepState {
  return index < current ? "done" : index === current ? "current" : "upcoming";
}

export const stepStateLabel: Record<StepState, string> = {
  done: "Completed",
  current: "Current step",
  upcoming: "Not started",
};

type Glyph = ComponentType<{ className?: string }>;

/* Colour changes run on the standard curve; the glyph swap also scales and un-blurs, so
   a check arriving reads as the number turning into it rather than two icons trading
   places. Both glyphs stay mounted and cross-fade — no enter/exit bookkeeping. */
const swap =
  "col-start-1 row-start-1 transition-[opacity,scale,filter] duration-[var(--ws-duration-base)] ease-[var(--ws-ease-standard)]";

/** The glyph inside a step marker: a check once done, otherwise the step's icon or its
 *  number. The Stepper Toast drops this straight into its tone disc. */
export function StepGlyph({
  state,
  number,
  icon: Icon,
  className = "size-3.5",
  numberClassName = "text-[11px]",
}: {
  state: StepState;
  /** One-based. Shown when there is no icon. */
  number?: number;
  icon?: Glyph;
  className?: string;
  numberClassName?: string;
}) {
  const done = state === "done";
  const off = "scale-[0.25] opacity-0 blur-[4px]";
  const on = "scale-100 opacity-100 blur-[0px]";
  return (
    <span aria-hidden="true" className="grid place-items-center">
      <CheckIcon className={`${swap} ${className} ${done ? on : off}`} />
      <span className={`${swap} grid place-items-center ${done ? off : on}`}>
        {Icon ? (
          <Icon className={className} />
        ) : number !== undefined ? (
          <span className={`font-semibold leading-none tabular-nums ${numberClassName}`}>
            {number}
          </span>
        ) : (
          // No number, no icon: the dot style from the reference's step row, where an
          // upcoming step is an empty circle and only the current one carries a dot.
          <span
            className={`size-2 rounded-full bg-current ${swap} ${state === "upcoming" ? off : on}`}
          />
        )}
      </span>
    </span>
  );
}

export type StepMarkerSize = "sm" | "md" | "lg";

// Off the core size scale: xs 20, sm 28, md 36.
const markerBox: Record<StepMarkerSize, string> = {
  sm: "size-5",
  md: "size-7",
  lg: "size-9",
};
const markerGlyph: Record<StepMarkerSize, { icon: string; number: string }> = {
  sm: { icon: "size-3", number: "text-[10px]" },
  md: { icon: "size-3.5", number: "text-[12px]" },
  lg: { icon: "size-[18px]", number: "text-[13.5px]" },
};

/* Gold marks progress, the same fill the linear bar uses. The current ring carries a
   soft halo so it still separates from a done disc when both are gold and adjacent. */
const markerSkin: Record<StepState, string> = {
  done: "border-action-primary bg-action-primary text-text-on-accent",
  current:
    "border-action-primary bg-surface-base text-action-primary-text ring-4 ring-action-primary/15",
  upcoming: "border-border-default bg-surface-base text-text-tertiary",
};

/** A step's disc. `busy` adds a turning arc around the current ring — the live state from
 *  the wallet-confirmation reference, for a step that is waiting on something outside the
 *  app (a signature, a block confirmation). */
export function StepMarker({
  state,
  number,
  icon,
  size = "md",
  busy = false,
  delay,
}: {
  state: StepState;
  number?: number;
  icon?: Glyph;
  size?: StepMarkerSize;
  busy?: boolean;
  /** Holds the colour change back so a connector can finish drawing into the marker
   *  before it lights. */
  delay?: string;
}) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center rounded-full border-[1.5px] transition-[background-color,border-color,color,box-shadow] duration-[var(--ws-duration-base)] ease-[var(--ws-ease-standard)] ${markerBox[size]} ${markerSkin[state]}`}
      style={{ transitionDelay: delay }}
    >
      <StepGlyph
        state={state}
        number={number}
        icon={icon}
        className={markerGlyph[size].icon}
        numberClassName={markerGlyph[size].number}
      />
      {busy && state === "current" ? (
        <span
          aria-hidden="true"
          className="absolute -inset-[5px] animate-spin rounded-full border-2 border-transparent border-t-action-primary motion-reduce:animate-none"
        />
      ) : null}
    </span>
  );
}

/** The live status line under a step: a spinner while the step is waiting, the text, and
 *  an optional right-aligned counter. The Stepper Toast, the step row and the vertical
 *  stepper all use this one line, so "waiting for confirmation" looks the same wherever
 *  a transaction is being walked through. It is not a live region itself — the surface
 *  around it decides that, so a Toast does not end up with two nested ones. */
export function StepStatus({
  busy = false,
  trailing,
  tone = "muted",
  children,
  className = "",
}: {
  busy?: boolean;
  trailing?: ReactNode;
  /** `accent` sets the text in gold, for a status under the current step itself. */
  tone?: "muted" | "accent";
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`flex items-center gap-2 text-[12.5px] leading-snug ${
        tone === "accent" ? "text-action-primary-text" : "text-text-tertiary"
      } ${className}`}
    >
      {busy ? (
        <ArrowPathIcon
          className="size-3.5 shrink-0 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      ) : null}
      <span className="min-w-0">{children}</span>
      {trailing ? (
        <span className="ml-auto shrink-0 text-[11px] tabular-nums text-text-tertiary">
          {trailing}
        </span>
      ) : null}
    </p>
  );
}
