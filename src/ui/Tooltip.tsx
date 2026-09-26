import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import type { Side } from "./anchor";
import { popoverPanel, usePopover } from "./usePopover";

/* The tooltip family. Five things that float a label or a card next to something, on one
   engine: usePopover for the top layer and placeAgainst for the side, the flip and the
   arrow. What differs is the interaction model, not the box:

   - Tooltip: a label or a short description. Hover (after a beat) or keyboard focus shows
     it, leaving hides it at once, and the pointer can never enter it — role=tooltip.
   - Tooltip trigger="click": the toggletip. Same bubble, opened by pressing an (i).
   - HoverCard: interactive content. The pointer can cross from the trigger into the card
     without it closing, and Tab moves into it.
   - Callout: a static pill with an arrow, placed by the layout, not by a trigger.
   - Tour (Tour.tsx): a step sequence anchored to live elements.

   Tooltips are theme-inverted: always the darkest neutral, in both themes (.ws-tip). */

// A tooltip that closed within the last half second makes the next one open at once and
// without the fade — sweeping along a toolbar reads every label.
let warmUntil = 0;

/** A shortcut chip. `tip` (the default) is inverted against the tooltip it sits in;
 *  `surface` is quiet ink on whatever panel it sits on — a command palette's rows and its
 *  key legend, where eight inverted chips in a column would shout. */
export function Kbd({ children, tone = "tip" }: { children: ReactNode; tone?: "tip" | "surface" }) {
  return (
    <kbd
      className={`inline-flex h-[18px] shrink-0 items-center rounded-[5px] px-1.5 font-sans text-[10.5px] font-semibold tracking-[0.02em] ${
        tone === "tip" ? "bg-tip-text text-tip" : "gap-0.5 bg-text-primary/[0.08] text-text-secondary"
      }`}
    >
      {children}
    </kbd>
  );
}

const bubble = (wide: boolean) =>
  `ws-tip ${wide ? "w-max max-w-[280px] rounded-lg px-3 py-2 text-[12.5px] leading-[18px] font-normal text-pretty" : "rounded-md px-2 py-1 text-[12px] leading-4 font-medium whitespace-nowrap"}`;

function BubbleBody({ children, shortcut, wide }: { children: ReactNode; shortcut?: string; wide: boolean }) {
  return (
    <>
      {wide ? (
        <>
          {children}
          {shortcut ? (
            <span className="mt-2 flex">
              <Kbd>{shortcut}</Kbd>
            </span>
          ) : null}
        </>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          {children}
          {shortcut ? <Kbd>{shortcut}</Kbd> : null}
        </span>
      )}
      <span aria-hidden="true" className="ws-tip-arrow" />
    </>
  );
}

/** The tooltip drawn in place — for a specimen sheet, or anywhere the label should simply
 *  be visible. `side` is the side of its trigger it sits on; the arrow points back. */
export function TooltipBubble({ children, shortcut, side = "top", wide = false, className = "" }: { children: ReactNode; shortcut?: string; side?: Side; wide?: boolean; className?: string }) {
  return (
    <div data-side={side} className={`relative ${bubble(wide)} ${className}`}>
      <BubbleBody shortcut={shortcut} wide={wide}>
        {children}
      </BubbleBody>
    </div>
  );
}

type TriggerMode = "hover" | "click";

/** The wrapper every floating trigger shares. It adds no box of its own
 *  (display: contents), so a Button keeps its place in a flex row — the element inside is
 *  the anchor. `tabbable` wraps something that cannot take focus (a status pill) in a real
 *  focusable box instead. */
function useTrigger(tabbable: boolean) {
  const wrap = useRef<HTMLSpanElement>(null);
  const anchor = () => (tabbable ? wrap.current : ((wrap.current?.firstElementChild as HTMLElement | null) ?? wrap.current));
  return { wrap, anchor };
}

