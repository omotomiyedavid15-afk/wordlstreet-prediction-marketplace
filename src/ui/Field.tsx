import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/16/solid";
import { useId, type ReactNode } from "react";

/* The form conventions every control in the sandbox follows. Set once here; a screen
   that invents its own label position or required marker is off-system.

   Label position
     Above the control for anything you type into or pick from — text, amount, select,
     date, slider. To the right of the box for a checkbox or radio. A switch takes its
     label before it in a settings row (the row reads as a sentence ending in the
     switch) and after it when it stands alone in a form, like a checkbox.

   Required
     A red asterisk after the label, hidden from screen readers — the control itself
     carries aria-required, which is what assistive tech announces. A form with required
     fields says "* Required" once, above its first field. Optional fields carry nothing.

   Messages
     Helper text sits under the control in tertiary ink. On a validation failure the
     error replaces it — same slot, so nothing below moves — in feedback.danger with an
     icon, and the control gets aria-invalid. Either is linked with aria-describedby, so
     it is read when the field is focused. */

/** Stable ids for a field and its message. */
export function useFieldIds(providedId?: string) {
  const generated = useId();
  const id = providedId ?? generated;
  return { id, messageId: `${id}-message`, labelId: `${id}-label` };
}

export function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-feedback-danger">
      *
    </span>
  );
}

/** The "* Required" line a form shows once, above its first field. */
export function RequiredLegend({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[12px] text-text-tertiary ${className}`}>
      <RequiredMark /> Required
    </p>
  );
}

export function FieldLabel({
  htmlFor,
  id,
  required,
  disabled,
  children,
  aside,
  srOnly = false,
}: {
  /** The control's id. Leave it off for a group, and label it with `id` instead. */
  htmlFor?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  children: ReactNode;
  /** Right-aligned on the label row — a character count, an info tooltip, a balance. */
  aside?: ReactNode;
  srOnly?: boolean;
}) {
  const Tag = htmlFor ? "label" : "span";
  return (
    <div className={`flex items-baseline justify-between gap-3 ${srOnly ? "sr-only" : ""}`}>
      <Tag
        htmlFor={htmlFor}
        id={id}
        className={`block text-[13px] font-semibold ${disabled ? "text-text-tertiary" : "text-text-primary"}`}
      >
        {children}
        {required ? <RequiredMark /> : null}
      </Tag>
      {aside ? <span className="shrink-0 text-[12px] tabular-nums text-text-tertiary">{aside}</span> : null}
    </div>
  );
}

/** The helper / error / success line under a control. Renders nothing without a message. */
export function FieldMessage({
  id,
  helperText,
  error,
  success,
}: {
  id: string;
  helperText?: ReactNode;
  error?: ReactNode;
  success?: ReactNode;
}) {
  const message = error ?? success ?? helperText;
  if (!message) return null;
  const Icon = error ? ExclamationCircleIcon : success ? CheckCircleIcon : null;
  return (
    <p
      id={id}
      className={`flex items-start gap-1.5 text-[12px] leading-relaxed ${
        error ? "text-feedback-danger" : success ? "text-feedback-success" : "text-text-tertiary"
      }`}
    >
      {Icon ? <Icon aria-hidden="true" className="mt-[3px] size-3.5 shrink-0" /> : null}
      <span className="min-w-0">{message}</span>
    </p>
  );
}

/** Label above, control, message below — for any control that is not a plain input:
 *  a stepper, a date picker, a slider, an OTP row. */
export function Field({
  label,
  htmlFor,
  labelId,
  messageId,
  required,
  disabled,
  helperText,
  error,
  success,
  aside,
  children,
  className = "",
}: {
  label: ReactNode;
  htmlFor?: string;
  labelId?: string;
  messageId: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: ReactNode;
  error?: ReactNode;
  success?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 space-y-2 ${className}`}>
      <FieldLabel htmlFor={htmlFor} id={labelId} required={required} disabled={disabled} aside={aside}>
        {label}
      </FieldLabel>
      {children}
      <FieldMessage id={messageId} helperText={helperText} error={error} success={success} />
    </div>
  );
}

/** Two fields side by side from sm up, stacked below it. */
export function FormGridRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>{children}</div>;
}

/** The describedby value for a control: its message id when there is a message. */
export const describedBy = (messageId: string, ...messages: unknown[]) =>
  messages.some(Boolean) ? messageId : undefined;
