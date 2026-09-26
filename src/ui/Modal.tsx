import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/20/solid";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
  type TransitionEvent,
} from "react";
import { IconButton } from "./Button";
import { popoverPanel, usePopover, type MenuAction } from "./Dropdown";

/* Layered surfaces: Modal, Drawer and BottomSheet block the page; Popover does not.

   The three blocking ones are one engine (useSurface) over the native <dialog>. showModal()
   is the platform's modal: it lives in the top layer, makes everything behind it inert —
   so focus cannot leave, which is the focus trap — closes on Escape, and hands focus back
   to whatever opened it. None of that is re-implemented. What the engine adds:

   - every way of leaving (Escape, the scrim, the close button, a drag) goes through one
     onClose, and the surface only closes when its owner sets open to false. That is what
     lets a drawer with unsaved edits ask first, and a confirmation refuse to close while
     its request is in flight (`busy`);
   - content mounts when the surface opens and unmounts after it has faded out, so a form
     starts fresh each time and the exit animation still has something to show;
   - a stack, so a sheet with another sheet on top of it knows to step back;
   - drag-to-dismiss for the sheets.

   Motion and the scroll lock are CSS (.ws-surface and html:has(dialog:modal) in app.css).
   Popover is the other mechanism — usePopover from Dropdown.tsx, the same one the select
   and the menus use — because a popover is not modal and must not behave like one. */

/* ---------------------------------------------------------------- Stack ---- */

const stack: object[] = [];
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};

/** Where this surface sits among the open ones: `covered` while another is open on top
 *  of it, `stacked` when it was opened on top of another. */
function useStackPosition(key: object, open: boolean) {
  useEffect(() => {
    if (!open) return;
    stack.push(key);
    listeners.forEach((fn) => fn());
    return () => {
      stack.splice(stack.indexOf(key), 1);
      listeners.forEach((fn) => fn());
    };
  }, [open, key]);
  const at = useSyncExternalStore(subscribe, () => (open ? stack.indexOf(key) : -1));
  const depth = useSyncExternalStore(subscribe, () => stack.length);
  return { covered: at >= 0 && at < depth - 1, stacked: at > 0 };
}

/* --------------------------------------------------------------- Engine ---- */

/** Focus [data-autofocus], else the first tab stop that will take focus. Done by hand
 *  because the browser's own pick can be a scrollable body (Chrome makes scrollers
 *  focusable), a stepper's tabindex=-1 button, or a control inside a closed <details>.
 *  An unchecked radio is skipped: its group's tab stop is the checked one. */
function focusFirst(root: HTMLElement) {
  const all = [...root.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, [tabindex]")].filter(
    (el) => el.tabIndex >= 0 && !el.matches(":disabled") && !(el instanceof HTMLInputElement && el.type === "radio" && !el.checked),
  );
  const stops = [...all.filter((el) => !el.hasAttribute("data-close")), ...all.filter((el) => el.hasAttribute("data-close"))];
  for (const el of [root.querySelector<HTMLElement>("[data-autofocus]"), ...stops]) {
    el?.focus();
    if (el && document.activeElement === el) return;
  }
}

// Where each open surface sends focus when it closes.
const returns = new WeakMap<HTMLDialogElement, HTMLElement | null>();

/** The element to hand focus back to. If it sits in a surface that has also just closed —
 *  a sheet and the sheet stacked on it, closing together — follow that surface's own
 *  return point instead, down to something still on screen. */
function returnPoint(from: HTMLElement | null) {
  let target = from;
  for (let host = target?.closest("dialog"); host && !host.open; host = target?.closest("dialog")) target = returns.get(host) ?? null;
  return target;
}

