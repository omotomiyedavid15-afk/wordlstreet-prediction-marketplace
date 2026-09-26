/* Places a fixed-position panel (a popover in the top layer) against the element that
   opened it. The one positioning engine: menus, the select, popovers, tooltips, hover
   cards and tour coachmarks all call this, so "on the side you asked for, flipped to the
   opposite side when there is no room, slid along its edge to stay on screen" is written
   once.

   It also tells the panel where it ended up, for the arrow: data-side is the side it
   landed on, and --ws-anchor-x / --ws-anchor-y are where the anchor's centre falls inside
   the panel — so an arrow keeps pointing at the trigger even after the panel has been
   pushed in from the viewport edge. */

export type Side = "top" | "bottom" | "left" | "right";
export type Placement = { side: Side; align: "start" | "center" | "end"; gap?: number };

const GAP = 6;
const EDGE = 8;
const opposite: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };
const clamp = (n: number, min: number, max: number) => Math.min(Math.max(min, n), max);

export function placeAgainst(anchor: HTMLElement, panel: HTMLElement, want: Placement): Side {
  const gap = want.gap ?? GAP;
  const a = anchor.getBoundingClientRect();
  const p = panel.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const fits: Record<Side, boolean> = {
    bottom: a.bottom + gap + p.height <= vh - EDGE,
    top: a.top - gap - p.height >= EDGE,
    right: a.right + gap + p.width <= vw - EDGE,
    left: a.left - gap - p.width >= EDGE,
  };
  const side = !fits[want.side] && fits[opposite[want.side]] ? opposite[want.side] : want.side;
  const along = (size: number, anchorStart: number, anchorSize: number) =>
    want.align === "start" ? anchorStart : want.align === "end" ? anchorStart + anchorSize - size : anchorStart + anchorSize / 2 - size / 2;

  let top: number;
  let left: number;
  if (side === "top" || side === "bottom") {
    top = Math.max(EDGE, side === "bottom" ? a.bottom + gap : a.top - gap - p.height);
    left = clamp(along(p.width, a.left, a.width), EDGE, vw - p.width - EDGE);
  } else {
    left = Math.max(EDGE, side === "right" ? a.right + gap : a.left - gap - p.width);
    top = clamp(along(p.height, a.top, a.height), EDGE, vh - p.height - EDGE);
  }

  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
  panel.dataset.side = side;
  // Grow from the trigger, not the panel's centre.
  const x = want.align === "start" ? "left" : want.align === "end" ? "right" : "center";
  const y = want.align === "start" ? "top" : want.align === "end" ? "bottom" : "center";
  panel.style.transformOrigin =
    side === "bottom" ? `${x} top` : side === "top" ? `${x} bottom` : side === "right" ? `left ${y}` : `right ${y}`;
  panel.style.setProperty("--ws-anchor-x", `${a.left + a.width / 2 - left}px`);
  panel.style.setProperty("--ws-anchor-y", `${a.top + a.height / 2 - top}px`);
  return side;
}
