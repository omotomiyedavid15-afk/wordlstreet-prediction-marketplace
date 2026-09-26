import type { ButtonHTMLAttributes, ComponentType, ReactNode } from "react";
import type { Side } from "./anchor";
import { Spinner, type SpinnerSize } from "./Spinner";
import { Tooltip } from "./Tooltip";

export type ButtonVariant =
  | "primary"
  | "danger"
  | "danger-tonal"
  | "contrast"
  | "tonal"
  | "secondary"
  | "ghost";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonShape = "default" | "pill";

/* Gold is the only fill a primary action ever gets, in every one of the eight modes.
   A domain accent may sit around a button — a ring, a tag, a label beside it — but
   filling it with the mode colour would make "which mode am I in" and "what is the
   main action here" the same signal.

   Filled variants carry .ws-pressable: a restrained sheen and press response. Buttons
   stay shadowless across every variant so hierarchy comes from fill, border and colour. */
const variants: Record<ButtonVariant, string> = {
  primary:
    "ws-pressable bg-action-primary text-text-on-accent hover:bg-action-primary-hover",
  danger: "ws-pressable bg-feedback-danger text-text-on-danger hover:brightness-110",
  /* The destructive action that is not the main one — Delete beside Done. Red enough to
     say what it does, quiet enough that the eye lands on the primary first. The tonal
     error pair, measured at 5.5:1 or better in both themes. */
  "danger-tonal": "ws-pressable-flat bg-tonal-error text-tonal-error-text hover:brightness-110",
  // Tonal sits between primary and secondary: enough weight to be found, not enough to
  // be mistaken for the main action. It is the answer to "I need two of these".
  tonal:
    "ws-pressable-flat bg-action-primary-tonal text-action-primary-text hover:bg-action-primary-tonal-hover",
  /* A neutral inversion, for actions sitting on a dark or already-coloured surface where
     gold would compete and an outline would disappear. It is the loudest thing that is
     not the brand colour, which is exactly what an urgent recovery action needs. */
  contrast:
    "ws-pressable-flat bg-text-primary text-surface-sunken hover:opacity-90",
  secondary:
    "ws-pressable-flat border border-border-default bg-surface-base text-text-primary hover:border-border-strong hover:bg-surface-raised",
  ghost:
    "ws-pressable-flat text-text-secondary hover:bg-surface-base hover:text-text-primary",
};

// Heights come from the core size scale; padding from the space scale.
const sizes: Record<ButtonSize, string> = {
  sm: "h-7 gap-1.5 px-3 text-[12.5px]",
  md: "h-9 gap-2 px-4 text-[13.5px]",
  lg: "h-11 gap-2 px-5 text-[14px]",
};

// Square, so the glyph sits on the optical centre in both axes.
const iconOnlySizes: Record<ButtonSize, string> = {
  sm: "size-7",
  md: "size-9",
  lg: "size-11",
};

/* Radius steps up with height so the corner stays proportional rather than constant —
   8px on a 28px control and 8px on a 44px one do not read as the same shape.
   Pill takes radius-full instead. It is a shape, not a variant: any variant can be a
   pill, and it changes what the button feels like without changing what it means.
   Pills need a little more horizontal padding, because the curve eats into the space
   beside the label. */
const radii: Record<ButtonSize, string> = {
  sm: "rounded-md",
  md: "rounded-md",
  lg: "rounded-lg",
};

const pillPadding: Record<ButtonSize, string> = {
  sm: "px-3.5",
  md: "px-5",
  lg: "px-6",
};

const glyphs: Record<ButtonSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-[18px]",
};

/* The loading glyph is the Spinner ring at its inline steps — 16px up to md, 20px on lg —
   so a button and a table cell mid-refresh show the same spinner. It carries no label of
   its own: the button's aria-busy already says so. */
const spinnerSizes: Record<ButtonSize, SpinnerSize> = { sm: "sm", md: "sm", lg: "md" };

const base =
  "ws-control-button inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap shadow-none! transition-[background-color,border-color,color] duration-150 disabled:pointer-events-none disabled:opacity-40 aria-busy:pointer-events-none aria-busy:opacity-40";

export function Button({
  variant = "secondary",
  size = "md",
  shape = "default",
  prefixIcon: PrefixIcon,
  suffixIcon: SuffixIcon,
  loading = false,
  disabled,
  children,
  className = "",
  onClick,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** `pill` swaps the corner for radius-full. Any variant may be a pill. */
  shape?: ButtonShape;
  /** Leading glyph. Identifies *what the action is* — a plus for create, a trash for
   *  delete. Heroicons solid, because a button is chrome that carries state. */
  prefixIcon?: ComponentType<{ className?: string }>;
  /** Trailing glyph. Says *what happens next* — a chevron for a menu, an arrow for a
   *  step forward, an external mark for a new tab. Never a second copy of the prefix. */
  suffixIcon?: ComponentType<{ className?: string }>;
  loading?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      // A loading button ignores presses so the action cannot fire twice, and keeps its
      // label so the row does not resize. It is aria-disabled rather than disabled: a
      // disabled button drops keyboard focus to the page, and someone who just pressed
      // Save would lose their place for the length of the request.
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={loading ? (e) => e.preventDefault() : onClick}
      className={`${base} ${sizes[size]} ${shape === "pill" ? `rounded-full ${pillPadding[size]}` : radii[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {loading ? (
        <Spinner size={spinnerSizes[size]} label={null} />
      ) : PrefixIcon ? (
        <PrefixIcon className={`${glyphs[size]} shrink-0`} />
      ) : null}
      {children}
      {SuffixIcon ? <SuffixIcon className={`${glyphs[size]} shrink-0`} /> : null}
    </button>
  );
}

/** A button whose only content is a glyph. `label` is required rather than optional:
 *  an icon-only control with no accessible name is invisible to a screen reader, and
 *  making the prop mandatory means that cannot ship by accident. It doubles as the
 *  tooltip — the system Tooltip, not the browser's title — so sighted users get the same
 *  name on hover and keyboard focus, with `shortcut` beside it when there is one. */
export function IconButton({
  variant = "ghost",
  size = "md",
  shape = "default",
  icon: Icon,
  label,
  loading = false,
  disabled,
  className = "",
  onClick,
  shortcut,
  tooltipSide = "top",
  tooltip = true,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** `pill` makes the square button a circle. */
  shape?: ButtonShape;
  icon: ComponentType<{ className?: string }>;
  label: string;
  loading?: boolean;
  /** Shown as a key chip beside the label in the tooltip — "⌘B". */
  shortcut?: string;
  tooltipSide?: Side;
  /** Off when something else already labels it on hover — a toggletip's own (i). */
  tooltip?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">) {
  const button = (
    <button
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={loading ? (e) => e.preventDefault() : onClick}
      aria-label={label}
      aria-keyshortcuts={shortcut ? shortcut.replace("⌘", "Meta+").replace("⌥", "Alt+").replace("⇧", "Shift+").replace(/\s+/g, "") : undefined}
      className={`${base} ${iconOnlySizes[size]} ${shape === "pill" ? "rounded-full" : radii[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {loading ? <Spinner size={spinnerSizes[size]} label={null} /> : <Icon className={`${glyphs[size]} shrink-0`} />}
    </button>
  );
  // The label is already the accessible name, so the tooltip does not describe it again.
  return tooltip ? (
    <Tooltip content={label} shortcut={shortcut} side={tooltipSide} describe={false}>
      {button}
    </Tooltip>
  ) : (
    button
  );
}