function useSurface({ open, onClose, busy = false, modal = true }: { open: boolean; onClose: () => void; busy?: boolean; modal?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [key] = useState(() => ({}));
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  const { covered, stacked } = useStackPosition(key, open);
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const pressedBackdrop = useRef(false);
  const latest = useRef({ open, onClose, busy });
  latest.current = { open, onClose, busy };
  const request = useCallback(() => {
    if (!latest.current.busy) latest.current.onClose();
  }, []);

  // Runs after every render, not only when `open` changes: if the browser closed the
  // dialog on its own while the owner still wants it open, the next render reopens it.
  useLayoutEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      returns.set(d, document.activeElement as HTMLElement | null);
      if (modal) d.showModal();
      else d.show();
      focusFirst(d);
    } else if (!open && d.open) {
      const inside = d.contains(document.activeElement);
      d.close();
      d.style.translate = ""; // a drag-dismiss hands over to the exit transition from where it let go
      if (inside || document.activeElement === document.body) returnPoint(returns.get(d) ?? null)?.focus();
    }
  });

  const dialogProps = {
    ref,
    "aria-modal": modal || undefined,
    "aria-busy": busy || undefined,
    "data-covered": covered || undefined,
    "data-stacked": stacked || undefined,
    // Escape. Always prevented: the owner decides, via onClose.
    onCancel: (e: SyntheticEvent<HTMLDialogElement>) => {
      e.preventDefault();
      request();
    },
    // Chrome will force a dialog shut on a second Escape with no click in between. If it
    // did and the owner still wants it open, ask the owner and put it back.
    onClose: () => {
      if (!latest.current.open) return;
      request();
      rerender();
    },
    onKeyDown: (e: KeyboardEvent<HTMLDialogElement>) => {
      if (!modal && e.key === "Escape") {
        e.stopPropagation();
        request();
      }
    },
    // A click whose press and release both landed on the <dialog> itself landed on the
    // scrim — the content always sits in an inner element. Checking the press too stops a
    // text selection dragged out of the panel from closing it.
    onPointerDown: (e: PointerEvent<HTMLDialogElement>) => {
      pressedBackdrop.current = e.target === e.currentTarget;
    },
    onClick: (e: MouseEvent<HTMLDialogElement>) => {
      if (modal && pressedBackdrop.current && e.target === e.currentTarget) request();
    },
    onTransitionEnd: (e: TransitionEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget && e.propertyName === "opacity" && !e.pseudoElement && !latest.current.open) setMounted(false);
    },
  };

  return { ref, mounted, dialogProps, request, covered };
}

/** Drag the grip down to dismiss. Past a third of the sheet's height, or a quick flick,
 *  and it goes; short of that it springs back. Dragging up meets increasing resistance
 *  rather than a wall. The transform is written straight onto the element — no React
 *  state per pointer move. */
function useDragToDismiss(ref: RefObject<HTMLDialogElement | null>, dismiss: () => void, enabled: () => boolean = () => true) {
  const drag = useRef<{ y: number; t: number; dy: number } | null>(null);
  const end = (commit: boolean) => {
    const d = drag.current;
    const el = ref.current;
    drag.current = null;
    if (!d || !el) return;
    el.style.transition = "";
    const velocity = d.dy / (performance.now() - d.t);
    if (commit && (d.dy > el.offsetHeight * 0.3 || (velocity > 0.11 && d.dy > 8))) {
      dismiss();
      // Refused (busy, or unsaved edits)? Spring back.
      requestAnimationFrame(() => el.open && (el.style.translate = ""));
    } else el.style.translate = "";
  };
  return {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.button !== 0 || !enabled() || (e.target as HTMLElement).closest("button, a, input, textarea, select")) return;
      drag.current = { y: e.clientY, t: performance.now(), dy: 0 };
      e.currentTarget.setPointerCapture(e.pointerId);
      if (ref.current) ref.current.style.transition = "none";
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const d = drag.current;
      if (!d || !ref.current) return;
      d.dy = e.clientY - d.y;
      const up = -d.dy;
      const offset = d.dy >= 0 ? d.dy : -(24 * up) / (up + 24);
      ref.current.style.translate = `0 ${offset}px`;
    },
    onPointerUp: () => end(true),
    onPointerCancel: () => end(false),
  };
}

