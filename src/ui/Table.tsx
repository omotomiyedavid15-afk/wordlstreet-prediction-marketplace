import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  InboxIcon,
} from "@heroicons/react/20/solid";
import { CheckIcon, DocumentDuplicateIcon } from "@heroicons/react/16/solid";
import {
  Fragment,
  useEffect,
  useId,
  useMemo,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { AccordionItem } from "./Accordion";
import { initialsToneFor } from "./Avatar";
import { Chip } from "./Badge";
import { CheckboxBox } from "./Choice";
import { Button } from "./Button";
import { ActionMenu } from "./Dropdown";
import { Pagination, type PaginationVariant } from "./Pagination";
import { shimmer } from "./Spinner";
import { formatMoney, splitMinor, type CurrencyCode } from "./format";
import { bankLogo, cryptoLogo, currencyFlag } from "./logos";

/* A table here is a ledger before it is a grid. The decisions that follow from that:

   - Hairlines between rows and nothing else — no zebra, no vertical rules, no header
     band. Rows are separated by 7% ink, which reads on a card, on canvas, and in a
     screenshot pasted into a post, where heavy chrome is the first thing that turns
     to noise.
   - Figures are right-aligned in tabular numerals, with a true minus, and the minor
     units (kobo, cents) set a step quieter than the whole — the eye reads ₦6,789,012
     first and the .00 only if it looks.
   - Colour belongs to status pills and trend pills. Amounts are never green or red;
     the Direction column says which way money moved.
   - Gold appears where the reader is: the selected rows, the open row, the focus ring. */

const rule = "border-text-primary/[0.07]";

/* Row selection uses the system's one checkbox, CheckboxBox from Choice — at its sm
   size, so a checked row is the same gold box a form uses. */

/* --------------------------------------------------------------- Figures ---- */

/** A ledger figure: grouped, tabular, true minus, and the minor units a step quieter. */
export function Money({
  amount,
  currency,
  sign,
  decimals,
  className = "",
}: {
  amount: number;
  currency: CurrencyCode;
  sign?: "negative" | "always";
  /** Defaults to 2. A $0.2381 coin needs 4. */
  decimals?: number;
  className?: string;
}) {
  const [whole, minor] = splitMinor(formatMoney(amount, currency, { sign, decimals }));
  return (
    <span className={`whitespace-nowrap tabular-nums ${className}`}>
      {whole}
      <span className="text-text-tertiary">{minor}</span>
    </span>
  );
}

/* Marks for the things a row refers to. They are brand imagery, so they keep their own
   colours — the one place in a table that does not come from the tokens, the way a
   photo in Avatar does not. Each sits inside a hairline ring (ink at 10%) so a white
   or pale logo still has an edge on the white theme. Anything without a file falls
   back to a monogram tinted from its name, the same rule Avatar uses for initials. */
const markRing = "ring-1 ring-text-primary/10 ring-inset";

function Monogram({ label, seed, className }: { label: string; seed: string; className: string }) {
  return (
    <span aria-hidden="true" className={`inline-grid shrink-0 place-items-center font-semibold text-text-primary ${initialsToneFor(seed)} ${className}`}>
      {label}
    </span>
  );
}

/** A coin: its logo in a circle. */
export function AssetMark({ symbol, size = "md" }: { symbol: string; size?: "sm" | "md" }) {
  const src = cryptoLogo(symbol);
  const box = size === "sm" ? "size-5 text-[9px]" : "size-7 text-[11px]";
  if (!src) return <Monogram label={symbol.slice(0, 1)} seed={symbol} className={`rounded-full ${box}`} />;
  return (
    // inline-block: the mark sizes itself wherever it lands — a flex row, or a field's
    // inline leading slot — instead of relying on its parent to be a flex container.
    <span aria-hidden="true" className={`relative inline-block shrink-0 overflow-hidden rounded-full align-middle ${box}`}>
      <img src={src} alt="" className="block size-full object-cover" />
      <span className={`absolute inset-0 rounded-full ${markRing}`} />
    </span>
  );
}

/** A bank or fintech: its mark on a white plate, in a rounded square — an institution
 *  reads as an app icon, a coin as a coin. The plate is white in both themes because the
 *  marks are drawn for white; on a dark surface without it half of them disappear. */
export function BankMark({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const src = bankLogo(name);
  const box = size === "sm" ? "size-5 rounded-[5px] text-[8px]" : "size-7 rounded-md text-[10px]";
  if (!src) {
    const initials = name.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join("");
    return <Monogram label={initials} seed={name} className={box} />;
  }
  return (
    <span aria-hidden="true" className={`relative inline-block shrink-0 overflow-hidden bg-white align-middle ${box}`}>
      {/* The SVG set is drawn with ~30% padding inside its square; the site icons are
          full-bleed. Scaling the SVGs up makes every mark fill its tile the same way. */}
      <img src={src} alt="" className={`block size-full object-contain ${src.includes("svg") ? "scale-[1.4]" : ""}`} />
      <span className={`absolute inset-0 ${box} ${markRing}`} />
    </span>
  );
}

/** Two overlapping flags for a forex pair — base in front, each ringed in the surface
 *  colour so the overlap reads as two discs, not one blob. */
export function PairMark({ base, quote }: { base: string; quote: string }) {
  const disc = (code: string, extra: string) => {
    const src = currencyFlag(code);
    return src ? (
      <span className={`relative inline-block size-6 overflow-hidden rounded-full ring-2 ring-surface-base ${extra}`}>
        <img src={src} alt="" className="block size-full object-cover" />
        <span className={`absolute inset-0 rounded-full ${markRing}`} />
      </span>
    ) : (
      <Monogram label={code[0]} seed={code} className={`size-6 rounded-full text-[10px] ring-2 ring-surface-base ${extra}`} />
    );
  };
  return (
    <span aria-hidden="true" className="flex shrink-0">
      {disc(base, "z-10")}
      {disc(quote, "-ml-2")}
    </span>
  );
}

/** A value with a copy control beside it — phone numbers, IPs, event IDs. */
export function CopyValue({ value, label, mono = false }: { value: string; label: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(id);
  }, [copied]);
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span className={mono ? "font-mono text-[12px]" : "tabular-nums"}>{value}</span>
      <button
        type="button"
        aria-label={copied ? `${label} copied` : `Copy ${label}`}
        onClick={() => navigator.clipboard?.writeText(value).then(() => setCopied(true))}
        className="grid size-6 place-items-center rounded-md text-text-tertiary transition-colors duration-150 hover:bg-text-primary/[0.06] hover:text-text-primary"
      >
        {copied ? <CheckIcon aria-hidden="true" className="size-3.5 text-feedback-success" /> : <DocumentDuplicateIcon aria-hidden="true" className="size-3.5" />}
      </button>
    </span>
  );
}

