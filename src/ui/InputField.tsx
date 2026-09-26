import {
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes,
} from "react";
import { Chip } from "./Badge";
import { FieldLabel, FieldMessage, describedBy, useFieldIds } from "./Field";
import { Spinner } from "./Spinner";

type Icon = ComponentType<{ className?: string }>;

export type InputFieldStatus = "default" | "error" | "success";

export type InputFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  helperText?: ReactNode;
  error?: string;
  success?: string;
  leadingIcon?: Icon;
  trailingIcon?: Icon;
  leadingContent?: ReactNode;
  trailingContent?: ReactNode;
  shortcut?: string;
  clearable?: boolean;
  loading?: boolean;
  readOnly?: boolean;
  iconOnly?: boolean;
  onClear?: () => void;
  onTrailingClick?: () => void;
  /** `md` (36px) sits in a toolbar beside md Buttons; `lg` (44px) is the form default.
   *  Not `size` — that is the native input attribute, which callers already pass through. */
  fieldSize?: "md" | "lg";
  /** Right side of the label row — a balance, a count, a link. */
  labelAside?: ReactNode;
  /** Keeps the label for screen readers but not on screen — a search box in a toolbar. */
  hideLabel?: boolean;
  /** The caller renders the message itself, under the whole row, with this field's
   *  `${id}-message` id — a compact field set into a row that its message would break. */
  hideMessage?: boolean;
  /** The <input> itself, for a caller that needs to focus or measure it. */
  inputRef?: Ref<HTMLInputElement>;
  /** The bordered box, for anchoring a results panel to its full width. */
  fieldRef?: Ref<HTMLDivElement>;
};

