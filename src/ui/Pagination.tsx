import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/20/solid";
import { useId, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type FormEvent, type RefObject } from "react";
import type { Domain } from "./Badge";
import { Button, IconButton } from "./Button";
import { Dropdown } from "./Dropdown";
import { FieldMessage } from "./Field";
import { InputField } from "./InputField";
import { pageRange, resolvePage } from "./pageRange";

export { pageRange, resolvePage, type PageItem } from "./pageRange";

/* Pagination: one component, six ways of drawing the same state — which page you are on,
   how many there are, and how to get to another one.

   Shared rules, decided once here:
   - A single page renders nothing. There is nowhere to go.
   - At the ends, First/Previous or Next/Last stay in place, dimmed. They are
     aria-disabled rather than disabled, so pressing Next onto the last page does not
     throw keyboard focus back to the top of the document.
   - No total? Previous and Next only, with "Page 4" between them, in every variant.
   - While a page is loading every control is dimmed and every press is dropped — not
     queued to fire when the data lands. Presses still land on the control (no
     pointer-events: none), so clicking one keeps focus where it is instead of dropping
     it to the page. The content area shows its own loading state.
   - The row measures itself against its own container, not the window. Numbered,
     labeled and circular hand over to the counter the moment their full row would not
     fit; inline drops its sibling pages instead. Measured, not guessed from a
     breakpoint — three pages fit where twenty-four do not, and touch-sized controls
     need more room than mouse-sized ones. Give it a width: w-full, or flex-1 in a footer.
   - A polite live region says "Page 4 of 26" after every change, because the control
     that was pressed is usually still focused and nothing else is announced. */

export type PaginationVariant = "numbered" | "counter" | "labeled" | "inline" | "circular" | "motion";

export type PaginationProps = {
  variant?: PaginationVariant;
  /** One-based. */
  page: number;
  /** Leave it off when the total is unknown — a cursor-paged feed. */
  count?: number;
  /** With no count: whether a next page exists. */
  hasNext?: boolean;
  onPage: (page: number) => void;
  loading?: boolean;
  /** Pages either side of the current one before an ellipsis. */
  siblings?: number;
  align?: "start" | "center" | "end";
  /** The motion variant's current-page fill and arrow highlight. Finance is the brand gold. */
  accent?: Domain;
  /** The nav's name — two paginations on one screen need two names. */
  label?: string;
  className?: string;
};

type Ctx = {
  /** The row's own alignment, as margins — full rows are w-max and measured. */
  row: string;
  /** The same alignment for a row that may wrap. */
  justify: string;
  /** The full row does not fit its container. */
  narrow: boolean;
  /** Where the full row is measured. */
  full: RefObject<HTMLDivElement | null>;
  page: number;
  count: number;
  atStart: boolean;
  atEnd: boolean;
  loading: boolean;
  siblings: number;
  accent: Domain;
  go: (page: number) => void;
};

const margins = { start: "mr-auto", center: "mx-auto", end: "ml-auto" };
const justify = { start: "justify-start", center: "justify-center", end: "justify-end" };

/** Whether the full row fits. The full row is w-max, so its scrollWidth is what it needs;
 *  that is remembered while the compact row is showing, and compared again whenever the
 *  container resizes or the component renders. Both run before paint, so a row that is
 *  too wide is never seen. */