/** An inline text action for a simple list — "Sign out". Buttons have no link-weight
 *  variant yet; this is that, scoped to tables until Button grows one. */
export function TextAction({
  children,
  onClick,
  tone = "default",
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-sm text-[13px] font-medium underline decoration-current/35 underline-offset-[3px] transition-[text-decoration-color] duration-150 hover:decoration-current ${
        tone === "danger" ? "text-feedback-danger" : "text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------- DataTable ---- */

export type Column<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Right-aligned, tabular figures, and sorts largest-first on the first click. */
  numeric?: boolean;
  /** Makes the column sortable. */
  sortValue?: (row: T) => string | number;
  /** The row's name — rendered as a row header (th scope="row"). One per table. */
  rowHeader?: boolean;
  /** Shape of the loading placeholder for this column. */
  skeleton?: "text" | "pill" | "identity" | "number" | "none";
  width?: string;
  className?: string;
};

export type SortState = { id: string; dir: "asc" | "desc" } | null;

type DataTableProps<T> = {
  /** Names the table for assistive tech. Not shown — the heading above does that. */
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** How a row is named in its checkbox, chevron and menu labels — "Bola Smith". */
  rowLabel: (row: T) => string;
  loading?: boolean;
  skeletonRows?: number;
  empty?: { title: string; description?: ReactNode; action?: ReactNode; icon?: ComponentType<{ className?: string }> };
  selection?: { selected: ReadonlySet<string>; onChange: (next: Set<string>) => void };
  expand?: { render: (row: T) => ReactNode; canExpand?: (row: T) => boolean };
  /** Opens the row — usually into a Sheet. Enter does the same from the keyboard. */
  onRowClick?: (row: T) => void;
  /** The row whose detail is open, marked so the reader can see where they are. */
  activeKey?: string | null;
  /** A trailing cell per row — usually an ActionMenu. */
  rowActions?: (row: T) => ReactNode;
  /** Splits the rows into labelled groups, in first-seen order. */
  groupBy?: (row: T) => string;
  defaultSort?: SortState;
  density?: "comfortable" | "compact" | "spacious";
  /** `simple` is the settings-list look: no hover, lighter header, nothing to select. */
  variant?: "default" | "simple";
  /** Below this width the table scrolls sideways instead of crushing its columns. */
  minWidth?: number;
  className?: string;
};

function sortRows<T>(rows: T[], col: Column<T> | undefined, dir: "asc" | "desc") {
  if (!col?.sortValue) return rows;
  const get = col.sortValue;
  return [...rows].sort((a, b) => {
    const x = get(a);
    const y = get(b);
    const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
    return dir === "asc" ? c : -c;
  });
}

// Deterministic widths, so a skeleton does not reshuffle on every render.
const skeletonWidths = [72, 54, 88, 64, 46, 80, 58, 70];

function SkeletonCell({ kind, seed, numeric }: { kind: Column<unknown>["skeleton"]; seed: number; numeric?: boolean }) {
  const w = skeletonWidths[seed % skeletonWidths.length];
  if (kind === "none") return null;
  if (kind === "pill") return <span className={`block h-[22px] w-[76px] rounded-full ${shimmer}`} />;
  if (kind === "identity")
    return (
      <span className="flex items-center gap-2.5">
        <span className={`size-7 shrink-0 rounded-full ${shimmer}`} />
        <span className="flex-1 space-y-1.5">
          <span className={`block h-2.5 rounded-full ${shimmer}`} style={{ width: `${w}%` }} />
          <span className={`block h-2 rounded-full ${shimmer}`} style={{ width: `${w - 18}%` }} />
        </span>
      </span>
    );
  return (
    <span
      className={`block h-2.5 rounded-full ${shimmer} ${numeric || kind === "number" ? "ml-auto" : ""}`}
      style={{ width: numeric || kind === "number" ? `${Math.min(w, 70)}px` : `${w}%` }}
    />
  );
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  rowLabel,
  loading = false,
  skeletonRows = 6,
  empty,
  selection,
  expand,
  onRowClick,
  activeKey,
  rowActions,
  groupBy,
  defaultSort = null,
  density = "comfortable",
  variant = "default",
  minWidth = 720,
  className = "",
}: DataTableProps<T>) {
  const baseId = useId();
  const [sort, setSort] = useState<SortState>(defaultSort);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());

  const sortCol = columns.find((c) => c.id === sort?.id);
  const sorted = useMemo(() => (sort ? sortRows(rows, sortCol, sort.dir) : rows), [rows, sortCol, sort]);
  const groups = useMemo(() => {
    if (!groupBy) return [{ label: "", rows: sorted }];
    const m = new Map<string, T[]>();
    for (const r of sorted) {
      const g = groupBy(r);
      if (!m.has(g)) m.set(g, []);
      m.get(g)!.push(r);
    }
    return [...m].map(([label, rows]) => ({ label, rows }));
  }, [sorted, groupBy]);

  const keys = rows.map(rowKey);
  const selectedHere = selection ? keys.filter((k) => selection.selected.has(k)).length : 0;
  const allSelected = selectedHere > 0 && selectedHere === keys.length;

  const colCount = columns.length + (selection ? 1 : 0) + (expand ? 1 : 0) + (rowActions ? 1 : 0);
  const rowH = density === "compact" ? "h-10" : density === "spacious" ? "h-[72px]" : "h-[52px]";
  const simple = variant === "simple";
  const interactive = Boolean(onRowClick);

  const cycleSort = (col: Column<T>) => {
    const first = col.numeric ? "desc" : "asc";
    const second = first === "asc" ? "desc" : "asc";
    setSort((s) => (s?.id !== col.id ? { id: col.id, dir: first } : s.dir === first ? { id: col.id, dir: second } : null));
  };

  const toggleRow = (k: string, on: boolean) => {
    if (!selection) return;
    const next = new Set(selection.selected);
    if (on) next.add(k);
    else next.delete(k);
    selection.onChange(next);
  };
  const toggleAll = (on: boolean) => {
    if (!selection) return;
    const next = new Set(selection.selected);
    for (const k of keys) {
      if (on) next.add(k);
      else next.delete(k);
    }
    selection.onChange(next);
  };

  // A click on anything that is its own control — a checkbox, a menu, a link — is not a
  // click on the row.
  const fromControl = (e: MouseEvent | KeyboardEvent) =>
    (e.target as HTMLElement).closest("button, a, input, label, [role=menu], [role=tooltip], [tabindex]:not(tr)");

  // 10px between columns, 16px at the table's outer edges.
  const cellPad = density === "spacious" ? "px-4 first:pl-5 last:pr-5" : "px-2.5 first:pl-4 last:pr-4";

  return (
    <div className={`ws-scroll-x overflow-x-auto ${className}`}>
      <table
        aria-busy={loading || undefined}
        aria-describedby={loading ? `${baseId}-loading` : undefined}
        className="w-full border-collapse text-left text-[13px]"
        style={{ minWidth }}
      >
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className={`border-b ${simple ? rule : "border-text-primary/[0.12]"}`}>
            {selection ? (
              <th scope="col" className={`w-10 ${cellPad}`}>
                <CheckboxBox
                  size="sm"
                  checked={allSelected}
                  indeterminate={selectedHere > 0 && !allSelected}
                  onChange={toggleAll}
                  label="Select all rows"
                  disabled={loading || rows.length === 0}
                />
              </th>
            ) : null}
            {expand ? (
              <th scope="col" className={`w-10 ${cellPad}`}>
                <span className="sr-only">Expand</span>
              </th>
            ) : null}
            {columns.map((col) => {
              const active = sort?.id === col.id;
              const Arrow = active ? (sort!.dir === "asc" ? ArrowUpIcon : ArrowDownIcon) : ChevronUpDownIcon;
              return (
                <th
                  key={col.id}
                  scope="col"
                  aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                  style={{ width: col.width }}
                  className={`h-10 text-[12px] font-medium whitespace-nowrap text-text-tertiary ${cellPad} ${col.numeric ? "text-right" : ""}`}
                >
                  {col.sortValue && !loading ? (
                    <button
                      type="button"
                      onClick={() => cycleSort(col)}
                      className={`group -mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors duration-150 hover:text-text-primary ${
                        col.numeric ? "flex-row-reverse" : ""
                      } ${active ? "text-text-primary" : ""}`}
                    >
                      {col.header}
                      <Arrow
                        aria-hidden="true"
                        className={`size-3.5 shrink-0 transition-opacity duration-150 ${
                          active ? "opacity-100" : "opacity-0 group-hover:opacity-60 group-focus-visible:opacity-60"
                        }`}
                      />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
            {rowActions ? (
              <th scope="col" className={`w-12 ${cellPad}`}>
                <span className="sr-only">Actions</span>
              </th>
            ) : null}
          </tr>
        </thead>

        {loading ? (
          <tbody>
            {Array.from({ length: skeletonRows }, (_, r) => (
              <tr key={r} aria-hidden="true" className={`${rowH} border-b ${rule} last:border-b-0`}>
                {selection ? <td className={cellPad}><span className={`block size-4 rounded-[5px] ${shimmer}`} /></td> : null}
                {expand ? <td className={cellPad} /> : null}
                {columns.map((col, c) => (
                  <td key={col.id} className={cellPad}>
                    <SkeletonCell kind={col.skeleton ?? "text"} seed={r * 3 + c} numeric={col.numeric} />
                  </td>
                ))}
                {rowActions ? <td className={cellPad} /> : null}
              </tr>
            ))}
          </tbody>
        ) : rows.length === 0 ? (
          <tbody>
            <tr>
              <td colSpan={colCount} className="px-4 py-14">
                <EmptyState {...(empty ?? { title: "Nothing here yet" })} />
              </td>
            </tr>
          </tbody>
        ) : (
          groups.map((group, g) => (
            <tbody key={group.label || g}>
              {group.label ? (
                <tr>
                  <th
                    scope="rowgroup"
                    colSpan={colCount}
                    className={`h-9 px-4 pt-3 text-left text-[12px] font-medium text-text-tertiary ${g > 0 ? `border-t ${rule}` : ""}`}
                  >
                    {group.label}
                    <span className="ml-1.5 tabular-nums text-text-disabled">{group.rows.length}</span>
                  </th>
                </tr>
              ) : null}
              {group.rows.map((row, i) => {
                const k = rowKey(row);
                const selected = selection?.selected.has(k) ?? false;
                const isActive = activeKey === k;
                const canExpand = expand ? (expand.canExpand?.(row) ?? true) : false;
                const expanded = canExpand && open.has(k);
                const last = i === group.rows.length - 1 && g === groups.length - 1;
                const subId = `${baseId}-sub-${k}`;
                return (
                  <Fragment key={k}>
                    <tr
                      tabIndex={interactive ? 0 : undefined}
                      aria-selected={selection ? selected : undefined}
                      onClick={interactive ? (e) => !fromControl(e) && onRowClick!(row) : undefined}
                      onKeyDown={
                        interactive
                          ? (e) => {
                              if (e.key === "Enter" && e.target === e.currentTarget) onRowClick!(row);
                            }
                          : undefined
                      }
                      className={`${rowH} transition-colors duration-[var(--ws-duration-instant)] ${
                        expanded || last ? "" : `border-b ${rule}`
                      } ${
                        isActive
                          ? "bg-text-primary/[0.05] shadow-[inset_2px_0_0_var(--ws-action-primary-default)]"
                          : selected
                            ? "bg-action-primary/[0.07] shadow-[inset_2px_0_0_var(--ws-action-primary-default)]"
                            : expanded
                              ? "bg-text-primary/[0.03]"
                              : simple
                                ? ""
                                : "hover:bg-text-primary/[0.03]"
                      } ${interactive ? "cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary" : ""}`}
                    >
                      {selection ? (
                        <td className={`w-10 ${cellPad}`}>
                          <CheckboxBox size="sm" checked={selected} onChange={(on) => toggleRow(k, on)} label={`Select ${rowLabel(row)}`} />
                        </td>
                      ) : null}
                      {expand ? (
                        <td className={`w-10 ${cellPad}`}>
                          {canExpand ? (
                            <button
                              type="button"
                              aria-expanded={expanded}
                              aria-controls={subId}
                              aria-label={`${expanded ? "Hide" : "Show"} breakdown for ${rowLabel(row)}`}
                              onClick={() =>
                                setOpen((s) => {
                                  const next = new Set(s);
                                  if (next.has(k)) next.delete(k);
                                  else next.add(k);
                                  return next;
                                })
                              }
                              className="-m-1 grid size-7 place-items-center rounded-md text-text-tertiary transition-colors duration-150 hover:bg-text-primary/[0.06] hover:text-text-primary"
                            >
                              <ChevronRightIcon
                                aria-hidden="true"
                                className={`size-4 transition-transform duration-[var(--ws-duration-base)] ease-[var(--ws-ease-standard)] ${expanded ? "rotate-90" : ""}`}
                              />
                            </button>
                          ) : null}
                        </td>
                      ) : null}
                      {columns.map((col) => {
                        const Cell = col.rowHeader ? "th" : "td";
                        return (
                          <Cell
                            key={col.id}
                            scope={col.rowHeader ? "row" : undefined}
                            className={`${cellPad} font-normal ${col.numeric ? "text-right whitespace-nowrap tabular-nums" : ""} ${
                              col.rowHeader ? "text-text-primary" : "text-text-secondary"
                            } ${col.className ?? ""}`}
                          >
                            {col.cell(row)}
                          </Cell>
                        );
                      })}
                      {rowActions ? <td className={`w-12 text-right ${cellPad}`}>{rowActions(row)}</td> : null}
                    </tr>

                    {canExpand ? (
                      <tr id={subId} className={expanded && !last ? `border-b ${rule}` : ""}>
                        <td colSpan={colCount} className="p-0">
                          {/* 0fr → 1fr animates the height of content whose height is not
                              known, without measuring it. inert keeps the collapsed rows
                              out of the tab order and away from screen readers. */}
                          <div
                            inert={!expanded}
                            className={`grid transition-[grid-template-rows] duration-[var(--ws-duration-slow)] ease-[var(--ws-ease-standard)] ${
                              expanded ? "grid-rows-[1fr] bg-text-primary/[0.03]" : "grid-rows-[0fr]"
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="px-4 pb-3 pl-14">{expand!.render(row)}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          ))
        )}
      </table>
      {loading ? (
        <p id={`${baseId}-loading`} role="status" className="sr-only">
          Loading {caption.toLowerCase()}
        </p>
      ) : null}
    </div>
  );
}

/** Exported for the command palette's no-results state, so "nothing matched" looks the
 *  same in a table and in search. */
export function EmptyState({
  title,
  description,
  action,
  icon: Icon = InboxIcon,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="mx-auto flex max-w-[36ch] flex-col items-center text-center">
      <span className="grid size-10 place-items-center rounded-full bg-text-primary/[0.06] text-text-tertiary">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <p className="mt-3 text-[14px] font-medium text-text-primary">{title}</p>
      {description ? <p className="mt-1 text-[13px] leading-relaxed text-pretty text-text-tertiary">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/** A small table inside an expanded row — the fills of an order, the lots of a holding.
 *  Same hairline language, one size down, no interaction of its own. */
export function SubTable({
  caption,
  headers,
  rows,
  numeric = [],
}: {
  caption: string;
  headers: string[];
  rows: ReactNode[][];
  /** Column indexes to right-align in tabular figures. */
  numeric?: number[];
}) {
  return (
    <table className="w-full border-collapse text-left text-[12.5px]">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className={`border-b ${rule}`}>
          {headers.map((h, i) => (
            <th key={h} scope="col" className={`h-8 pr-4 font-medium text-text-tertiary last:pr-0 ${numeric.includes(i) ? "text-right" : ""}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={`h-9 border-b ${rule} last:border-b-0`}>
            {r.map((c, j) => (
              <td key={j} className={`pr-4 text-text-secondary last:pr-0 ${numeric.includes(j) ? "text-right tabular-nums" : ""}`}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* --------------------------------------------------------------- Toolbar ---- */

/** The row above a table: search and filter on the left, utilities and the primary
 *  action on the right. When rows are selected, pass a BulkActionBar as `bulk` and it
 *  takes the whole row — same slot, same height, so nothing below it moves. */
export function TableToolbar({
  start,
  end,
  bulk,
  className = "",
}: {
  start?: ReactNode;
  end?: ReactNode;
  bulk?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-h-9 ${className}`}>
      {bulk ?? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-0 basis-full flex-wrap items-center gap-2 sm:flex-1 sm:basis-auto">{start}</div>
          {end ? <div className="flex flex-wrap items-center gap-2">{end}</div> : null}
        </div>
      )}
    </div>
  );
}

export type ActiveFilter = { id: string; field: string; value: string };

/** The active filters as dismissible Chips, with one way to clear them all. */
export function FilterChips({
  filters,
  onRemove,
  onClear,
}: {
  filters: ActiveFilter[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  if (!filters.length) return null;
  return (
    <div role="group" aria-label="Active filters" className="flex flex-wrap items-center gap-1.5">
      {filters.map((f) => (
        <Chip key={f.id} size="md" onDismiss={() => onRemove(f.id)} dismissLabel={`Remove ${f.field} filter: ${f.value}`}>
          <span className="text-text-tertiary">{f.field}</span> {f.value}
        </Chip>
      ))}
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}

/** Peer views of one list — Active, Prospect, On hold, Archived — each with its count.
 *  A filter, not navigation: Tabs is still a stub, and when it lands this should be
 *  checked against it. */
export function FilterTabs<V extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: V; label: ReactNode; count?: number }[];
  value: V;
  onChange: (v: V) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-0.5 rounded-lg bg-text-primary/[0.05] p-0.5">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] transition-[background-color,color,box-shadow] duration-150 ${
              on ? "bg-surface-base font-medium text-text-primary ring-1 ring-text-primary/[0.08]" : "text-text-tertiary hover:text-text-primary"
            }`}
          >
            {o.label}
            {o.count !== undefined ? <span className="tabular-nums text-text-tertiary">{o.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------ Pagination ---- */

/** A table's footer: the rows on screen, the pages, and rows per page. The pages are the
 *  system Pagination. Inline is the default — arrows, plain numbers and a typed jump,
 *  the lightest of the six. Pass variant="numbered" when the dataset is large enough that
 *  First and Last are real tasks: Transactions, the audit log, order history. */
export function TablePagination({
  variant = "inline",
  page,
  pageCount,
  pageSize,
  pageSizes = [10, 20, 50],
  onPage,
  onPageSize,
  total,
  loading,
}: {
  variant?: Extract<PaginationVariant, "inline" | "numbered">;
  /** One-based. */
  page: number;
  pageCount: number;
  pageSize: number;
  pageSizes?: number[];
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  /** Total rows across all pages, for the "21–40 of 64" line. */
  total?: number;
  loading?: boolean;
}) {
  const from = (page - 1) * pageSize + 1;
  const to = total !== undefined ? Math.min(page * pageSize, total) : page * pageSize;
  return (
    // One line when there is room: rows on screen, pages, rows per page. Narrower than
    // 36rem the pages take a line of their own under the other two, so they get the whole
    // width before they have to step down.
    <div className="@container">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 @max-[36rem]:grid-cols-[1fr_auto]">
        <span className="text-[12.5px] tabular-nums text-text-secondary">
          {total !== undefined ? `${from}–${to} of ${total}` : null}
        </span>
        <Pagination
          variant={variant}
          page={page}
          count={pageCount}
          onPage={onPage}
          loading={loading}
          label="Table pages"
          className="@max-[36rem]:col-span-2 @max-[36rem]:row-start-2"
        />
        <div className="col-start-3 justify-self-end @max-[36rem]:col-start-2 @max-[36rem]:row-start-1">
          <ActionMenu
            label="Rows per page"
            align="end"
            items={pageSizes.map((n) => ({ label: `${n} rows`, checked: n === pageSize, onSelect: () => onPageSize(n) }))}
            trigger={(p) => (
              <Button variant="ghost" size="sm" suffixIcon={ChevronDownIcon} {...p}>
                <span className="tabular-nums">{pageSize} rows</span>
              </Button>
            )}
          />
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Detail panel ---- */

/** A titled, collapsible block inside a detail panel — an AccordionItem in its `plain`
 *  form, so the trigger, the motion and the aria are the Accordion's. Sections are
 *  separated by space, not rules — a panel carries no divider lines. Wrap a panel's
 *  sections in <Accordion variant="plain" type="multiple"> and the arrow keys move
 *  between their headers. */
export function DetailSection({
  title,
  children,
  defaultOpen = true,
  actions,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Sits on the right of the title row, outside the toggle. */
  actions?: ReactNode;
}) {
  return (
    <AccordionItem value={title} title={title} defaultOpen={defaultOpen} actions={actions}>
      {children}
    </AccordionItem>
  );
}

/** Label on the left, value on the right — the fields of one record. */
export function KeyValueList({
  items,
  dense = false,
}: {
  items: { label: string; value: ReactNode; icon?: ComponentType<{ className?: string }> }[];
  /** 28px rows at 12.5px, for a popover or card rather than a drawer. */
  dense?: boolean;
}) {
  return (
    <dl className={dense ? "" : "space-y-1"}>
      {items.map(({ label, value, icon: Icon }) => (
        <div key={label} className={`flex items-center gap-3 ${dense ? "min-h-7 text-[12.5px]" : "min-h-8 text-[13px]"}`}>
          <dt className="flex w-[40%] shrink-0 items-center gap-2 text-text-tertiary">
            {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : null}
            {label}
          </dt>
          <dd className="min-w-0 flex-1 text-right text-text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** What an audit event changed: one row per field, before and after. Neither side is
 *  coloured — a changed role is not good or bad — the arrow and the weight carry it. It
 *  lives inside a drawer, so no row rules: the fixed row height keeps the rhythm. */
export function DiffTable({ changes }: { changes: { field: string; before: ReactNode; after: ReactNode }[] }) {
  return (
    <table className="w-full border-collapse text-left text-[13px]">
      <caption className="sr-only">Changes</caption>
      <thead>
        <tr>
          <th scope="col" className="h-8 w-[30%] font-medium text-text-tertiary">Field</th>
          <th scope="col" className="h-8 font-medium text-text-tertiary">Before</th>
          <th scope="col" className="h-8 font-medium text-text-tertiary">After</th>
        </tr>
      </thead>
      <tbody>
        {changes.map((c) => (
          <tr key={c.field} className="h-10">
            <th scope="row" className="font-normal text-text-secondary">{c.field}</th>
            <td className="text-text-tertiary">
              <span className="inline-flex items-center gap-2">
                {c.before}
                <ChevronRightIcon aria-hidden="true" className="size-3.5 text-text-disabled" />
              </span>
            </td>
            <td className="font-medium text-text-primary">{c.after}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