export function InputField({
  label,
  helperText,
  error,
  success,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  leadingContent,
  trailingContent,
  shortcut,
  clearable = false,
  loading = false,
  iconOnly = false,
  onClear,
  onTrailingClick,
  fieldSize = "lg",
  labelAside,
  hideLabel = false,
  hideMessage = false,
  inputRef,
  fieldRef,
  required,
  type = "text",
  value,
  defaultValue,
  disabled,
  readOnly,
  id: providedId,
  className = "",
  ...props
}: InputFieldProps) {
  const { id, messageId } = useFieldIds(providedId);
  const [internalValue, setInternalValue] = useState(
    typeof defaultValue === "string" ? defaultValue : "",
  );
  const [revealed, setRevealed] = useState(false);
  const inputRef_ = useRef<HTMLInputElement>(null);
  const currentValue = value === undefined ? internalValue : String(value);
  const hasValue = currentValue.length > 0;
  const resolvedType = type === "password" && revealed ? "text" : type;
  const status: InputFieldStatus = error ? "error" : success ? "success" : "default";
  const isLocked = Boolean(disabled || loading || readOnly);

  useEffect(() => {
    if (!shortcut || !shortcut.toLowerCase().includes("k")) return;

    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef_.current?.focus();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [shortcut]);

  const input = (
    <div
      ref={fieldRef}
      className={`group relative flex items-center overflow-hidden border ${fieldSize === "md" ? "min-h-9 rounded-lg" : "min-h-11 rounded-xl"} border-border-default bg-surface-base transition-[border-color,box-shadow,background-color] duration-150 ${
        status === "error"
          ? "border-feedback-danger focus-within:border-feedback-danger focus-within:ring-1 focus-within:ring-feedback-danger"
          : status === "success"
            ? "border-feedback-success focus-within:border-feedback-success focus-within:ring-1 focus-within:ring-feedback-success"
            : "border-border-default hover:border-border-strong focus-within:border-action-primary focus-within:ring-1 focus-within:ring-action-primary"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""} ${readOnly ? "bg-surface-sunken" : ""}`}
    >
      {LeadingIcon ? (
        <LeadingIcon className={`${fieldSize === "md" ? "ml-3" : "ml-4"} size-4 shrink-0 text-text-tertiary`} />
      ) : leadingContent ? (
        <span className={`${fieldSize === "md" ? "ml-3" : "ml-4"} shrink-0 text-text-tertiary`}>{leadingContent}</span>
      ) : null}
      <input
        {...props}
        ref={(el) => {
          (inputRef_ as { current: HTMLInputElement | null }).current = el;
          if (typeof inputRef === "function") inputRef(el);
          else if (inputRef) (inputRef as { current: HTMLInputElement | null }).current = el;
        }}
        id={id}
        required={required}
        aria-required={required || undefined}
        type={resolvedType}
        value={value === undefined ? internalValue : value}
        defaultValue={value === undefined ? undefined : defaultValue}
        disabled={disabled || loading}
        readOnly={readOnly}
        aria-invalid={Boolean(error)}
        aria-describedby={props["aria-describedby"] ?? describedBy(messageId, error, success, helperText)}
        className={`min-w-0 flex-1 bg-transparent ${fieldSize === "md" ? "px-3 py-1.5 text-[13px]" : "px-4 py-2.5 text-[13.5px]"} text-text-primary outline-none placeholder:text-text-tertiary ${
          iconOnly ? "text-center" : ""
        }`}
        onChange={(event) => {
          if (value === undefined) setInternalValue(event.target.value);
          props.onChange?.(event);
        }}
      />
      {loading ? (
        <Spinner size="sm" className="mr-3.5 text-text-tertiary" />
      ) : type === "password" && !isLocked ? (
        <button
          type="button"
          aria-label={revealed ? "Hide password" : "Show password"}
          onClick={() => setRevealed((current) => !current)}
          className="mr-2 grid size-8 shrink-0 place-items-center rounded-md text-text-tertiary transition-colors hover:bg-surface-raised hover:text-text-primary"
        >
          {revealed ? <EyeSlashIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </button>
      ) : clearable && hasValue && !isLocked ? (
        <button
          type="button"
          aria-label="Clear input"
          onClick={() => {
            if (value === undefined) setInternalValue("");
            onClear?.();
          }}
          className="mr-2 grid size-8 shrink-0 place-items-center rounded-md text-text-tertiary transition-colors hover:bg-surface-raised hover:text-text-primary"
        >
          <XMarkIcon className="size-4" />
        </button>
      ) : (onTrailingClick || TrailingIcon) && !isLocked ? (
        <button
          type="button"
          aria-label="Input action"
          onClick={onTrailingClick}
          className="mr-2 grid size-8 shrink-0 place-items-center rounded-md text-text-tertiary transition-colors hover:bg-surface-raised hover:text-text-primary"
        >
          {TrailingIcon ? <TrailingIcon className="size-4" /> : trailingContent}
        </button>
      ) : trailingContent ? (
        <span className="mr-3.5 shrink-0 text-text-tertiary">{trailingContent}</span>
      ) : null}
      {shortcut ? (
        <kbd className="mr-3 flex shrink-0 items-center gap-1 rounded border border-border-default bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary">
          {shortcut}
        </kbd>
      ) : null}
    </div>
  );

  return (
    <div className={`min-w-0 ${hideLabel && hideMessage ? "" : "space-y-2"} ${className}`}>
      {label ? (
        <FieldLabel htmlFor={id} required={required} disabled={disabled} aside={labelAside} srOnly={iconOnly || hideLabel}>
          {label}
        </FieldLabel>
      ) : null}
      {input}
      {hideMessage ? null : <FieldMessage id={messageId} helperText={helperText} error={error} success={success} />}
    </div>
  );
}

export function IconOnlyInput({
  label,
  ...props
}: Omit<InputFieldProps, "iconOnly"> & { label: string }) {
  return <InputField {...props} label={label} iconOnly />;
}

/* --------------------------------------------------------------- Textarea ---- */

/** Multi-line text, resizable vertically by default. With `maxLength` it counts down in
 *  the label row — the count turns to the danger colour in the last tenth, so the limit
 *  is seen before it is hit rather than discovered when typing stops. */
/** The border every boxed multi-line field draws — resting, hover, gold on focus, red on
 *  error — shared so a field composed elsewhere (Vivid's composer) is the same field. */
export const fieldFrame = (error: boolean) =>
  error
    ? "border-feedback-danger focus-within:ring-1 focus-within:ring-feedback-danger"
    : "border-border-default hover:border-border-strong focus-within:border-action-primary focus-within:ring-1 focus-within:ring-action-primary";

export function Textarea({
  label,
  helperText,
  error,
  required,
  disabled,
  maxLength,
  rows = 4,
  resize = true,
  value,
  defaultValue,
  onChange,
  toolbar,
  textareaRef,
  id: providedId,
  className = "",
  ...props
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "defaultValue"> & {
  label: string;
  helperText?: string;
  error?: string;
  resize?: boolean;
  value?: string;
  defaultValue?: string;
  /** Formatting buttons under the text, inside the same box. */
  toolbar?: ReactNode;
  textareaRef?: Ref<HTMLTextAreaElement>;
}) {
  const { id, messageId } = useFieldIds(providedId);
  const [own, setOwn] = useState(defaultValue ?? "");
  const text = value ?? own;
  const left = maxLength !== undefined ? maxLength - text.length : undefined;
  const frame = fieldFrame(Boolean(error));
  const field = (
    <textarea
      {...props}
      ref={textareaRef}
      id={id}
      rows={rows}
      value={text}
      maxLength={maxLength}
      required={required}
      aria-required={required || undefined}
      disabled={disabled}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy(messageId, error, helperText)}
      onChange={(e) => {
        if (value === undefined) setOwn(e.target.value);
        onChange?.(e);
      }}
      className={`block min-h-24 w-full bg-surface-base px-4 py-3 text-[13.5px] leading-relaxed text-text-primary outline-none placeholder:text-text-tertiary disabled:cursor-not-allowed disabled:opacity-50 ${
        resize ? "resize-y" : "resize-none"
      } ${toolbar ? "rounded-t-xl" : `rounded-xl border transition-[border-color,box-shadow] duration-150 ${frame}`}`}
    />
  );
  return (
    <div className={`min-w-0 space-y-2 ${className}`}>
      <FieldLabel
        htmlFor={id}
        required={required}
        disabled={disabled}
        aside={
          left !== undefined ? (
            <span className={left <= maxLength! * 0.1 ? "text-feedback-danger" : ""}>
              <span className="sr-only">Characters used: </span>
              {text.length} / {maxLength}
            </span>
          ) : undefined
        }
      >
        {label}
      </FieldLabel>
      {toolbar ? (
        <div className={`rounded-xl border bg-surface-base transition-[border-color,box-shadow] duration-150 ${frame}`}>
          {field}
          <div className="flex flex-wrap items-center gap-0.5 rounded-b-xl px-1.5 pb-1.5">{toolbar}</div>
        </div>
      ) : (
        field
      )}
      <FieldMessage id={messageId} helperText={helperText} error={error} />
    </div>
  );
}

/* ----------------------------------------------------------- Token input ---- */

export type Token = { id: string; label: string; leading?: ReactNode };

/** Several values in one field — email addresses, people to invite. Enter, a comma or
 *  leaving the field turns the text into a chip; Backspace in an empty field takes the
 *  last chip back out for editing; a pasted list splits on commas. The chips are Badge's
 *  Chip, each with its own labelled remove button. `onAdd` returns false to refuse a
 *  value — the text stays so it can be fixed, and the caller sets `error` to say why. */
export function TokenInput({
  label,
  hideLabel = false,
  tokens,
  onAdd,
  onRemove,
  placeholder,
  helperText,
  error,
  required,
  disabled,
  autoFocusInput = false,
  id: providedId,
  className = "",
}: {
  label: string;
  hideLabel?: boolean;
  /** Opening the surface it sits in focuses the text box, not the first chip's remove. */
  autoFocusInput?: boolean;
  tokens: Token[];
  onAdd: (text: string) => boolean | void;
  onRemove: (id: string) => void;
  placeholder?: string;
  helperText?: ReactNode;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  const { id, messageId } = useFieldIds(providedId);
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const commit = (text = draft) => {
    const parts = text.split(",").map((t) => t.trim()).filter(Boolean);
    if (!parts.length) return;
    const refused = parts.filter((p) => onAdd(p) === false);
    setDraft(refused.join(", "));
  };

  return (
    <div className={`min-w-0 space-y-2 ${className}`}>
      <FieldLabel htmlFor={id} required={required} disabled={disabled} srOnly={hideLabel}>
        {label}
      </FieldLabel>
      <div
        onClick={() => input.current?.focus()}
        className={`flex min-h-11 cursor-text flex-wrap items-center gap-1.5 rounded-xl border bg-surface-base px-2 py-1.5 transition-[border-color,box-shadow] duration-150 ${
          error
            ? "border-feedback-danger focus-within:ring-1 focus-within:ring-feedback-danger"
            : "border-border-default hover:border-border-strong focus-within:border-action-primary focus-within:ring-1 focus-within:ring-action-primary"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        {tokens.map((t) => (
          <Chip key={t.id} leading={t.leading} onDismiss={disabled ? undefined : () => onRemove(t.id)} dismissLabel={`Remove ${t.label}`}>
            {t.label}
          </Chip>
        ))}
        <input
          ref={input}
          id={id}
          data-autofocus={autoFocusInput || undefined}
          value={draft}
          disabled={disabled}
          placeholder={tokens.length ? undefined : placeholder}
          autoComplete="off"
          aria-required={required || undefined}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy(messageId, error, helperText)}
          onChange={(e) => (e.target.value.includes(",") ? commit(e.target.value) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              e.preventDefault();
              commit();
            } else if (e.key === "Backspace" && !draft && tokens.length) {
              const last = tokens[tokens.length - 1];
              onRemove(last.id);
              setDraft(last.label);
              e.preventDefault();
            }
          }}
          onBlur={() => commit()}
          className="h-8 min-w-[10ch] flex-1 bg-transparent px-1.5 text-[13.5px] text-text-primary outline-none placeholder:text-text-tertiary"
        />
      </div>
      <FieldMessage id={messageId} helperText={helperText} error={error} />
    </div>
  );
}