function useFit(active: boolean) {
  const nav = useRef<HTMLElement>(null);
  const full = useRef<HTMLDivElement>(null);
  const need = useRef(0);
  const [narrow, setNarrow] = useState(false);
  const check = () => {
    if (!active || !nav.current) return;
    if (full.current) need.current = full.current.scrollWidth;
    setNarrow(nav.current.clientWidth < need.current);
  };
  useLayoutEffect(check);
  useLayoutEffect(() => {
    if (!active || !nav.current) return;
    const ro = new ResizeObserver(check);
    ro.observe(nav.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  return { nav, full, narrow: active && narrow };
}

export function Pagination({
  variant = "numbered",
  page,
  count,
  hasNext = false,
  onPage,
  loading = false,
  siblings = 1,
  align = "center",
  accent = "finance",
  label = "Pagination",
  className = "",
}: PaginationProps) {
  const known = count !== undefined;
  const hidden = known ? count <= 1 : page <= 1 && !hasNext;
  // The counter is already compact; the unknown-total row is three controls.
  const fit = useFit(!hidden && known && variant !== "counter");
  if (hidden) return null;

  const ctx: Ctx = {
    row: margins[align],
    justify: justify[align],
    narrow: fit.narrow,
    full: fit.full,
    page,
    count: count ?? page + (hasNext ? 1 : 0),
    atStart: page <= 1,
    atEnd: known ? page >= count : !hasNext,
    loading,
    siblings,
    accent,
    go: (n) => {
      if (loading || n === page || n < 1 || (known && n > count)) return;
      onPage(n);
    },
  };
  return (
    <nav
      ref={fit.nav}
      aria-label={label}
      aria-busy={loading || undefined}
      className={`w-full min-w-0 transition-opacity duration-150 aria-busy:opacity-50 aria-busy:[&_button]:cursor-progress ${className}`}
    >
      {!known ? (
        <UnknownTotal ctx={ctx} variant={variant} />
      ) : variant === "counter" ? (
        <Counter ctx={ctx} />
      ) : variant === "labeled" ? (
        <Labeled ctx={ctx} />
      ) : variant === "inline" ? (
        <Inline ctx={ctx} />
      ) : variant === "circular" ? (
        <Circular ctx={ctx} />
      ) : variant === "motion" ? (
        <Motion ctx={ctx} />
      ) : (
        <Numbered ctx={ctx} />
      )}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {known ? `Page ${page} of ${count}` : `Page ${page}`}
      </p>
    </nav>
  );
}

/* ------------------------------------------------------------ Pieces ---- */

type ArrowLook = "ghost" | "contrast" | "motion";
type Icon = ComponentType<{ className?: string }>;

const motionHover: Record<Domain, string> = {
  finance: "hover:text-action-primary-text! focus-visible:text-action-primary-text!",
  social: "hover:text-domain-social! focus-visible:text-domain-social!",
  vivid: "hover:text-domain-vivid! focus-visible:text-domain-vivid!",
  xstream: "hover:text-domain-xstream! focus-visible:text-domain-xstream!",
  marketplace: "hover:text-domain-marketplace! focus-visible:text-domain-marketplace!",
  vision: "hover:text-domain-vision! focus-visible:text-domain-vision!",
  academy: "hover:text-domain-academy! focus-visible:text-domain-academy!",
  prediction: "hover:text-domain-prediction! focus-visible:text-domain-prediction!",
};

/** Previous, Next, First or Last. At a boundary it stays where it is, dimmed. */
function Arrow({ ctx, dir, look = "ghost", icon }: { ctx: Ctx; dir: "first" | "prev" | "next" | "last"; look?: ArrowLook; icon?: Icon }) {
  const off = dir === "first" || dir === "prev" ? ctx.atStart : ctx.atEnd;
  const target = { first: 1, prev: ctx.page - 1, next: ctx.page + 1, last: ctx.count }[dir];
  const label = { first: "First page", prev: "Previous page", next: "Next page", last: "Last page" }[dir];
  const glyph =
    icon ?? { first: ChevronDoubleLeftIcon, prev: ChevronLeftIcon, next: ChevronRightIcon, last: ChevronDoubleRightIcon }[dir];
  return (
    <IconButton
      icon={glyph}
      label={label}
      variant={look === "contrast" ? "contrast" : "ghost"}
      shape={look === "ghost" ? "default" : "pill"}
      size={look === "motion" && !ctx.narrow ? "lg" : "md"}
      aria-disabled={off || ctx.loading || undefined}
      onClick={() => (off ? undefined : ctx.go(target))}
      className={
        off
          ? // Dimmed and inert to hover, but still a real target: a press on it keeps focus.
            `cursor-not-allowed opacity-40 shadow-none ${look === "contrast" ? "hover:opacity-40!" : "hover:bg-transparent! hover:text-text-secondary!"}`
          : look === "motion"
            ? `text-text-primary! hover:bg-transparent! [&_svg]:transition-[scale] [&_svg]:duration-(--ws-duration-fast) [&_svg]:ease-(--ws-ease-standard) hover:[&_svg]:scale-125 focus-visible:[&_svg]:scale-125 ${motionHover[ctx.accent]}`
            : ""
      }
    />
  );
}

type PageLook = "square" | "pill" | "plain" | "track";

const pageLooks: Record<PageLook, { shape: string; on: string; idle: string }> = {
  square: {
    shape: "h-9 min-w-9 rounded-md",
    on: "bg-text-primary font-semibold text-surface-sunken",
    idle: "text-text-secondary hover:bg-text-primary/[0.06] hover:text-text-primary",
  },
  pill: {
    shape: "h-9 min-w-9 rounded-full",
    on: "bg-text-primary font-semibold text-surface-sunken",
    idle: "text-text-secondary hover:bg-text-primary/[0.06] hover:text-text-primary",
  },
  // The lowest-weight look: no fill at rest, and the current page is ringed and set in
  // semibold — a shape and a weight, not only a colour.
  plain: {
    shape: "h-9 min-w-8 rounded-md",
    on: "font-semibold text-text-primary ring-1 ring-border-strong ring-inset",
    idle: "text-text-secondary hover:text-text-primary hover:underline hover:underline-offset-4",
  },
  track: {
    shape: "h-8 min-w-8 rounded-full",
    on: "bg-text-primary font-semibold text-surface-sunken",
    idle: "text-text-secondary hover:bg-text-primary/[0.07] hover:text-text-primary",
  },
};

/** The numbered pages and their ellipses. Keyed by page number, so the button you
 *  pressed is the same element afterwards and keeps focus as the range shifts. */
function Pages({ ctx, look, siblings = ctx.siblings, className = "" }: { ctx: Ctx; look: PageLook; siblings?: number; className?: string }) {
  const { shape, on, idle } = pageLooks[look];
  return (
    <ul className={`flex items-center ${look === "plain" ? "gap-0.5" : "gap-1"} ${className}`}>
      {pageRange(ctx.page, ctx.count, siblings).map((item) =>
        typeof item === "number" ? (
          <li key={item}>
            <button
              type="button"
              aria-label={`Page ${item}`}
              aria-current={item === ctx.page ? "page" : undefined}
              aria-disabled={ctx.loading || undefined}
              onClick={() => ctx.go(item)}
              className={`ws-control-button ws-pressable-flat inline-flex items-center justify-center px-2 text-[13px] font-medium tabular-nums transition-[background-color,color,box-shadow] duration-150 ${shape} ${
                item === ctx.page ? on : idle
              }`}
            >
              {item}
            </button>
          </li>
        ) : (
          // Nothing to announce: the numbers either side already say what is skipped.
          <li key={item} aria-hidden="true" className={`grid place-items-center text-text-secondary ${look === "track" ? "min-w-6" : "min-w-7"}`}>
            <EllipsisHorizontalIcon className="size-4" />
          </li>
        ),
      )}
    </ul>
  );
}

/** A select of every page, for the "Page [4] of 26" jump. Sized for the longest page
 *  number, so the row does not shift as you page through it. */
function PageSelect({ ctx, value, onChange, label, pill = false }: { ctx: Ctx; value: number; onChange: (page: number) => void; label: string; pill?: boolean }) {
  const options = useMemo(
    () => Array.from({ length: ctx.count }, (_, i) => ({ label: String(i + 1), value: String(i + 1) })),
    [ctx.count],
  );
  return (
    <div className="shrink-0" style={{ width: `calc(${String(ctx.count).length}ch + ${pill ? 3.5 : 3.25}rem)` }}>
      <Dropdown
        size="md"
        pill={pill}
        hideLabel
        label={label}
        options={options}
        // A long list gets a search box: typing "18" beats scrolling to it.
        searchable={ctx.count > 12}
        value={String(value)}
        onChange={(v) => onChange(Number(v))}
      />
    </div>
  );
}

/* ---------------------------------------------------------- Variants ---- */

/** 1 · Full numbered — First, Previous, pages with ellipses, Next, Last. */
function Numbered({ ctx }: { ctx: Ctx }) {
  if (ctx.narrow) return <Counter ctx={ctx} />;
  return (
    <div ref={ctx.full} className={`flex w-max items-center gap-1 ${ctx.row}`}>
      <Arrow ctx={ctx} dir="first" />
      <Arrow ctx={ctx} dir="prev" />
      <Pages ctx={ctx} look="square" className="mx-1" />
      <Arrow ctx={ctx} dir="next" />
      <Arrow ctx={ctx} dir="last" />
    </div>
  );
}

/** 2 · Compact counter — Previous, "Page [4] of 26", Next. */
function Counter({ ctx, look = "ghost" }: { ctx: Ctx; look?: ArrowLook }) {
  return (
    <div className={`flex w-max items-center gap-2 ${ctx.row}`}>
      <Arrow ctx={ctx} dir="prev" look={look} />
      <div className="flex items-center gap-2 text-[13px] text-text-secondary">
        <span aria-hidden="true">Page</span>
        {/* ponytail: one option per page; past a few hundred pages this wants a typed jump instead. */}
        <PageSelect ctx={ctx} value={ctx.page} onChange={ctx.go} label={`Page, of ${ctx.count}`} pill={look === "contrast"} />
        <span aria-hidden="true" className="tabular-nums">
          of {ctx.count}
        </span>
      </div>
      <Arrow ctx={ctx} dir="next" look={look} />
    </div>
  );
}

/** 3 · Labeled — "Previous" and "Next" in words, pill pages, and the page select. */
function Labeled({ ctx }: { ctx: Ctx }) {
  if (ctx.narrow) return <Counter ctx={ctx} />;
  const [prevOff, nextOff] = [ctx.atStart, ctx.atEnd];
  const dim = "cursor-not-allowed opacity-40 hover:bg-transparent! hover:text-text-secondary!";
  return (
    <div ref={ctx.full} className={`flex w-max items-center gap-x-6 ${ctx.row}`}>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          prefixIcon={ChevronLeftIcon}
          aria-disabled={prevOff || ctx.loading || undefined}
          onClick={() => (prevOff ? undefined : ctx.go(ctx.page - 1))}
          className={`pl-3 ${prevOff ? dim : ""}`}
        >
          Previous
        </Button>
        <Pages ctx={ctx} look="pill" className="mx-1" />
        <Button
          variant="ghost"
          suffixIcon={ChevronRightIcon}
          aria-disabled={nextOff || ctx.loading || undefined}
          onClick={() => (nextOff ? undefined : ctx.go(ctx.page + 1))}
          className={`pr-3 ${nextOff ? dim : ""}`}
        >
          Next
        </Button>
      </div>
      <div className="flex items-center gap-2 text-[13px] text-text-secondary">
        <span aria-hidden="true">Page</span>
        <PageSelect ctx={ctx} value={ctx.page} onChange={ctx.go} label={`Page, of ${ctx.count}`} />
        <span aria-hidden="true" className="tabular-nums">
          of {ctx.count}
        </span>
      </div>
    </div>
  );
}

/** 4 · Inline — arrows, plain numbers and a typed "Go to". Table's default. Narrow, it
 *  keeps its shape and drops the sibling pages; the jump box wraps under the numbers if
 *  it still has to. */
function Inline({ ctx }: { ctx: Ctx }) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string>();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (ctx.loading) return;
    const result = resolvePage(draft, ctx.count);
    setNote(result.note);
    if (result.page === null) return;
    // A clamped jump leaves the page it landed on in the box, beside the reason.
    setDraft(result.note ? String(result.page) : "");
    ctx.go(result.page);
  };

  return (
    <>
      <div
        ref={ctx.narrow ? undefined : ctx.full}
        className={`flex items-center gap-x-5 gap-y-2 ${ctx.narrow ? `flex-wrap ${ctx.justify}` : `w-max ${ctx.row}`}`}
      >
        <div className="flex items-center gap-1">
          <Arrow ctx={ctx} dir="prev" />
          <Pages ctx={ctx} look="plain" siblings={ctx.narrow ? 0 : ctx.siblings} />
          <Arrow ctx={ctx} dir="next" />
        </div>
        <form onSubmit={submit} noValidate className="flex items-center gap-2">
          <label htmlFor={id} className="text-[13px] text-text-secondary">
            Go to<span className="sr-only"> page, 1 to {ctx.count}</span>
          </label>
          <InputField
            id={id}
            fieldSize="md"
            hideMessage
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="go"
            value={draft}
            error={note}
            onChange={(e) => {
              // Letters never reach the box; the message says why the key did nothing.
              const digits = e.target.value.replace(/\D/g, "");
              setDraft(digits);
              setNote(digits === e.target.value ? undefined : "Use digits only.");
            }}
            className="w-[4.5rem] [&_input]:text-center [&_input]:tabular-nums"
          />
        </form>
      </div>
      <div aria-live="polite" className={`flex ${ctx.justify}`}>
        {note ? (
          <div className="mt-2">
            <FieldMessage id={`${id}-message`} error={note} />
          </div>
        ) : null}
      </div>
    </>
  );
}

/** 5 · Circular — dark round arrows, pages on a pill track, and "Go to page [4] Go". */
function Circular({ ctx }: { ctx: Ctx }) {
  // The select stages a page; Go commits it. When the page changes some other way the
  // staged value follows it.
  const [pick, setPick] = useState(ctx.page);
  const [seen, setSeen] = useState(ctx.page);
  if (seen !== ctx.page) {
    setSeen(ctx.page);
    setPick(ctx.page);
  }
  if (ctx.narrow) return <Counter ctx={ctx} look="contrast" />;
  return (
    <div ref={ctx.full} className={`flex w-max items-center gap-x-6 ${ctx.row}`}>
      <div className="flex items-center gap-2">
        <Arrow ctx={ctx} dir="prev" look="contrast" />
        <Pages ctx={ctx} look="track" className="rounded-full bg-text-primary/[0.05] p-0.5" />
        <Arrow ctx={ctx} dir="next" look="contrast" />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ctx.go(pick);
        }}
        className="flex items-center gap-2"
      >
        <span aria-hidden="true" className="text-[13px] text-text-secondary">
          Go to page
        </span>
        <PageSelect ctx={ctx} value={pick} onChange={setPick} label="Go to page" pill />
        <Button type="submit" variant="contrast" shape="pill" aria-disabled={ctx.loading || undefined}>
          Go
        </Button>
      </form>
    </div>
  );
}