/** For a footer's confirming action: runs the request once, however many times the
 *  button is pressed, and reports `busy` until it settles. Put busy on the surface (no
 *  Escape, no scrim, no close) and `loading` on the button; disable Cancel with it. */
export function useBusy() {
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const run = useCallback(async (task: () => Promise<unknown> | unknown) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      await task();
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);
  return [busy, run] as const;
}

/* ------------------------------------------------------------ Shared parts ---- */

type SurfaceProps = {
  open: boolean;
  /** Every dismissal — Escape, the scrim, the close button, a drag — calls this. Set open
   *  to false to let it close; do something else (ask first) to keep it open. */
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  /** Accessible name when the header is custom rather than a title. */
  label?: string;
  /** Replaces the title block — a record's identity, a status control. */
  header?: ReactNode;
  children?: ReactNode;
  /** The actions. Confirming action last: the reading order ends on it, and on a phone it
   *  lands under the thumb. */
  footer?: ReactNode;
  /** A request is in flight: Escape, the scrim and the close button do nothing. */
  busy?: boolean;
  /** Shows a back arrow instead of nothing at the header's start — a sheet stacked on a
   *  sheet, going back one step. */
  onBack?: () => void;
  backLabel?: string;
  hideClose?: boolean;
  className?: string;
};

function Heading({ titleId, descId, title, description, header, onBack, backLabel, center, compact, close }: {
  titleId: string;
  descId: string;
  title?: ReactNode;
  description?: ReactNode;
  header?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  center?: boolean;
  compact?: boolean;
  /** The close button, placed in the heading row so it lines up with what it closes: on
   *  the title's first line, or centred on a custom header (an avatar row, a status). */
  close?: ReactNode;
}) {
  if (!title && !header && !onBack) return null;
  return (
    <div className={`flex items-start gap-2 ${center ? "text-center" : ""}`}>
      {onBack ? <IconButton icon={ChevronLeftIcon} label={backLabel ?? "Back"} size="sm" onClick={onBack} className="-ml-1.5 shrink-0" /> : null}
      <div className="min-w-0 flex-1">
        {header ?? (
          <>
            <h2 id={titleId} className={`${compact ? "text-[15px] leading-6" : "text-[17px] leading-6"} font-semibold tracking-[-0.01em] text-balance text-text-primary`}>
              {title}
            </h2>
            {description ? (
              <p id={descId} className="mt-1 text-[13.5px] leading-relaxed text-pretty text-text-secondary">
                {description}
              </p>
            ) : null}
          </>
        )}
      </div>
      {close ? <span className={`-mr-2 flex shrink-0 ${header ? "self-center" : "-mt-0.5"}`}>{close}</span> : null}
    </div>
  );
}

/** Marked data-close so opening a surface never lands focus on the way out: focusFirst
 *  skips it for the first field or, in a confirmation, for Cancel. In the heading row
 *  where there is one; pinned to the corner over promo art, where there is not. */
function CloseButton({ onClick, disabled, className = "", pinned = false }: { onClick: () => void; disabled?: boolean; className?: string; pinned?: boolean }) {
  return <IconButton data-close icon={XMarkIcon} label="Close" size="sm" onClick={onClick} disabled={disabled} className={`${pinned ? "absolute" : ""} ${className}`} />;
}

const Grip = () => <span aria-hidden="true" className="mx-auto block h-1 w-9 shrink-0 rounded-full bg-text-primary/20" />;

/* The panel is one step down from a menu: surface.base, where a menu is surface.raised —
   so a select or kebab opened inside it still lifts off it. No border and no dividers
   inside: the scrim separates the panel from the page, space and a darker well separate
   the parts within it. .ws-panel (app.css) also re-points surface.base one step darker for
   everything inside, so every field, chip and secondary button sits recessed in the panel
   rather than flush with it. */
