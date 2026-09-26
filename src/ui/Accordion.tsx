import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import { createContext, useContext, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { ProgressBar } from "./Progress";
import { Spinner } from "./Spinner";
import { Tooltip } from "./Tooltip";

/* Sections that open in place. One engine — a real <button> with aria-expanded and
   aria-controls, a panel that grows on the toast's curve — dressed five ways by where it
   sits, plus two compositions built on it: the setup Checklist and the one-line Disclosure.

     contained   one bordered container, hairlines between rows — glossary, fees, FAQ
     highlight   the open row is painted in a gold tint — a help-centre FAQ with a CTA
     separated   each item its own block, space between — unrelated settings sections
     inset       inside a Drawer or Modal: the panel's well, no border of its own
     plain       no chrome at all — the sections of a record panel (Table's DetailSection)

   The container decides the chrome. A panel already has its own edge, so an accordion
   inside one never adds a second border or a divider — that is what inset and plain are. */

export type AccordionVariant = "contained" | "highlight" | "separated" | "inset" | "plain" | "nav";
export type AccordionIndicator = "end" | "start" | "plus";

type Skin = {
  root: string;
  item: (open: boolean) => string;
  trigger: (open: boolean) => string;
  title: string;
  body: string;
  /** The surface under a scrolling panel, so the scroll shades match it. */
  scroll?: string;
};

/* A separated block's open body — the checklist's task list — sits one step darker than
   its header, recessed into the block the way an inset section sits in a drawer's well.
   Connected lists (contained, highlight) stay one flat surface: their rows read as one
   sheet, and a dark slab inside a row breaks it (both user-directed, 2026-09-12). */
const recess = "bg-surface-sunken";

const skins: Record<AccordionVariant, Skin> = {
  contained: {
    root: "overflow-hidden rounded-xl border border-border-default",
    item: (open) => `border-t border-text-primary/[0.07] first:border-t-0 transition-colors duration-[var(--ws-duration-base)] ${open ? "bg-text-primary/[0.03]" : ""}`,
    trigger: () => "min-h-12 px-4 py-3 enabled:hover:bg-text-primary/[0.04]",
    title: "text-[14px] font-medium text-text-primary",
    body: "px-4 pb-4 text-[13.5px] leading-relaxed text-text-secondary",
  },
  highlight: {
    root: "rounded-xl border border-border-default p-2",
    item: (open) => `rounded-lg transition-colors duration-[var(--ws-duration-base)] ${open ? "bg-action-primary/[0.08]" : ""}`,
    trigger: (open) => `min-h-11 rounded-lg px-3 py-2.5 ${open ? "" : "enabled:hover:bg-text-primary/[0.04]"}`,
    title: "text-[13.5px] font-semibold text-text-primary",
    body: "pr-4 pb-4 pl-12 text-[13.5px] leading-relaxed text-text-secondary",
  },
  separated: {
    root: "space-y-2",
    item: (open) => `rounded-xl transition-[background-color,box-shadow] duration-[var(--ws-duration-base)] ${open ? "ring-1 ring-border-strong ring-inset" : "bg-text-primary/[0.05]"}`,
    trigger: (open) => `min-h-12 rounded-xl px-4 py-3 ${open ? "" : "enabled:hover:bg-text-primary/[0.03]"}`,
    title: "text-[14px] font-medium text-text-primary",
    // 16px block corner less the 6px inset: the nested corner stays concentric.
    body: `mx-1.5 mb-1.5 rounded-[10px] ${recess} px-4 py-3 text-[13.5px] leading-relaxed text-text-secondary`,
  },
  // Modal's `well`: the one thing in a panel darker than the fields around it.
  inset: {
    root: "space-y-2",
    item: () => "rounded-lg bg-surface-sunken",
    trigger: () => "min-h-11 rounded-lg px-4 py-2.5",
    title: "text-[13px] font-medium text-text-primary",
    body: "px-4 pb-3.5 text-[13px] leading-relaxed text-text-secondary",
    scroll: "var(--ws-surface-sunken)",
  },
  plain: {
    root: "",
    item: () => "pt-6 pb-1 first:pt-0",
    trigger: () => "rounded-md py-0.5",
    title: "text-[13px] font-medium text-text-primary",
    body: "pt-3",
  },
  // A group in the sandbox sidebar: the header is a nav row — same height, ink and hover.
  nav: {
    root: "",
    item: () => "",
    trigger: () => "h-[42px] rounded-lg px-3 text-text-secondary enabled:hover:bg-surface-base enabled:hover:text-text-primary",
    title: "text-[13.5px]",
    body: "pt-0.5",
  },
};

type Group = {
  variant: AccordionVariant;
  type: "single" | "multiple";
  indicator: AccordionIndicator;
  level: 2 | 3 | 4;
  open: string | null;
  setOpen: (value: string | null) => void;
  defaultValue: string[];
};

// An item used on its own — a DetailSection outside any group — behaves as a plain,
// independently opening section.
const standalone: Group = { variant: "plain", type: "multiple", indicator: "end", level: 3, open: null, setOpen: () => {}, defaultValue: [] };
const GroupContext = createContext<Group>(standalone);

const navKeys = ["ArrowDown", "ArrowUp", "Home", "End"];

/** A group of sections. `type="single"` keeps at most one open — an FAQ, where the
 *  answers are read one at a time. `type="multiple"` lets any number stay open — settings
 *  blocks, record sections, where people compare. Same component, one prop. */
export function Accordion({
  variant = "contained",
  type = "single",
  defaultValue = [],
  indicator,
  level = 3,
  className = "",
  children,
}: {
  variant?: AccordionVariant;
  type?: "single" | "multiple";
  /** Values open on first render. In single mode only the first is used. */
  defaultValue?: string[];
  /** Where the open/closed mark sits. Defaults to a chevron at the end; highlight takes a
   *  plus/minus at the start. */
  indicator?: AccordionIndicator;
  /** The heading level each trigger sits in, to fit the page's outline. */
  level?: 2 | 3 | 4;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState<string | null>(type === "single" ? (defaultValue[0] ?? null) : null);
  const root = useRef<HTMLDivElement>(null);

  // Arrow keys, Home and End move between this group's headers — not into a nested group,
  // and never onto a disabled one.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!navKeys.includes(e.key) || !target.matches("[data-accordion-trigger]") || target.closest("[data-accordion]") !== root.current) return;
    const triggers = [...root.current!.querySelectorAll<HTMLButtonElement>("[data-accordion-trigger]:not(:disabled)")].filter(
      (b) => b.closest("[data-accordion]") === root.current,
    );
    const i = triggers.indexOf(target as HTMLButtonElement);
    const n = triggers.length;
    const next = e.key === "Home" ? 0 : e.key === "End" ? n - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + n) % n;
    e.preventDefault();
    triggers[next]?.focus();
  };

  return (
    <GroupContext.Provider value={{ variant, type, indicator: indicator ?? (variant === "highlight" ? "plus" : "end"), level, open, setOpen, defaultValue }}>
      <div ref={root} data-accordion="" onKeyDown={onKeyDown} className={`${skins[variant].root} ${className}`}>
        {children}
      </div>
    </GroupContext.Provider>
  );
}