/* 6 · Motion — the current page sits in the middle and the row slides under it. Each
   number's place, disc and figure come from its distance to the current page, so a page
   change is only new numbers in the same slots: every number glides to its new slot and
   rescales on the Toast's duration and curve. Reduced motion turns every transition off
   globally, which leaves the swap instant. Past ±2 a number is a hint of more — too
   small to read or press, so it is hidden from assistive tech and takes no pointer.
   Narrow, the row keeps its shape: ±2 is the last visible slot, the slots close up by a
   tenth and the arrows drop to 36px (44px on touch, where the row is 272px). */

const slots = [
  { x: 0, disc: 1, text: 1, alpha: 1, hit: 40 },
  { x: 42, disc: 0.8, text: 0.87, alpha: 1, hit: 34 },
  { x: 77, disc: 0.64, text: 0.76, alpha: 1, hit: 30 },
  { x: 106, disc: 0.5, text: 0.64, alpha: 0.45, hit: 24 },
  { x: 128, disc: 0.4, text: 0.5, alpha: 0, hit: 20 },
  { x: 146, disc: 0.3, text: 0.4, alpha: 0, hit: 20 },
];
const REACH = slots.length - 1;

const motionFill: Record<Domain, string> = {
  finance: "bg-action-primary",
  social: "bg-domain-social",
  vivid: "bg-domain-vivid",
  xstream: "bg-domain-xstream",
  marketplace: "bg-domain-marketplace",
  vision: "bg-domain-vision",
  academy: "bg-domain-academy",
  prediction: "bg-domain-prediction",
};