const panelSkin = "ws-panel p-0 text-text-primary shadow-[var(--ws-shadow-overlay)]";

/** A recessed area inside a surface — a callout, a summary, a list of benefits. The one
 *  thing darker than the fields around it. */
export const well = "rounded-lg bg-surface-sunken";

/** Draws a surface in place instead of in the top layer: same markup, same props, no
 *  <dialog>, no scrim, nothing blocked. For a docs page, a gallery, or a screenshot — the
 *  live one is still the thing people use. Set it per surface, or wrap any number of them
 *  in <InlineSurfaces>; an explicit `inline={false}` opts one back out (a confirmation
 *  that should only ever appear for real). */
type Inline = { inline?: boolean };
const InlineContext = createContext(false);
export function InlineSurfaces({ children }: { children: ReactNode }) {
  return <InlineContext.Provider value={true}>{children}</InlineContext.Provider>;
}
const useInline = (prop?: boolean) => {
  const ctx = useContext(InlineContext);
  return prop ?? ctx;
};

function InlineFrame({ titleId, descId, title, description, label, className, children }: { titleId: string; descId: string; title?: ReactNode; description?: ReactNode; label?: string; className: string; children: ReactNode }) {
  return (
    <div
      role="dialog"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : label}
      aria-describedby={description ? descId : undefined}
      className={`relative flex flex-col overflow-hidden ${panelSkin} ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- Modal ---- */

const modalWidth = { sm: "[--w:400px]", md: "[--w:520px]", lg: "[--w:640px]" };

/** A centred, blocking surface for a decision or a short task. `sm` is a confirmation;
 *  `md` and `lg` hold a form.
 *
 *  On a phone a form modal becomes a bottom sheet (`mobile="sheet"`, the default from md
 *  up): the fields and keyboard need the full width, and the actions belong under the
 *  thumb. A confirmation stays a compact centred dialog — two lines and two buttons do
 *  not need a sheet, and a sheet makes a yes/no feel heavier than it is. */
export function Modal({
  open,
  onClose,
  title,
  description,
  label,
  header,
  children,
  footer,
  busy,
  onBack,
  backLabel,
  hideClose,
  size = "sm",
  mobile,
  media,
  center = false,
  inline: inlineProp,
  className = "",
}: SurfaceProps &
  Inline & {
    size?: "sm" | "md" | "lg";
    mobile?: "sheet" | "dialog";
    /** Full-bleed art above the title — a promo's illustration. */
    media?: ReactNode;
    /** Centre the heading, for a promo whose art is centred above it. */
    center?: boolean;
  }) {
  const titleId = useId();
  const descId = useId();
  const inline = useInline(inlineProp);
  const s = useSurface({ open: open && !inline, onClose, busy });
  const asSheet = !inline && (mobile ?? (size === "sm" ? "dialog" : "sheet")) === "sheet";
  const phone = () => window.matchMedia("(max-width: 639.98px)").matches;
  const drag = useDragToDismiss(s.ref, s.request, () => asSheet && phone());
  const close = inline ? onClose : s.request;
  const pinClose = Boolean(media || center || !(title || header || onBack));
  const closeButton = hideClose ? null : (
    <CloseButton onClick={close} disabled={busy} pinned={pinClose} className={pinClose ? `top-4 right-4 ${media ? "bg-surface-raised/80 backdrop-blur-sm" : ""}` : ""} />
  );

  const content = (
    <>
      <div className="flex max-h-[inherit] min-h-0 flex-col">
        {asSheet ? (
          <div {...drag} className="flex shrink-0 touch-none justify-center pt-2 sm:hidden">
            <Grip />
          </div>
        ) : null}
        {media}
        {title || header || onBack ? (
          <div {...(asSheet ? drag : {})} className={`shrink-0 px-6 ${media ? "pt-5" : asSheet ? "pt-6 max-sm:pt-3" : "pt-6"} ${asSheet ? "max-sm:touch-none" : ""}`}>
            <Heading {...{ titleId, descId, title, description, header, onBack, backLabel, center }} close={pinClose ? undefined : closeButton} />
          </div>
        ) : null}
        {children ? (
          <div className={`ws-scroll-y min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 ${title || header ? "pt-5" : "pt-6"} ${footer ? "pb-2" : "pb-6"}`}>
            {children}
          </div>
        ) : null}
        {footer ? (
          <div className={`flex shrink-0 flex-wrap items-center justify-end gap-2 px-6 pt-4 [&>button:only-child]:w-full ${asSheet ? "pb-6 max-sm:pb-[max(24px,env(safe-area-inset-bottom))]" : "pb-6"}`}>
            {footer}
          </div>
        ) : null}
      </div>
      {pinClose ? closeButton : null}
    </>
  );

  if (inline)
    return (
      <InlineFrame {...{ titleId, descId, title, description, label }} className={`max-h-[680px] w-[var(--w)] max-w-full rounded-[var(--ws-radius-sheet)] ${modalWidth[size]} ${className}`}>
        {content}
      </InlineFrame>
    );
  if (!s.mounted) return null;
  return (
    <dialog
      {...s.dialogProps}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : label}
      aria-describedby={description ? descId : undefined}
      data-mobile={asSheet ? "sheet" : "dialog"}
      className={`ws-surface ws-modal m-auto max-h-[min(760px,calc(100dvh-48px))] w-[min(var(--w),calc(100vw-32px))] max-w-none overflow-hidden rounded-[var(--ws-radius-sheet)] border-0 ${panelSkin} ${modalWidth[size]} ${
        asSheet ? "max-sm:mx-0 max-sm:mt-auto max-sm:mb-0 max-sm:max-h-[calc(100dvh-24px)] max-sm:w-full max-sm:rounded-b-none" : ""
      } ${className}`}
    >
      {content}
    </dialog>
  );
}

/* --------------------------------------------------------------- Drawer ---- */

const drawerWidth = { sm: "[--w:380px]", md: "[--w:460px]", lg: "[--w:560px]" };

/** A panel from the right edge, for one record or one task beside the list it came from.
 *  The header and footer stay put; the body scrolls.
 *
 *  `modal` (the default) puts the scrim behind it and blocks the page, like a Modal —
 *  one rule for "a surface is in front of you". `modal={false}` is the split view: no
 *  scrim, the page stays usable and scrollable, and focus is free to leave. A drawer that
 *  pushes the page aside instead of covering it is a layout decision — give the page
 *  right padding equal to the drawer while a non-modal one is open. */
export function Drawer({
  open,
  onClose,
  title,
  description,
  label,
  header,
  children,
  footer,
  busy,
  onBack,
  backLabel,
  hideClose,
  size = "md",
  modal = true,
  inline: inlineProp,
  className = "",
}: SurfaceProps & Inline & { size?: "sm" | "md" | "lg"; modal?: boolean }) {
  const titleId = useId();
  const descId = useId();
  const inline = useInline(inlineProp);
  const s = useSurface({ open: open && !inline, onClose, busy, modal });

  const content = (
    <>
      <div className="flex h-full min-h-0 flex-col">
        {title || header || onBack ? (
          <div className="shrink-0 px-6 pt-5 pb-3">
            <Heading {...{ titleId, descId, title, description, header, onBack, backLabel }} compact close={hideClose ? undefined : <CloseButton onClick={inline ? onClose : s.request} disabled={busy} />} />
          </div>
        ) : null}
        <div className="ws-scroll-y min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">{children}</div>
        {footer ? <div className="flex shrink-0 flex-wrap items-center gap-2 px-6 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] [&>button:only-child]:w-full">{footer}</div> : null}
      </div>
      {hideClose || title || header || onBack ? null : <CloseButton pinned onClick={inline ? onClose : s.request} disabled={busy} className="top-4 right-4" />}
    </>
  );

  if (inline)
    return (
      <InlineFrame {...{ titleId, descId, title, description, label }} className={`h-full w-[var(--w)] max-w-full shrink-0 ${drawerWidth[size]} ${className}`}>
        {content}
      </InlineFrame>
    );
  if (!s.mounted) return null;
  return (
    <dialog
      {...s.dialogProps}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : label}
      aria-describedby={description ? descId : undefined}
      className={`ws-surface ws-drawer fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-[min(var(--w),100vw)] max-w-none overflow-hidden border-0 ${panelSkin} ${drawerWidth[size]} ${
        modal ? "" : "z-[50]"
      } ${className}`}
    >
      {content}
    </dialog>
  );
}

/* ---------------------------------------------------------- Bottom sheet ---- */

/** Mobile's modal: anchored to the bottom edge, dismissed by dragging the grip down as
 *  well as by Escape, the scrim and the close button. The bottom padding clears the
 *  home indicator (safe-area-inset-bottom).
 *
 *  Sheets stack. Opening a second sheet from inside the first — "New customer" from
 *  "Select customer" — puts it on top without closing the first, which steps back; closing
 *  the top one returns to the first with its state and focus where they were. Give the
 *  top sheet `onBack` when it is a step in the first one's flow. */
export function BottomSheet({
  open,
  onClose,
  title,
  description,
  label,
  header,
  children,
  footer,
  busy,
  onBack,
  backLabel,
  hideClose,
  inline: inlineProp,
  className = "",
}: SurfaceProps & Inline) {
  const titleId = useId();
  const descId = useId();
  const inline = useInline(inlineProp);
  const s = useSurface({ open: open && !inline, onClose, busy });
  const drag = useDragToDismiss(s.ref, s.request, () => !inline);

  const content = (
    <>
      <div className="flex max-h-[inherit] min-h-0 flex-col">
        <div {...drag} className="shrink-0 touch-none px-5 pt-2">
          <Grip />
          {title || header || onBack ? (
            <div className="pt-3">
              <Heading {...{ titleId, descId, title, description, header, onBack, backLabel }} compact close={hideClose ? undefined : <CloseButton onClick={inline ? onClose : s.request} disabled={busy} />} />
            </div>
          ) : null}
        </div>
        {children ? <div className="ws-scroll-y min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-2">{children}</div> : null}
        {footer ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] [&>*]:flex-1">{footer}</div>
        ) : (
          <div className="h-[max(12px,env(safe-area-inset-bottom))] shrink-0" />
        )}
      </div>
      {hideClose || title || header || onBack ? null : <CloseButton pinned onClick={inline ? onClose : s.request} disabled={busy} className="top-4 right-3" />}
    </>
  );

  if (inline)
    return (
      <InlineFrame {...{ titleId, descId, title, description, label }} className={`max-h-full w-full rounded-t-[var(--ws-radius-sheet)] ${className}`}>
        {content}
      </InlineFrame>
    );
  if (!s.mounted) return null;
  return (
    <dialog
      {...s.dialogProps}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : label}
      aria-describedby={description ? descId : undefined}
      className={`ws-surface ws-sheet mx-auto mt-auto mb-0 max-h-[calc(100dvh-24px)] w-full max-w-[520px] overflow-hidden rounded-t-[var(--ws-radius-sheet)] border-0 ${panelSkin} ${className}`}
    >
      {content}
    </dialog>
  );
}

/** The simplest sheet: two or three things you could do next, and nothing to fill in.
 *  Choosing one closes the sheet and runs it. It takes the same actions an ActionMenu
 *  does, so a row's kebab menu on desktop can be this on a phone without a second list. */
export function ActionSheet({
  open,
  onClose,
  title,
  description,
  actions,
  inline,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  actions: (MenuAction & { description?: string })[];
} & Inline) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} description={description} inline={inline}>
      <ul className="space-y-1 pb-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <li key={a.label}>
              <button
                type="button"
                disabled={a.disabled}
                onClick={() => {
                  onClose();
                  a.onSelect();
                }}
                className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
                  a.danger ? "text-feedback-danger hover:bg-feedback-danger/10 focus-visible:bg-feedback-danger/10" : "hover:bg-text-primary/[0.06] focus-visible:bg-text-primary/[0.06]"
                } outline-none`}
              >
                {Icon ? (
                  <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${a.danger ? "bg-feedback-danger/10" : "bg-surface-sunken text-text-secondary"}`}>
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className={`block text-[14px] font-medium ${a.danger ? "" : "text-text-primary"}`}>{a.label}</span>
                  {a.description ? <span className="mt-0.5 block text-[12.5px] leading-snug text-text-tertiary">{a.description}</span> : null}
                </span>
                <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0 text-text-tertiary" />
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}

/* -------------------------------------------------------------- Popover ---- */

export type PopoverTriggerProps = ReturnType<typeof usePopover>["triggerHandlers"] & {
  "aria-haspopup": "dialog";
  "aria-expanded": boolean;
  "aria-controls": string;
};

/** Rich content anchored to a trigger — a share panel, a filter builder, a mini profile.
 *  Not a menu (that is ActionMenu) and not modal (that is Modal): the page stays live
 *  behind it, focus is not trapped, and Tab past the end simply leaves and closes it.
 *
 *  It runs on usePopover, the system's one anchored-overlay mechanism: top layer, so no
 *  container clips it; placed below the trigger and flipped above when there is no room;
 *  outside click and Escape close it and return focus to the trigger. `inline` draws the
 *  panel in place, without its trigger. */
export function Popover({
  label,
  trigger,
  children,
  align = "start",
  inline: inlineProp,
  className = "",
}: {
  /** The panel's accessible name — "Share watchlist". */
  label: string;
  trigger: (props: PopoverTriggerProps) => ReactNode;
  /** Content, or a function given `close` for an action inside that should close it. */
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "start" | "end";
  className?: string;
} & Inline) {
  const id = useId();
  const pop = usePopover({ align });
  const inline = useInline(inlineProp);

  useEffect(() => {
    if (!pop.open) return;
    requestAnimationFrame(() => pop.panelRef.current && focusFirst(pop.panelRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pop.open]);

  // Focus leaving for somewhere outside the panel and its trigger closes it — no trap.
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && !pop.panelRef.current?.contains(next) && !pop.anchorRef.current?.contains(next)) pop.hide();
  };

  const skin = `ws-raised max-w-[calc(100vw-16px)] overflow-hidden rounded-xl bg-surface-raised text-text-primary shadow-[var(--ws-shadow-overlay)] ${className}`;
  const body = typeof children === "function" ? children(() => pop.hide(true)) : children;
  if (inline)
    return (
      <div role="dialog" aria-label={label} className={skin}>
        {body}
      </div>
    );
  return (
    <>
      {trigger({ ...pop.triggerHandlers, "aria-haspopup": "dialog", "aria-expanded": pop.open, "aria-controls": id })}
      <div ref={pop.panelRef} id={id} popover="auto" role="dialog" aria-label={label} onBlur={onBlur} className={`${popoverPanel} ${skin}`}>
        {body}
      </div>
    </>
  );
}

/** The last value that was not null. A surface keyed off "which row is open" loses its
 *  row the moment it starts closing; showing the last one keeps the title from blanking
 *  while it fades out. */
export function useLastDefined<T>(value: T | null | undefined) {
  const last = useRef(value);
  if (value != null) last.current = value;
  return last.current;
}
