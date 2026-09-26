import {
  CheckIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UserPlusIcon,
} from "@heroicons/react/20/solid";
import {
  useEffect,
  useId,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Avatar } from "./Avatar";
import { popoverPanel, usePopover } from "./usePopover";

export { popoverPanel, usePopover };
import { IconButton } from "./Button";
import { FieldLabel, FieldMessage, describedBy } from "./Field";

/* The menu surface and its rows, shared by every overlay in the system — the select, the
   action menu, and the results panels of Search, Combobox and the date picker, which all
   build on this file rather than bringing their own. Hover and keyboard focus are ink at
   8% rather than surface.overlay, which is white on white in the light theme. */
export const menuPanel =
  "ws-raised overflow-hidden rounded-xl border border-border-default bg-surface-raised p-1 shadow-[var(--ws-shadow-overlay)]";
export const menuRow =
  "flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-[13px] outline-none";
// text.disabled is the same grey as surface.raised in the dark theme, so a disabled row
// drawn in it vanishes. Tertiary at half strength still reads as "not now".
export const menuRowDisabled = "cursor-not-allowed text-text-tertiary opacity-50";
export const menuRowIdle =
  "text-text-secondary hover:bg-text-primary/[0.08] hover:text-text-primary focus-visible:bg-text-primary/[0.08] focus-visible:text-text-primary";
/** Arrow keys, Home and End move focus through the enabled rows of a panel. */
function moveFocus(e: KeyboardEvent<HTMLElement>, container: HTMLElement | null, selector: string) {
  const rows = Array.from(container?.querySelectorAll<HTMLElement>(`${selector}:not(:disabled)`) ?? []);
  const i = rows.indexOf(document.activeElement as HTMLElement);
  const go = (n: number) => {
    e.preventDefault();
    rows[(n + rows.length) % rows.length]?.focus();
  };
  if (e.key === "ArrowDown") go(i + 1);
  else if (e.key === "ArrowUp") go(i < 0 ? rows.length - 1 : i - 1);
  else if (e.key === "Home") go(0);
  else if (e.key === "End") go(rows.length - 1);
  return rows;
}

export type DropdownOption = {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
  avatarName?: string;
  group?: string;
  disabled?: boolean;
  /** A line under the label — what an "Admin" role can actually do. */
  description?: string;
};

type BaseProps = {
  label: string;
  options: DropdownOption[];
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  leadingIcon?: ComponentType<{ className?: string }>;
  onAddUser?: () => void;
  /** Keeps the label for screen readers only — a select at the end of a settings row
   *  whose own words already name it. */
  hideLabel?: boolean;
  /** `lg` (44px) is the form default; `md` (36px) sits in a row of md Buttons — a
   *  pagination jump, a toolbar filter. */
  size?: "md" | "lg";
  /** Radius-full, for a row whose other controls are pills. */
  pill?: boolean;
};