export function AccordionItem({
  value,
  title,
  meta,
  leading,
  trailing,
  actions,
  disabled = false,
  defaultOpen,
  onOpenChange,
  maxHeight,
  className = "",
  children,
}: {
  value: string;
  title: ReactNode;
  /** A second line under the title — the current value of a settings block. */
  meta?: ReactNode;
  /** Before the title, inside the trigger — an icon badge. */
  leading?: ReactNode;
  /** After the title, inside the trigger — a checklist's progress. */
  trailing?: ReactNode;
  /** Beside the trigger, outside it, so it can hold its own buttons. */
  actions?: ReactNode;
  /** Not focusable and cannot open. Say why somewhere visible. */
  disabled?: boolean;
  /** Multiple mode only; single mode opens from the group's defaultValue. */
  defaultOpen?: boolean;
  /** When this item's own trigger is pressed — load the body the first time it opens. */
  onOpenChange?: (open: boolean) => void;
  /** Cap the body and scroll inside it, so a long panel never pushes a drawer's footer away. */
  maxHeight?: number;
  className?: string;
  children: ReactNode;
}) {
  const g = useContext(GroupContext);
  const [own, setOwn] = useState(defaultOpen ?? g.defaultValue.includes(value));
  const open = g.type === "single" ? g.open === value : own;
  const toggle = () => {
    if (g.type === "single") g.setOpen(open ? null : value);
    else setOwn(!open);
    onOpenChange?.(!open);
  };

  const id = useId();
  const s = skins[g.variant];
  const Heading = `h${g.level}` as "h2" | "h3" | "h4";
  const mark =
    g.indicator === "plus" ? (
      <span aria-hidden="true" className={`grid size-6 shrink-0 place-items-center rounded-full transition-colors duration-[var(--ws-duration-base)] ${open ? "bg-surface-base text-text-primary" : "text-text-secondary"}`}>
        {open ? <MinusIcon className="size-3.5" /> : <PlusIcon className="size-3.5" />}
      </span>
    ) : (
      <ChevronDownIcon
        aria-hidden="true"
        className={`size-4 shrink-0 text-text-tertiary transition-transform duration-[var(--ws-duration-base)] ease-[var(--ws-ease-standard)] ${open ? "rotate-180" : ""}`}
      />
    );

  return (
    <div data-open={open || undefined} className={`${s.item(open)} ${className}`}>
      <div className="flex items-center gap-2">
        <Heading className="min-w-0 flex-1">
          <button
            id={`${id}-trigger`}
            type="button"
            data-accordion-trigger=""
            aria-expanded={open}
            aria-controls={`${id}-panel`}
            disabled={disabled}
            onClick={toggle}
            className={`flex w-full items-center gap-3 text-left outline-offset-[-2px] transition-colors duration-[var(--ws-duration-fast)] disabled:cursor-not-allowed disabled:opacity-50 ${s.trigger(open)}`}
          >
            {g.indicator === "end" ? null : mark}
            {leading}
            <span className="min-w-0 flex-1">
              <span className={`block ${s.title}`}>{title}</span>
              {meta ? <span className="mt-0.5 block truncate text-[12.5px] text-text-tertiary">{meta}</span> : null}
            </span>
            {trailing}
            {g.indicator === "end" ? mark : null}
          </button>
        </Heading>
        {actions}
      </div>
      <Collapse open={open} id={`${id}-panel`} labelledBy={`${id}-trigger`} maxHeight={maxHeight} scroll={s.scroll}>
        <div className={s.body}>{children}</div>
      </Collapse>
    </div>
  );
}