/** A label, or a short description, for the thing under the pointer or focus.
 *
 *  Hover shows it after `delay` (400ms, so sweeping across a column does not strobe);
 *  keyboard focus shows it at once; leaving, pressing, or Escape hides it at once. It never
 *  takes the pointer, so it cannot cover a click. On touch there is no hover: a label
 *  simply does not appear (`touch="none"`, the default for short labels), a description is
 *  revealed by the tap (`touch="reveal"`, the default when `wide`) — without swallowing the
 *  tap, which still reaches the trigger.
 *
 *  `trigger="click"` is the toggletip: the same bubble, opened and closed by pressing the
 *  trigger — for an (i) whose explanation is worth a deliberate press, and for touch. */
export function Tooltip({
  content,
  shortcut,
  side = "top",
  wide = false,
  trigger = "hover",
  tabbable = false,
  describe = true,
  delay = 400,
  touch,
  children,
}: {
  content: ReactNode;
  /** A key chip — "⌘B". Inline beside a label; under a description. */
  shortcut?: string;
  side?: Side;
  /** Multi-line, capped at 280px — a description rather than a label. */
  wide?: boolean;
  trigger?: TriggerMode;
  /** Wrap a non-focusable trigger (a pill, an icon) in a focusable box. */
  tabbable?: boolean;
  /** Point the trigger's aria-describedby at the content. Off when the trigger's own
   *  accessible name already says the same words — an IconButton's label. */
  describe?: boolean;
  delay?: number;
  touch?: "none" | "reveal";
  children: ReactNode;
}) {
  const id = useId();
  const descId = `${id}-desc`;
  const { wrap, anchor } = useTrigger(tabbable);
  const pop = usePopover({ mode: "manual", side, align: "center", gap: 8 });
  const [mounted, setMounted] = useState(false);
  const [instant, setInstant] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const want = useRef(false);
  const pressed = useRef(false);
  const onTouch = touch ?? (wide ? "reveal" : "none");

  const reveal = () => {
    want.current = true;
    if (!mounted) setMounted(true);
    else pop.show(anchor());
  };
  // First show: the panel mounts, then opens — a tooltip costs nothing until it is needed.
  useLayoutEffect(() => {
    if (mounted && want.current && !pop.open) pop.show(anchor());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const open = (wait: number) => {
    window.clearTimeout(timer.current);
    if (pressed.current) return;
    const warm = Date.now() < warmUntil;
    setInstant(warm || wait === 0);
    timer.current = window.setTimeout(reveal, warm ? 0 : wait);
  };
  const close = () => {
    window.clearTimeout(timer.current);
    if (want.current) warmUntil = Date.now() + 500;
    want.current = false;
    pop.hide();
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // aria-describedby (and, for a toggletip, aria-expanded) on the focusable element itself.
  useEffect(() => {
    const el = anchor();
    if (!el) return;
    if (describe) el.setAttribute("aria-describedby", descId);
    if (trigger === "click") el.setAttribute("aria-expanded", String(pop.open));
    return () => {
      if (describe) el.removeAttribute("aria-describedby");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [describe, trigger, pop.open, descId]);

  const handlers =
    trigger === "click"
      ? {
          onClick: () => (pop.open ? close() : (setInstant(false), reveal())),
          onBlur: (e: FocusEvent) => {
            const next = e.relatedTarget as Node | null;
            if (!next || !pop.panelRef.current?.contains(next)) close();
          },
        }
      : {
          onPointerEnter: (e: PointerEvent) => e.pointerType !== "touch" && open(delay),
          // A finger lifting fires pointerleave too; that must not undo a tap reveal.
          onPointerLeave: (e: PointerEvent) => {
            pressed.current = false;
            if (e.pointerType !== "touch") close();
          },
          onPointerDown: (e: PointerEvent) => {
            if (e.pointerType === "touch" && onTouch === "reveal") {
              // Revealed by the tap, never instead of it: nothing is prevented, so a
              // button underneath still gets its click.
              if (pop.open) close();
              else {
                setInstant(true);
                reveal();
              }
              return;
            }
            close();
            pressed.current = true;
          },
          onFocus: (e: FocusEvent) => (e.target as HTMLElement).matches(":focus-visible") && open(0),
          onBlur: close,
        };

  return (
    <>
      <span
        ref={wrap}
        {...handlers}
        onKeyDown={(e: KeyboardEvent) => e.key === "Escape" && pop.open && close()}
        tabIndex={tabbable ? 0 : undefined}
        className={tabbable ? "inline-flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary" : "contents"}
      >
        {children}
      </span>
      {describe ? (
        <span id={descId} hidden>
          {content}
          {shortcut ? ` (${shortcut})` : ""}
        </span>
      ) : null}
      {/* A span, not a div, so a tooltip is valid wherever its trigger is — inside a
          sentence, a label, a table cell. Closed, the UA hides it; open, it is a block. */}
      {mounted ? (
        <span
          ref={pop.panelRef}
          id={id}
          popover="manual"
          role={trigger === "click" ? "status" : "tooltip"}
          data-instant={instant || undefined}
          className={`${popoverPanel} overflow-visible border-0 open:block ${trigger === "hover" ? "pointer-events-none" : ""} ${bubble(wide)}`}
        >
          <BubbleBody shortcut={shortcut} wide={wide}>
            {content}
          </BubbleBody>
        </span>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------- Hover card ---- */

const cardSkin = {
  // Inverted like a tooltip — for a card that is really a big label: a preview, a caption.
  tip: "ws-tip",
  // On the raised surface — for a card with real controls and data, like a menu.
  raised: "ws-raised bg-surface-raised text-text-primary shadow-[var(--ws-shadow-overlay)] [--ws-arrow-fill:var(--ws-surface-raised)]",
};

/** Interactive content anchored to a trigger — a citation, a tutorial, a preview of what
 *  a setting does. Its card follows the trigger in the DOM (that is what puts it next in
 *  the tab order), so put triggers in a div, not a <p>: a card is block content.
 *  Architecturally not a big tooltip: the pointer can travel from the
 *  trigger into the card (the close waits `closeDelay`, and entering the card cancels it),
 *  the card takes focus — Tab from the trigger moves into it, since it follows the trigger
 *  in the DOM — and it is a non-modal dialog, not a tooltip.
 *
 *  `trigger="hover"` also opens on keyboard focus and, on touch, on tap. `trigger="click"`
 *  is the click-to-reveal card: pressed open, closed by an outside press or Escape. */
export function HoverCard({
  label,
  card,
  children,
  trigger = "hover",
  side = "bottom",
  align = "center",
  surface = "tip",
  openDelay = 250,
  closeDelay = 200,
  inline = false,
  className = "",
}: {
  /** The card's accessible name — "Source: Reading a candlestick chart". */
  label: string;
  card: ReactNode;
  /** The trigger. Omit it with `inline` to draw only the card. */
  children?: ReactNode;
  trigger?: TriggerMode;
  side?: Side;
  align?: "start" | "center" | "end";
  surface?: keyof typeof cardSkin;
  openDelay?: number;
  closeDelay?: number;
  /** Draw the card in place, open, with its arrow pointing back at where the trigger
   *  would be. */
  inline?: boolean;
  className?: string;
}) {
  const id = useId();
  const { wrap, anchor } = useTrigger(false);
  const pop = usePopover({ mode: "manual", side, align, gap: 10 });
  const [mounted, setMounted] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const want = useRef(false);
  const skin = `overflow-visible rounded-xl border-0 p-0 ${cardSkin[surface]} ${className}`;

  const reveal = () => {
    want.current = true;
    if (!mounted) setMounted(true);
    else pop.show(anchor());
  };
  useLayoutEffect(() => {
    if (mounted && want.current && !pop.open) pop.show(anchor());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);
  const later = (fn: () => void, ms: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(fn, ms);
  };
  const close = (restoreFocus = false) => {
    window.clearTimeout(timer.current);
    want.current = false;
    pop.hide(restoreFocus);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    const el = anchor();
    if (!el || inline) return;
    el.setAttribute("aria-haspopup", "dialog");
    el.setAttribute("aria-expanded", String(pop.open));
    el.setAttribute("aria-controls", id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pop.open, inline, id]);

  const leftFor = (e: FocusEvent) => {
    const next = e.relatedTarget as Node | null;
    return !next || !(pop.panelRef.current?.contains(next) || anchor()?.contains(next));
  };

  const body = (
    <>
      <div className="overflow-hidden rounded-[inherit]">{card}</div>
      <span aria-hidden="true" className="ws-tip-arrow" />
    </>
  );

  if (inline)
    return (
      <div role="group" aria-label={label} data-side={side} className={`relative ${skin}`}>
        {body}
      </div>
    );

  const handlers =
    trigger === "click"
      ? { onClick: () => (pop.open ? close() : reveal()) }
      : {
          onPointerEnter: (e: PointerEvent) => e.pointerType !== "touch" && later(reveal, openDelay),
          onPointerLeave: (e: PointerEvent) => e.pointerType !== "touch" && later(() => close(), closeDelay),
          onPointerDown: (e: PointerEvent) => {
            if (e.pointerType === "touch") pop.open ? close() : reveal();
          },
          onFocus: (e: FocusEvent) => (e.target as HTMLElement).matches(":focus-visible") && reveal(),
          onBlur: (e: FocusEvent) => leftFor(e) && later(() => close(), closeDelay),
        };

  return (
    <>
      <span ref={wrap} {...handlers} className="contents">
        {children}
      </span>
      {mounted ? (
        <div
          ref={pop.panelRef}
          id={id}
          popover="manual"
          role="dialog"
          aria-label={label}
          onPointerEnter={() => window.clearTimeout(timer.current)}
          onPointerLeave={(e) => trigger === "hover" && e.pointerType !== "touch" && later(() => close(), closeDelay)}
          onBlur={(e) => leftFor(e) && close()}
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            e.preventDefault();
            close(true);
          }}
          className={`${popoverPanel} ${skin}`}
        >
          {body}
        </div>
      ) : null}
    </>
  );
}

/* ---------------------------------------------------------------- Callout ---- */

/** A short label with an arrow, set into dense content by the layout rather than floated
 *  off a trigger — a step on an order timeline, a leg of an itinerary. It is always
 *  visible, so it is plain text to assistive tech, not a tooltip. Two fills, both fixed
 *  across themes like a tooltip: `dark` and `light`. `meta` is the figure chip — a
 *  duration, a price — in the opposite fill. */
export function Callout({
  children,
  meta,
  tone = "dark",
  pointer = "down",
  arrowAt,
  className = "",
}: {
  children: ReactNode;
  meta?: ReactNode;
  tone?: "dark" | "light";
  /** Which way the arrow points — at what the callout labels. */
  pointer?: "up" | "down";
  /** Where along the bottom (or top) edge the arrow sits — "50%", "24px". */
  arrowAt?: string;
  className?: string;
}) {
  return (
    <span
      data-side={pointer === "down" ? "top" : "bottom"}
      style={arrowAt ? ({ "--ws-anchor-x": arrowAt } as CSSProperties) : undefined}
      className={`relative inline-flex items-center gap-2 rounded-full py-1 pr-1 pl-3 text-[12.5px] leading-5 font-medium whitespace-nowrap ${tone === "dark" ? "ws-tip" : "ws-tip-light"} ${
        meta ? "" : "pr-3"
      } ${className}`}
    >
      {children}
      {meta ? (
        <span className={`rounded-full px-2 py-px text-[11.5px] font-semibold tabular-nums ${tone === "dark" ? "bg-tip-text text-tip" : "bg-tip text-tip-text"}`}>{meta}</span>
      ) : null}
      <span aria-hidden="true" className="ws-tip-arrow" />
    </span>
  );
}
