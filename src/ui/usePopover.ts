import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { placeAgainst, type Side } from "./anchor";

/** A popover in the top layer, placed by usePopover. It grows in from the trigger. */
export const popoverPanel =
  "fixed inset-auto m-0 transition-[opacity,scale] duration-[var(--ws-duration-fast)] ease-[var(--ws-ease-entrance)] starting:scale-[0.97] starting:opacity-0";

/** The one overlay mechanism. A native popover — top layer, so no scroll container can
 *  clip it — placed against its anchor with placeAgainst, following the anchor when the
 *  page scrolls.
 *
 *  `auto` (menus, the select, the calendar): the browser supplies light-dismiss —
 *  outside click and Escape — and focus goes back to the anchor when it closes.
 *  `manual` (Search, Combobox): the panel hangs off a text field that keeps focus while
 *  you type, so clicks on the field must not close it; outside presses and Escape are
 *  handled here instead. */
export function usePopover({
  align = "start",
  matchWidth = false,
  mode = "auto",
  side = "bottom",
  gap,
  dismissOnOutside = true,
}: {
  align?: "start" | "center" | "end";
  /** Where the panel goes; it flips to the opposite side when there is no room. */
  side?: Side;
  /** Space between anchor and panel — more when the panel carries an arrow. */
  gap?: number;
  /** Manual mode only: an outside press closes it. A tour step stays put instead. */
  dismissOnOutside?: boolean;
  /** `true`: exactly the anchor's width (a results list under its field). `"min"`: at
   *  least the anchor's width, wider when the content needs it (a select whose options
   *  carry descriptions). */
  matchWidth?: boolean | "min";
  mode?: "auto" | "manual";
} = {}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const openAtPress = useRef(false);
  const placeRef = useRef<() => void>(() => undefined);
  const [open, setOpen] = useState(false);

  const isOpen = () => Boolean(panelRef.current?.matches(":popover-open"));
  const show = (anchor?: HTMLElement | null) => {
    if (anchor) anchorRef.current = anchor;
    if (!isOpen()) panelRef.current?.showPopover();
    setOpen(true);
  };
  const hide = (restoreFocus = false) => {
    if (isOpen()) panelRef.current?.hidePopover();
    setOpen(false);
    if (restoreFocus) anchorRef.current?.focus();
  };

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const anchor = anchorRef.current;
    if (!open || !panel || !anchor) return;
    const place = () => {
      const w = `${anchor.getBoundingClientRect().width}px`;
      if (matchWidth === "min") panel.style.minWidth = w;
      else if (matchWidth) panel.style.width = w;
      placeAgainst(anchorRef.current ?? anchor, panel, { side, align, gap });
    };
    placeRef.current = place;
    place();
    // Follow the anchor when the page scrolls. Scrolling inside the panel is its own.
    let raf = 0;
    const follow = (e: Event) => {
      // A resize's target is the window, which is not a Node — contains() would throw.
      if (e.target instanceof Node && panel.contains(e.target)) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(place);
    };
    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", follow, true);
      window.removeEventListener("resize", follow);
    };
  }, [open, align, matchWidth, side, gap]);

  // Light-dismiss closes an auto popover without telling React; the toggle event does.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const onToggle = (e: Event) => {
      const next = (e as ToggleEvent).newState === "open";
      setOpen(next);
      if (!next && panel.contains(document.activeElement)) anchorRef.current?.focus();
    };
    panel.addEventListener("toggle", onToggle);
    return () => panel.removeEventListener("toggle", onToggle);
  }, []);

  useEffect(() => {
    if (mode !== "manual" || !open) return;
    const onDown = (e: globalThis.PointerEvent) => {
      const t = e.target as Node;
      if (!dismissOnOutside || panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      hide();
    };
    // preventDefault: inside a modal, Escape closes this panel and not the modal too. In
    // the capture phase, so it runs before React's handlers — one of those closing the
    // panel would remove this listener before a bubbling event ever reached it.
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      hide();
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, dismissOnOutside]);

  /* For a button that toggles the panel. Pressing it while open is an outside press as far
     as light-dismiss is concerned, so the panel is already closing by the time the click
     lands — remembering the state at press time stops the click reopening it. */
  const triggerHandlers = {
    onPointerDown: (_e: PointerEvent<HTMLElement>) => {
      openAtPress.current = isOpen();
    },
    onClick: (e: MouseEvent<HTMLElement>) => {
      if (openAtPress.current) {
        openAtPress.current = false;
        hide();
        return;
      }
      show(e.currentTarget);
    },
  };

  /** Re-place against the current anchor — after moving to a new one while open. */
  const update = () => placeRef.current();

  return { panelRef, anchorRef, open, show, hide, update, triggerHandlers };
}

