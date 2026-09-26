import { CheckIcon, MinusIcon } from "@heroicons/react/16/solid";
import { useEffect, useRef, type ReactNode } from "react";
import { FieldLabel, FieldMessage, RequiredMark, describedBy, useFieldIds } from "./Field";

/* Checkbox, radio and switch — the controls that choose rather than type. All three are
   the native element underneath (a checkbox input, a radio input, a button with
   role="switch"), so the label, the keyboard and a screen reader work without help.
   What is drawn over them is gold when on: the one fill the system gives to "selected",
   the same gold as a selected table row. */

const box =
  "peer col-start-1 row-start-1 cursor-pointer appearance-none border bg-surface-base transition-[background-color,border-color,box-shadow] duration-[var(--ws-duration-instant)] disabled:cursor-not-allowed disabled:opacity-40";

/* ------------------------------------------------------------- Checkbox ---- */

/** The bare box: no label, for a table row or anywhere the label lives elsewhere. The
 *  one checkbox in the system — Table's row selection uses this too. */
export function CheckboxBox({
  checked,
  indeterminate = false,
  onChange,
  label,
  disabled,
  invalid,
  id,
  describedby,
  required,
  size = "md",
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name when there is no visible label — "Select Bola Smith". */
  label?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  describedby?: string;
  required?: boolean;
  size?: "sm" | "md";
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  const dim = size === "sm" ? "size-4 rounded-[5px]" : "size-[18px] rounded-[5px]";
  return (
    <span className={`relative inline-grid shrink-0 place-items-center ${size === "sm" ? "size-4" : "size-[18px]"}`}>
      <input
        ref={ref}
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        required={required}
        aria-required={required || undefined}
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={describedby}
        onChange={(e) => onChange(e.target.checked)}
        className={`${box} ${dim} ${
          invalid ? "border-feedback-danger" : "border-border-strong hover:border-text-secondary"
        } checked:border-action-primary checked:bg-action-primary indeterminate:border-action-primary indeterminate:bg-action-primary`}
      />
      <CheckIcon aria-hidden="true" className="pointer-events-none col-start-1 row-start-1 hidden size-3 text-text-on-accent peer-checked:block peer-indeterminate:hidden" />
      <MinusIcon aria-hidden="true" className="pointer-events-none col-start-1 row-start-1 hidden size-3 text-text-on-accent peer-indeterminate:block" />
    </span>
  );
}

/** A checkbox with its label on the right, an optional line of description under the
 *  label, and an error line under that. */
export function Checkbox({
  label,
  description,
  checked,
  indeterminate,
  onChange,
  disabled,
  error,
  required,
  id: providedId,
  className = "",
}: {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  id?: string;
  className?: string;
}) {
  const { id, messageId } = useFieldIds(providedId);
  const descId = `${id}-desc`;
  return (
    <div className={className}>
      <div className="flex gap-2.5">
        <span className="flex h-5 items-center">
          <CheckboxBox
            id={id}
            checked={checked}
            indeterminate={indeterminate}
            onChange={onChange}
            disabled={disabled}
            invalid={Boolean(error)}
            required={required}
            describedby={[description ? descId : "", error ? messageId : ""].filter(Boolean).join(" ") || undefined}
          />
        </span>
        <span className="min-w-0">
          <label
            htmlFor={id}
            className={`block cursor-pointer text-[13.5px] leading-5 ${disabled ? "cursor-not-allowed text-text-tertiary" : "text-text-primary"}`}
          >
            {label}
            {required ? <RequiredMark /> : null}
          </label>
          {description ? (
            <span id={descId} className="mt-0.5 block text-[12.5px] leading-snug text-text-tertiary">
              {description}
            </span>
          ) : null}
        </span>
      </div>
      {error ? (
        <div className="mt-1.5 pl-7">
          <FieldMessage id={messageId} error={error} />
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- Radio ---- */

export type RadioOption<V extends string> = {
  value: V;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  /** A leading visual: a flag or icon tile in a list, a preview on top of a card. */
  visual?: ReactNode;
  /** Trailing content in a list or card — a price, a saving badge. */
  aside?: ReactNode;
};

/** One choice from a set. Native radios sharing a name, so arrow keys move the choice
 *  and Tab enters and leaves the group as one stop — no roving-tabindex code here.
 *
 *  Three layouts of the same control. `default`: radio then label. `list`: full-width rows
 *  with a visual at the start and the radio at the end, for a picker in a sheet — tax
 *  category, currency. `card`: each option a bordered tile that turns gold when chosen,
 *  for a choice that needs room to explain itself — a plan, a theme with its preview.
 *  In every layout the whole row or tile is the label, so all of it is the hit area. */
export function RadioGroup<V extends string>({
  label,
  options,
  value,
  onChange,
  orientation = "vertical",
  variant = "default",
  disabled,
  error,
  helperText,
  required,
  hideLabel = false,
  name,
  id: providedId,
  className = "",
}: {
  label: string;
  options: RadioOption<V>[];
  value: V | null;
  onChange: (value: V) => void;
  orientation?: "vertical" | "horizontal";
  variant?: "default" | "list" | "card";
  disabled?: boolean;
  error?: string;
  helperText?: string;
  required?: boolean;
  /** Keeps the group's name for screen readers only — a lone radio in a compact layout. */
  hideLabel?: boolean;
  name?: string;
  id?: string;
  className?: string;
}) {
  const { id, messageId, labelId } = useFieldIds(providedId);

  const disc = (o: RadioOption<V>, optId: string, off?: boolean) => (
    <span className="relative inline-grid size-[18px] shrink-0 place-items-center">
      <input
        id={optId}
        type="radio"
        name={name ?? id}
        value={o.value}
        checked={value === o.value}
        disabled={off}
        onChange={() => onChange(o.value)}
        className={`${box} size-[18px] rounded-full ${
          error ? "border-feedback-danger" : "border-border-strong hover:border-text-secondary"
        } checked:border-action-primary checked:bg-action-primary`}
      />
      {/* Gold disc, dark dot — the checkbox's language in a circle. */}
      <span aria-hidden="true" className="pointer-events-none col-start-1 row-start-1 hidden size-1.5 rounded-full bg-text-on-accent peer-checked:block" />
    </span>
  );
  const words = (o: RadioOption<V>, off?: boolean) => (
    <span className="min-w-0 flex-1">
      <span className={`block text-[13.5px] leading-5 ${off ? "text-text-tertiary" : "text-text-primary"}`}>{o.label}</span>
      {o.description ? <span className="mt-0.5 block text-[12.5px] leading-snug text-text-tertiary">{o.description}</span> : null}
    </span>
  );

  const layout =
    variant === "list"
      ? "space-y-0.5"
      : variant === "card"
        ? orientation === "horizontal"
          ? "grid grid-cols-[repeat(auto-fit,minmax(96px,1fr))] gap-3"
          : "space-y-2.5"
        : orientation === "horizontal"
          ? "flex flex-wrap gap-x-6 gap-y-3"
          : "space-y-3";

  // A card is a filled tile, not an outlined one: the fill says "one of these", the gold
  // ring appears only on the chosen one — so the only line in the group means something.
  const card =
    "rounded-xl bg-text-primary/[0.05] transition-[background-color,box-shadow] duration-[var(--ws-duration-fast)] hover:bg-text-primary/[0.08] has-[:checked]:bg-action-primary-tonal has-[:checked]:ring-1 has-[:checked]:ring-action-primary";

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      aria-required={required || undefined}
      aria-invalid={Boolean(error) || undefined}
      aria-describedby={describedBy(messageId, error, helperText)}
      className={`min-w-0 space-y-2.5 ${className}`}
    >
      <FieldLabel id={labelId} required={required} disabled={disabled} srOnly={hideLabel}>
        {label}
      </FieldLabel>
      <div className={layout}>
        {options.map((o) => {
          const optId = `${id}-${o.value}`;
          const off = disabled || o.disabled;
          const cursor = off ? "cursor-not-allowed opacity-50" : "cursor-pointer";
          if (variant === "list")
            return (
              // Top-aligned: with a two-line description, centring the icon and the radio
              // leaves them floating beside nothing. Both line up with the title instead.
              <label key={o.value} htmlFor={optId} className={`-mx-2 flex items-start gap-3 rounded-lg px-2 py-3 transition-colors duration-[var(--ws-duration-fast)] hover:bg-text-primary/[0.04] ${cursor}`}>
                {o.visual ? <span className="shrink-0">{o.visual}</span> : null}
                {words(o, off)}
                {o.aside ? <span className="shrink-0 text-[13px] leading-5 text-text-secondary">{o.aside}</span> : null}
                <span className="mt-px">{disc(o, optId, off)}</span>
              </label>
            );
          if (variant === "card" && orientation === "horizontal")
            return (
              <label key={o.value} htmlFor={optId} className={`flex flex-col gap-2.5 p-2 ${card} ${cursor}`}>
                {o.visual ? <span className="block overflow-hidden rounded-lg">{o.visual}</span> : null}
                <span className="flex items-center gap-2 px-1 pb-0.5">
                  {disc(o, optId, off)}
                  {words(o, off)}
                </span>
              </label>
            );
          if (variant === "card")
            return (
              <label key={o.value} htmlFor={optId} className={`flex items-center gap-3 px-4 py-3.5 ${card} ${cursor}`}>
                {disc(o, optId, off)}
                {o.visual ? <span className="shrink-0">{o.visual}</span> : null}
                {words(o, off)}
                {o.aside ? <span className="shrink-0 text-right">{o.aside}</span> : null}
              </label>
            );
          return (
            <div key={o.value} className="flex gap-2.5">
              <span className="mt-px self-start">{disc(o, optId, off)}</span>
              <label htmlFor={optId} className={`min-w-0 ${cursor}`}>
                {words(o, off)}
              </label>
            </div>
          );
        })}
      </div>
      <FieldMessage id={messageId} helperText={helperText} error={error} />
    </div>
  );
}

/* ------------------------------------------------------ Segmented control ---- */

/** One of two to five short, mutually exclusive values, side by side — a loan term, a
 *  slippage tolerance, a chart range. Radio semantics underneath (arrow keys move the
 *  choice, Tab is one stop), drawn as a row of segments. Chosen is the gold tone, the
 *  same as a chosen Select option; FilterTabs, which switches a view rather than setting
 *  a value, stays neutral. */
export function SegmentedControl<V extends string>({
  label,
  options,
  value,
  onChange,
  hideLabel = false,
  labelAside,
  helperText,
  error,
  disabled,
  size = "md",
  name,
  id: providedId,
  className = "",
}: {
  label: string;
  options: { value: V; label: ReactNode; disabled?: boolean }[];
  value: V | null;
  onChange: (value: V) => void;
  hideLabel?: boolean;
  labelAside?: ReactNode;
  helperText?: ReactNode;
  error?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  name?: string;
  id?: string;
  className?: string;
}) {
  const { id, messageId, labelId } = useFieldIds(providedId);
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      aria-describedby={describedBy(messageId, error, helperText)}
      aria-invalid={Boolean(error) || undefined}
      className={`min-w-0 space-y-2 ${className}`}
    >
      <FieldLabel id={labelId} disabled={disabled} aside={labelAside} srOnly={hideLabel}>
        {label}
      </FieldLabel>
      <div className={`flex gap-1 rounded-xl bg-text-primary/[0.05] p-1 ${error ? "ring-1 ring-feedback-danger" : ""}`}>
        {options.map((o) => {
          const off = disabled || o.disabled;
          return (
            // flex: 1 1 auto — segments share the spare width but start from their own
            // label's width, so "Suggested" gets more room than "1%" instead of clipping.
            <label key={o.value} className={`relative min-w-0 flex-auto ${off ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
              <input
                type="radio"
                name={name ?? id}
                value={o.value}
                checked={value === o.value}
                disabled={off}
                onChange={() => onChange(o.value)}
                className="peer absolute inset-0 appearance-none opacity-0 outline-none"
              />
              <span
                className={`flex items-center justify-center gap-1.5 truncate rounded-lg px-2.5 text-center font-medium tabular-nums text-text-secondary transition-[background-color,color,box-shadow] duration-[var(--ws-duration-fast)] peer-hover:text-text-primary peer-checked:bg-action-primary-tonal peer-checked:text-action-primary-text peer-checked:ring-1 peer-checked:ring-action-primary/50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary ${
                  size === "sm" ? "h-7 text-[12.5px]" : "h-9 text-[13px]"
                }`}
              >
                {o.label}
              </span>
            </label>
          );
        })}
      </div>
      <FieldMessage id={messageId} helperText={helperText} error={error} />
    </div>
  );
}

/* --------------------------------------------------------------- Switch ---- */

/* Two sizes. md for a form; sm for a dense settings list, where a 24px switch would set
   the row height on its own. The thumb travels on the standard curve — a switch is a
   state change on something already on screen. */
const track = { sm: "h-4 w-7", md: "h-6 w-10" };
const thumb = { sm: "size-3", md: "size-5" };
const travel = { sm: "translate-x-3", md: "translate-x-4" };

/** An on/off setting that takes effect at once — no Save button behind it. For a choice
 *  that is only applied on submit, use a Checkbox. */
export function Switch({
  label,
  description,
  checked,
  onChange,
  disabled,
  size = "md",
  labelPosition = "after",
  id: providedId,
  className = "",
}: {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  /** `before` for a settings row, where the switch closes the line; `after` in a form. */
  labelPosition?: "before" | "after";
  id?: string;
  className?: string;
}) {
  const { id, labelId } = useFieldIds(providedId);
  const descId = `${id}-desc`;
  const control = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      aria-describedby={description ? descId : undefined}
      disabled={disabled}
      // A native button: Space and Enter both click it, so there is no key handling here.
      onClick={() => onChange(!checked)}
      className={`relative inline-flex shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-[var(--ws-duration-fast)] ease-[var(--ws-ease-standard)] disabled:cursor-not-allowed disabled:opacity-40 ${track[size]} ${
        checked ? "bg-action-primary" : "bg-text-primary/15 hover:bg-text-primary/25"
      }`}
    >
      <span
        aria-hidden="true"
        // Off, the thumb is the control-thumb token — near-white on dark, white with an edge
        // on light, the brightest thing on the switch. On, it takes the on-accent ink over
        // the gold track: the same pairing as a primary Button's label.
        className={`block rounded-full shadow-[var(--ws-control-thumb-shadow)] transition-[translate,background-color] duration-[var(--ws-duration-base)] ease-[var(--ws-ease-standard)] ${thumb[size]} ${
          checked ? `${travel[size]} bg-text-on-accent` : "translate-x-0 bg-control-thumb"
        }`}
      />
    </button>
  );
  const text = (
    <span className="min-w-0">
      <span id={labelId} className={`block ${size === "sm" ? "text-[13px]" : "text-[13.5px]"} leading-5 ${disabled ? "text-text-tertiary" : "text-text-primary"}`}>
        {label}
      </span>
      {description ? <span id={descId} className="mt-0.5 block text-[12.5px] leading-snug text-text-tertiary">{description}</span> : null}
    </span>
  );
  return (
    <div
      className={`flex gap-3 ${labelPosition === "before" ? "items-center justify-between" : "items-start"} ${className}`}
      // Clicking the words toggles too, as a <label> would for a checkbox.
      onClick={(e) => {
        if (disabled || (e.target as HTMLElement).closest("button")) return;
        onChange(!checked);
      }}
    >
      {labelPosition === "before" ? (
        <>
          {text}
          {control}
        </>
      ) : (
        <>
          <span className="flex h-5 items-center">{control}</span>
          {text}
        </>
      )}
    </div>
  );
}