/* The panel. A grid row animating 0fr → 1fr opens it to its natural height with no
   measuring, on the toast's curve (duration-slow, ease-standard); the content fades on
   top. Reduced motion drops the height change and keeps only the fade (app.css). A closed
   panel is inert — out of the tab order and away from screen readers. */
function Collapse({
  open,
  id,
  labelledBy,
  maxHeight,
  scroll,
  region = true,
  children,
}: {
  open: boolean;
  id: string;
  labelledBy: string;
  maxHeight?: number;
  scroll?: string;
  region?: boolean;
  children: ReactNode;
}) {
  return (
    <div id={id} role={region ? "region" : undefined} aria-labelledby={region ? labelledBy : undefined} inert={!open} data-open={open} className="ws-collapse">
      <div className="min-h-0 overflow-hidden">
        {maxHeight ? (
          <div
            className="ws-scroll-y overflow-y-auto overscroll-contain"
            style={{ maxHeight, ...(scroll ? { "--ws-scroll-surface": scroll } : {}) } as CSSProperties}
          >
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Disclosure ---- */

/** The lightest member: a single text trigger that reveals a line or two in place — no
 *  card, no border. For the answer to a question most people will not ask, sitting inside
 *  something else: "Why this happened" in an error Toast, a Banner's small print. */
export function Disclosure({
  label,
  defaultOpen = false,
  className = "",
  children,
}: {
  label: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={className}>
      <button
        id={`${id}-trigger`}
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded text-[12.5px] text-text-secondary transition-colors duration-[var(--ws-duration-fast)] hover:text-text-primary"
      >
        <ChevronDownIcon
          aria-hidden="true"
          className={`size-3.5 shrink-0 transition-transform duration-[var(--ws-duration-base)] ease-[var(--ws-ease-standard)] ${open ? "rotate-180" : ""}`}
        />
        {label}
      </button>
      <Collapse open={open} id={`${id}-panel`} labelledBy={`${id}-trigger`} region={false}>
        <div className="pt-2 text-[12.5px] leading-relaxed text-text-tertiary">{children}</div>
      </Collapse>
    </div>
  );
}

/* ------------------------------------------------------------- Checklist ---- */

export type ChecklistTask = {
  id: string;
  label: string;
  done?: boolean;
  /** Setting a reason is what locks a task — so a locked row cannot ship without saying
   *  what unlocks it. Shown in a descriptive tooltip on the row's (i). */
  lockedReason?: string;
};

type TaskState = "done" | "current" | "upcoming" | "locked";

/** A first-run setup list: a separated Accordion holding one item, whose header carries a
 *  compact Progress Bar and the fraction done, so how far along you are reads with it shut —
 *  in a sidebar, on a welcome panel. Order matters: the current task is the first one that
 *  is neither done nor locked, and only it takes the emphasis. */
export function Checklist({
  title,
  tasks,
  hint,
  defaultOpen = true,
  onSelect,
  className = "",
}: {
  title: string;
  tasks: ChecklistTask[];
  /** A standing hint under the list — how to get back here. */
  hint?: ReactNode;
  defaultOpen?: boolean;
  /** Pressing an available task — start it. */
  onSelect?: (task: ChecklistTask) => void;
  className?: string;
}) {
  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const currentId = tasks.find((t) => !t.done && !t.lockedReason)?.id;
  const stateOf = (t: ChecklistTask): TaskState => (t.done ? "done" : t.lockedReason ? "locked" : t.id === currentId ? "current" : "upcoming");

  return (
    <Accordion variant="separated" type="multiple" indicator="start" className={className}>
      <AccordionItem
        value="checklist"
        defaultOpen={defaultOpen}
        title={title}
        trailing={
          <span className="flex shrink-0 items-center gap-2.5">
            <ProgressBar value={(done / total) * 100} size="sm" tone={done === total ? "success" : "primary"} aria-label={`${title} progress`} className="w-16" />
            <span aria-hidden="true" className="text-[12.5px] tabular-nums text-text-secondary">
              {done}/{total}
            </span>
            <span className="sr-only">{`, ${done} of ${total} done`}</span>
          </span>
        }
      >
        <ol className="-mx-2 space-y-0.5">
          {tasks.map((t) => (
            <li key={t.id}>
              <TaskRow task={t} state={stateOf(t)} onSelect={onSelect} />
            </li>
          ))}
        </ol>
        {hint ? (
          <p className="mt-3 flex items-start gap-2 text-[12.5px] leading-snug text-text-tertiary">
            <InformationCircleIcon aria-hidden="true" className="mt-px size-4 shrink-0" />
            {hint}
          </p>
        ) : null}
      </AccordionItem>
    </Accordion>
  );
}

/** The row box a checklist task sits in — shared so other lists of actions (the wallet's)
 *  line up with it exactly. */
export const listRow = "flex min-h-9 w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-[13.5px]";
const rowBox = listRow;

/** Something that cannot be done yet, and says why: a dimmed glyph and label that are not
 *  a control, and an (i) that is — a descriptive tooltip carrying the reason, reachable by
 *  keyboard and read out as the button's description. The setup checklist's locked task,
 *  and every KYC-gated wallet action (FR-WAL-05), render through this one row. */
export function LockedRow({ glyph, label, reason, className = "" }: { glyph: ReactNode; label: string; reason: ReactNode; className?: string }) {
  return (
    <div className={`${rowBox} text-text-tertiary ${className}`}>
      <span className="grid size-5 shrink-0 place-items-center text-text-tertiary opacity-50">{glyph}</span>
      <span className="min-w-0">{label}</span>
      <Tooltip content={reason} wide>
        <button
          type="button"
          aria-label={`Why “${label}” is locked`}
          className="grid size-6 shrink-0 place-items-center rounded-full text-text-tertiary transition-colors duration-[var(--ws-duration-fast)] hover:text-text-primary"
        >
          <InformationCircleIcon aria-hidden="true" className="size-4" />
        </button>
      </Tooltip>
      <span className="sr-only">, locked</span>
    </div>
  );
}

function TaskRow({ task, state, onSelect }: { task: ChecklistTask; state: TaskState; onSelect?: (task: ChecklistTask) => void }) {
  // Done is the green check the StatusPill and Table already mean "complete" by. Anything
  // not done is the Spinner's still ring — pending, not loading — dimmed further when locked.
  const glyph =
    state === "done" ? (
      <CheckCircleIcon aria-hidden="true" className="size-5 shrink-0 text-feedback-success" />
    ) : (
      <span className={`grid size-5 shrink-0 place-items-center ${state === "current" ? "text-text-primary" : "text-text-tertiary"}`}>
        <Spinner still label={null} />
      </span>
    );

  if (state === "done")
    return (
      <div className={`${rowBox} text-text-secondary`}>
        {glyph}
        <span className="min-w-0 flex-1">{task.label}</span>
        <span className="sr-only">, done</span>
      </div>
    );

  if (state === "locked") return <LockedRow glyph={<Spinner still label={null} />} label={task.label} reason={task.lockedReason} />;

  return (
    <button
      type="button"
      aria-current={state === "current" ? "step" : undefined}
      onClick={() => onSelect?.(task)}
      className={`${rowBox} group transition-colors duration-[var(--ws-duration-fast)] hover:bg-text-primary/[0.05] ${state === "current" ? "font-medium text-text-primary" : "text-text-secondary"}`}
    >
      {glyph}
      <span className="min-w-0 flex-1">{task.label}</span>
      {state === "current" ? (
        <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0 text-text-tertiary transition-transform duration-[var(--ws-duration-fast)] group-hover:translate-x-0.5" />
      ) : null}
    </button>
  );
}