export function Dropdown({
  label,
  options,
  placeholder = "Select",
  helperText,
  error,
  disabled,
  required,
  className = "",
  leadingIcon: LeadingIcon,
  searchable = false,
  multi = false,
  grouped = false,
  addUser = false,
  onAddUser,
  hideLabel = false,
  size = "lg",
  pill = false,
  value: controlled,
  onChange,
}: BaseProps & {
  searchable?: boolean;
  multi?: boolean;
  grouped?: boolean;
  addUser?: boolean;
  required?: boolean;
  /** Optional control. Leave both off and the dropdown keeps its own value. */
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
}) {
  const id = useId();
  const triggerId = `${id}-trigger`;
  const labelId = `${id}-label`;
  const listId = `${id}-list`;
  const messageId = `${id}-message`;
  const pop = usePopover({ align: "start", matchWidth: "min" });
  const [query, setQuery] = useState("");
  const [own, setOwn] = useState<string | string[]>(multi ? [] : "");
  const value = controlled ?? own;
  const selected = Array.isArray(value) ? value : [value];
  const selectedLabel = options.filter((o) => selected.includes(o.value)).map((o) => o.label).join(", ");

  const choose = (next: string) => {
    const values = Array.isArray(value) ? value : [];
    const result = multi ? (values.includes(next) ? values.filter((v) => v !== next) : [...values, next]) : next;
    if (controlled === undefined) setOwn(result);
    onChange?.(result);
    if (!multi) pop.hide(true);
  };

  // On open, focus lands on the search box, else the selected option, else the first.
  useEffect(() => {
    if (!pop.open) return;
    setQuery("");
    requestAnimationFrame(() => {
      const panel = pop.panelRef.current;
      const target =
        panel?.querySelector<HTMLElement>("input") ??
        panel?.querySelector<HTMLElement>('[role=option][aria-selected=true]:not(:disabled)') ??
        panel?.querySelector<HTMLElement>("[role=option]:not(:disabled)");
      target?.focus();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pop.open]);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
  const groups = grouped
    ? filtered.reduce<Record<string, DropdownOption[]>>((acc, o) => {
        (acc[o.group ?? "Options"] ??= []).push(o);
        return acc;
      }, {})
    : { Options: filtered };

  return (
    // No stack spacing when the label is hidden: the closed panel is still a child, and the
    // gap would push the trigger off the centre line of a row.
    <div className={`min-w-0 ${hideLabel ? "" : "space-y-2"} ${className}`}>
      <FieldLabel htmlFor={triggerId} id={labelId} required={required} disabled={disabled} srOnly={hideLabel}>
        {label}
      </FieldLabel>
      <button
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={pop.open}
        aria-controls={listId}
        aria-required={required || undefined}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(messageId, error, helperText)}
        disabled={disabled}
        {...pop.triggerHandlers}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            pop.show(e.currentTarget);
          }
        }}
        className={`flex w-full items-center gap-2 border bg-surface-base text-left outline-none ${
          size === "md" ? `min-h-9 pr-2.5 text-[13px] ${pill ? "rounded-full pl-3.5" : "rounded-lg pl-3"}` : `min-h-11 pr-3.5 pl-4 text-[13.5px] ${pill ? "rounded-full" : "rounded-xl"}`
        } transition-[border-color,box-shadow] duration-150 ${
          error
            ? "border-feedback-danger focus-visible:ring-1 focus-visible:ring-feedback-danger"
            : "border-border-default hover:border-border-strong focus-visible:border-action-primary focus-visible:ring-1 focus-visible:ring-action-primary"
        } ${pop.open ? "border-action-primary ring-1 ring-action-primary" : ""} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        {LeadingIcon ? <LeadingIcon className="size-4 shrink-0 text-text-tertiary" /> : null}
        <span className={`min-w-0 flex-1 truncate ${selectedLabel ? "text-text-primary" : "text-text-tertiary"}`}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className={`size-4 shrink-0 text-text-tertiary transition-transform duration-[var(--ws-duration-fast)] ${pop.open ? "rotate-180" : ""}`}
        />
      </button>
      <FieldMessage id={messageId} helperText={helperText} error={error} />

      <div
        ref={pop.panelRef}
        popover="auto"
        onKeyDown={(e) => {
          if ((e.target as HTMLElement).tagName === "INPUT" && e.key !== "ArrowDown") return;
          moveFocus(e, pop.panelRef.current, "[role=option]");
        }}
        className={`${popoverPanel} ${menuPanel} max-w-[min(360px,calc(100vw-16px))]`}
      >
        {searchable ? (
          <div className="m-1 flex items-center gap-2 rounded-lg border border-border-default bg-surface-base px-2.5">
            <MagnifyingGlassIcon aria-hidden="true" className="size-4 text-text-tertiary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={`Search ${label}`}
              placeholder="Search options"
              className="min-w-0 flex-1 bg-transparent py-2 text-[12px] text-text-primary outline-none placeholder:text-text-tertiary"
            />
          </div>
        ) : null}
        <div id={listId} role="listbox" aria-labelledby={labelId} aria-multiselectable={multi || undefined} className="max-h-64 overflow-auto">
          {Object.entries(groups).map(([group, groupOptions]) => (
            <div key={group} role={grouped ? "group" : undefined} aria-label={grouped ? group : undefined}>
              {grouped ? <p aria-hidden="true" className="px-3 pt-2 pb-1 font-mono text-[10px] tracking-[0.12em] text-text-tertiary uppercase">{group}</p> : null}
              {groupOptions.map((option) => {
                const OptionIcon = option.icon ?? LeadingIcon;
                const on = selected.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={on}
                    tabIndex={-1}
                    disabled={option.disabled}
                    onClick={() => choose(option.value)}
                    className={`${menuRow} ${option.description ? "py-2" : ""} ${
                      option.disabled ? menuRowDisabled : on ? "bg-action-primary-tonal text-text-primary focus-visible:bg-action-primary-tonal-hover" : menuRowIdle
                    }`}
                  >
                    {option.avatarName ? (
                      <Avatar name={option.avatarName} size="xs" illustrated />
                    ) : OptionIcon ? (
                      <OptionIcon aria-hidden="true" className="size-4 shrink-0 text-text-tertiary" />
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{option.label}</span>
                      {/* Secondary at 75%, not tertiary: tertiary is 2.2:1 on a raised menu. */}
                      {option.description ? <span className="mt-0.5 block text-[12px] leading-snug text-text-secondary/75">{option.description}</span> : null}
                    </span>
                    {on ? <CheckIcon aria-hidden="true" className="size-4 shrink-0 text-action-primary-text" /> : null}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 ? <p className="px-3 py-4 text-[12px] text-text-tertiary">No options match “{query}”.</p> : null}
        </div>
        {addUser ? (
          <button type="button" onClick={onAddUser} className="mt-1 flex min-h-10 w-full items-center gap-2 rounded-lg border-t border-border-subtle px-3 text-[13px] font-medium text-action-primary-text hover:bg-action-primary-tonal">
            <UserPlusIcon aria-hidden="true" className="size-4" />
            Add user
            <PlusIcon aria-hidden="true" className="ml-auto size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function SelectDropdown(props: BaseProps & { value?: string | string[]; onChange?: (value: string | string[]) => void }) {
  return <Dropdown {...props} />;
}

export function SearchableDropdown(props: BaseProps) {
  return <Dropdown {...props} searchable />;
}

export function MultiSelectDropdown(props: BaseProps) {
  return <Dropdown {...props} multi />;
}

export function CurrencyDropdown(props: Omit<BaseProps, "label"> & { label?: string }) {
  return <Dropdown {...props} label={props.label ?? "Currency"} placeholder={props.placeholder ?? "Select currency"} />;
}

export function GroupedDropdown(props: BaseProps) {
  return <Dropdown {...props} grouped />;
}

export function AddUserDropdown(props: Omit<BaseProps, "options"> & { options?: DropdownOption[]; onAddUser?: () => void }) {
  return <Dropdown {...props} options={props.options ?? []} addUser />;
}

/* ------------------------------------------------------------- Action menu ---- */

export type MenuAction = {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onSelect: () => void;
  /** Destructive — set in the danger colour, and kept last in its section by convention. */
  danger?: boolean;
  /** For a menu that sets a value, like rows-per-page. Renders as menuitemradio. */
  checked?: boolean;
  disabled?: boolean;
  /** Trailing content — a PRO badge, a keyboard shortcut, a count. */
  meta?: ReactNode;
};

export type MenuSection = { label?: string; items: MenuAction[] };

export type MenuTriggerProps = {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onClick: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  "aria-haspopup": "menu";
  "aria-expanded": boolean;
  "aria-controls": string;
};

/** The Dropdown's menu, for actions instead of a value: a row's kebab, a Filter button,
 *  a rows-per-page picker. Same panel and rows as the select.
 *
 *  It renders with the native popover API, so it sits in the top layer — a menu on the
 *  last row of a scrolling table is not clipped by the table's overflow, and the browser
 *  supplies light-dismiss (outside click, Escape). Arrow keys, Home/End, and returning
 *  focus to the trigger are handled here. */
export function ActionMenu({
  label,
  items,
  sections,
  align = "end",
  trigger,
  header,
  inline = false,
}: {
  /** Names the menu, and the default kebab trigger — "Actions for Bola Smith". */
  label: string;
  items?: MenuAction[];
  sections?: MenuSection[];
  align?: "start" | "end";
  trigger?: (props: MenuTriggerProps) => ReactNode;
  /** Sits above the items and is not one of them — the signed-in person on an account menu. */
  header?: ReactNode;
  /** Draws the open menu in place, without its trigger — for a docs page or a gallery.
   *  The first item is the tab stop; arrow keys move from there. */
  inline?: boolean;
}) {
  const id = useId();
  const pop = usePopover({ align });
  const groups = sections ?? [{ items: items ?? [] }];
  const rowsSelector = "[role^=menuitem]";

  const openAndFocus = (anchor: HTMLElement, focus: "first" | "last" = "first") => {
    pop.show(anchor);
    requestAnimationFrame(() => {
      const rows = Array.from(pop.panelRef.current?.querySelectorAll<HTMLElement>(`${rowsSelector}:not(:disabled)`) ?? []);
      (focus === "first" ? rows[0] : rows[rows.length - 1])?.focus();
    });
  };

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") pop.hide();
    else moveFocus(e, pop.panelRef.current, rowsSelector);
  };

  const triggerProps: MenuTriggerProps = {
    onPointerDown: pop.triggerHandlers.onPointerDown,
    onClick: (e) => {
      const wasOpen = pop.open;
      pop.triggerHandlers.onClick(e);
      if (!wasOpen) openAndFocus(e.currentTarget);
    },
    onKeyDown: (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        openAndFocus(e.currentTarget, e.key === "ArrowDown" ? "first" : "last");
      }
    },
    "aria-haspopup": "menu",
    "aria-expanded": pop.open,
    "aria-controls": id,
  };

  const body = (
    <>
      {header ? <div className="mb-1 px-3 pt-2 pb-3">{header}</div> : null}
      {groups.map((group, g) => (
        <div key={g} role="group" aria-label={group.label} className={g > 0 ? "mt-1 border-t border-border-subtle pt-1" : ""}>
          {group.label ? (
            <p aria-hidden="true" className="px-3 pt-2 pb-1 font-mono text-[10px] tracking-[0.12em] text-text-tertiary uppercase">
              {group.label}
            </p>
          ) : null}
          {group.items.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                role={item.checked === undefined ? "menuitem" : "menuitemradio"}
                aria-checked={item.checked}
                disabled={item.disabled}
                tabIndex={inline && g === 0 && i === 0 ? 0 : -1}
                onClick={() => {
                  if (!inline) pop.hide(true);
                  item.onSelect();
                }}
                className={`${menuRow} ${
                  item.disabled
                    ? menuRowDisabled
                    : item.danger
                      ? "text-feedback-danger hover:bg-feedback-danger/10 focus-visible:bg-feedback-danger/10"
                      : menuRowIdle
                }`}
              >
                {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0 opacity-80" /> : null}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.meta ? <span className="shrink-0">{item.meta}</span> : null}
                {item.checked ? <CheckIcon aria-hidden="true" className="size-4 shrink-0 text-action-primary-text" /> : null}
              </button>
            );
          })}
        </div>
      ))}
    </>
  );

  if (inline)
    return (
      <div role="menu" aria-label={label} onKeyDown={(e) => moveFocus(e, e.currentTarget, rowsSelector)} className={`min-w-[200px] ${menuPanel}`}>
        {body}
      </div>
    );

  return (
    <>
      {trigger ? (
        trigger(triggerProps)
      ) : (
        <IconButton icon={EllipsisVerticalIcon} label={label} size="sm" {...triggerProps} />
      )}
      <div
        ref={pop.panelRef}
        id={id}
        popover="auto"
        role="menu"
        aria-label={label}
        onKeyDown={onMenuKey}
        className={`min-w-[200px] ${popoverPanel} ${menuPanel}`}
      >
        {body}
      </div>
    </>
  );
}