const glide = "duration-(--ws-duration-slow) ease-(--ws-ease-standard)";

function Motion({ ctx }: { ctx: Ctx }) {
  const pages: number[] = [];
  for (let n = Math.max(1, ctx.page - REACH); n <= Math.min(ctx.count, ctx.page + REACH); n++) pages.push(n);
  const onText = ctx.accent === "finance" ? "text-text-on-accent" : "text-text-on-domain";
  return (
    <div ref={ctx.narrow ? undefined : ctx.full} className={`flex w-max items-center gap-1 ${ctx.row}`}>
      <Arrow ctx={ctx} dir="prev" look="motion" icon={ArrowLeftIcon} />
      <ul className={`relative h-14 shrink-0 overflow-x-clip ${ctx.narrow ? "w-[172px]" : "w-[244px]"}`}>
        {pages.map((n) => {
          const d = n - ctx.page;
          const slot = slots[Math.abs(d)];
          const live = Math.abs(d) <= 2;
          const alpha = ctx.narrow && Math.abs(d) > 2 ? 0 : slot.alpha;
          const x = Math.sign(d) * slot.x * (ctx.narrow ? 0.9 : 1);
          const current = d === 0;
          return (
            <li
              key={n}
              aria-hidden={live ? undefined : true}
              className={`absolute top-1/2 left-1/2 transition-[translate,opacity] ${glide} ${live ? "" : "pointer-events-none"}`}
              style={{ translate: `calc(-50% + ${x}px) -50%`, opacity: alpha }}
            >
              <button
                type="button"
                tabIndex={live ? undefined : -1}
                aria-label={`Page ${n}`}
                aria-current={current ? "page" : undefined}
                aria-disabled={ctx.loading || undefined}
                onClick={() => ctx.go(n)}
                className={`group/page relative grid h-10 place-items-center rounded-full outline-none ${current ? onText : "text-text-secondary hover:text-text-primary"}`}
                style={{ width: ctx.narrow ? slot.hit - 2 : slot.hit }}
              >
                <span
                  aria-hidden="true"
                  className={`absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[scale,background-color] ${glide} group-focus-visible/page:outline-2 group-focus-visible/page:outline-offset-2 group-focus-visible/page:outline-action-primary ${
                    current ? `${motionFill[ctx.accent]} shadow-[0_4px_12px_-4px_color-mix(in_srgb,currentColor_30%,transparent)]` : "bg-text-primary/[0.07] group-hover/page:bg-text-primary/[0.12]"
                  }`}
                  style={{ scale: slot.disc }}
                />
                <span className={`relative text-[15px] font-semibold tabular-nums transition-[scale] ${glide}`} style={{ scale: slot.text }}>
                  {n}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <Arrow ctx={ctx} dir="next" look="motion" icon={ArrowRightIcon} />
    </div>
  );
}

/** Any variant without a total: Previous, "Page 4", Next. */
function UnknownTotal({ ctx, variant }: { ctx: Ctx; variant: PaginationVariant }) {
  const look: ArrowLook = variant === "circular" ? "contrast" : variant === "motion" ? "motion" : "ghost";
  const icons = variant === "motion" ? [ArrowLeftIcon, ArrowRightIcon] : [undefined, undefined];
  return (
    <div className={`flex w-max items-center gap-2 ${ctx.row}`}>
      <Arrow ctx={ctx} dir="prev" look={look} icon={icons[0]} />
      <span className="min-w-16 text-center text-[13px] tabular-nums text-text-secondary">Page {ctx.page}</span>
      <Arrow ctx={ctx} dir="next" look={look} icon={icons[1]} />
    </div>
  );
}
