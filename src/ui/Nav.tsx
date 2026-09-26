import {
  AcademicCapIcon,
  BanknotesIcon,
  BoltIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BellIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  Cog6ToothIcon,
  EyeSlashIcon,
  HomeIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlayCircleIcon,
  ArrowsRightLeftIcon,
  ShoppingBagIcon,
  SparklesIcon,
} from "@heroicons/react/20/solid";
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Avatar } from "./Avatar";
import { Chip, CountBadge, domainLabels, type Domain } from "./Badge";

/* One shape drives both platforms. A sidebar row and a pill-bar button are different
   renderings of the same node, not two components that happen to share a name — which is
   why the label, icon, badge and active state live here rather than in either renderer. */
export type NavNode = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Unread count. Renders as a CountBadge on web, and on the pill bar's avatar. */
  badge?: number;
  /** A short marker such as "New". Reuses the Badge vocabulary rather than a bespoke pill. */
  tag?: string;
  /** A second line under the label — a balance, a status. Web only; the pill bar has no room. */
  secondary?: string;
  disabled?: boolean;
  /** Children expand in place beneath the parent, never as a flyout. */
  children?: NavNode[];
};

/* ------------------------------------------------------------------- Web ---- */

const row =
  "group flex w-full items-center gap-3 rounded-lg px-3 text-left text-[13.5px] transition-colors duration-150";

export function NavItem({
  node,
  active = false,
  activeChildId,
  defaultExpanded = false,
  onSelect,
}: {
  node: NavNode;
  active?: boolean;
  /** Which child is selected, if any — keeps the parent's expansion honest. */
  activeChildId?: string;
  defaultExpanded?: boolean;
  onSelect?: (id: string) => void;
}) {
  const hasChildren = Boolean(node.children?.length);
  const [expanded, setExpanded] = useState(
    defaultExpanded || Boolean(activeChildId && node.children?.some((c) => c.id === activeChildId)),
  );

  const Icon = node.icon;

  return (
    <li>
      <button
        type="button"
        disabled={node.disabled}
        aria-current={active ? "page" : undefined}
        aria-expanded={hasChildren ? expanded : undefined}
        onClick={() => {
          if (hasChildren) setExpanded((v) => !v);
          onSelect?.(node.id);
        }}
        className={`${row} ${node.secondary ? "py-2" : "h-9"} ${
          node.disabled
            ? "cursor-not-allowed text-text-disabled"
            : active
              ? "bg-surface-raised font-medium text-text-primary"
              : "text-text-secondary hover:bg-surface-base hover:text-text-primary"
        }`}
      >
        <Icon className="size-[18px] shrink-0" />

        <span className="min-w-0 flex-1">
          <span className="block truncate">{node.label}</span>
          {node.secondary ? (
            <span className="block truncate text-[12px] text-text-tertiary">
              {node.secondary}
            </span>
          ) : null}
        </span>

        {node.tag ? (
          <Chip size="sm" className="shrink-0">
            {node.tag}
          </Chip>
        ) : null}
        {node.badge !== undefined && node.badge > 0 ? (
          <CountBadge count={node.badge} size="sm" />
        ) : null}
        {hasChildren ? (
          <ChevronRightIcon
            className={`size-3.5 shrink-0 text-text-tertiary transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
          />
        ) : null}
      </button>

      {/* Children sit inline under the parent, joined by a guide line rather than floating
          away in a menu. The line is what says "these belong to the row above". */}
      {hasChildren && expanded ? (
        <ul className="mt-0.5 ml-[22px] border-l border-border-default pl-3">
          {node.children!.map((child) => {
            const isActive = child.id === activeChildId;
            return (
              <li key={child.id}>
                <button
                  type="button"
                  disabled={child.disabled}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onSelect?.(child.id)}
                  className={`flex h-8 w-full items-center rounded-lg px-3 text-left text-[13px] transition-colors duration-150 ${
                    child.disabled
                      ? "cursor-not-allowed text-text-disabled"
                      : isActive
                        ? "bg-surface-raised font-medium text-text-primary"
                        : "text-text-secondary hover:bg-surface-base hover:text-text-primary"
                  }`}
                >
                  <span className="truncate">{child.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

export function NavGroup({
  label,
  action,
  children,
}: {
  label?: string;
  /** A trailing control on the group header — "add bookmark", "manage". */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border-subtle py-3 first:border-t-0">
      {label ? (
        <div className="flex items-center justify-between px-3 pt-1 pb-1.5">
          <h3 className="font-mono text-[10px] font-medium tracking-[0.16em] text-text-tertiary uppercase">
            {label}
          </h3>
          {action}
        </div>
      ) : null}
      <ul className="space-y-0.5">{children}</ul>
    </section>
  );
}

/* ---------------------------------------------------------------- Mobile ---- */

export const domainIcons: Record<Domain, ComponentType<{ className?: string }>> = {
  finance: BanknotesIcon,
  social: ChatBubbleLeftRightIcon,
  vivid: SparklesIcon,
  xstream: BoltIcon,
  marketplace: ShoppingBagIcon,
  vision: PlayCircleIcon,
  academy: AcademicCapIcon,
  prediction: ChartBarIcon,
};

/* Each domain row carries its own accent, the same treatment the Domain Tag uses on the
   Badges page — a tinted badge behind a coloured glyph. Static strings so Tailwind can
   see every class at build time. */
export const domainBadge: Record<Domain, string> = {
  finance: "bg-action-primary-tonal text-action-primary-text",
  social: "bg-domain-social/15 text-domain-social",
  vivid: "bg-domain-vivid/15 text-domain-vivid",
  xstream: "bg-domain-xstream/15 text-domain-xstream",
  marketplace: "bg-domain-marketplace/15 text-domain-marketplace",
  vision: "bg-domain-vision/15 text-domain-vision",
  academy: "bg-domain-academy/15 text-domain-academy",
  prediction: "bg-domain-prediction/15 text-domain-prediction",
};

const domainRing: Record<Domain, string> = {
  finance: "ring-action-primary/40",
  social: "ring-domain-social/40",
  vivid: "ring-domain-vivid/40",
  xstream: "ring-domain-xstream/40",
  marketplace: "ring-domain-marketplace/40",
  vision: "ring-domain-vision/40",
  academy: "ring-domain-academy/40",
  prediction: "ring-domain-prediction/40",
};

export const allDomains = Object.keys(domainLabels) as Domain[];

/** A single row in the domain switcher. Coloured badge plus a clear active pill — the
 *  two things worth taking from the domain-list reference. */
export function DomainRow({
  domain,
  active = false,
  disabled = false,
  showChevron = false,
  onSelect,
}: {
  domain: Domain;
  active?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  onSelect?: () => void;
}) {
  const Icon = domainIcons[domain];
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-current={active ? "true" : undefined}
      className={`flex h-11 w-full items-center gap-3 rounded-xl px-2.5 text-left transition-colors duration-150 ${
        disabled ? "cursor-not-allowed opacity-50" : active ? "bg-surface-raised" : "hover:bg-surface-base"
      }`}
    >
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-[10px] ${domainBadge[domain]} ${
          active ? `ring-2 ${domainRing[domain]}` : ""
        }`}
      >
        <Icon className="size-[18px]" />
      </span>
      <span
        className={`min-w-0 flex-1 truncate text-[13.5px] ${active ? "font-medium text-text-primary" : "text-text-secondary"}`}
      >
        {domainLabels[domain]}
      </span>
      {showChevron && !disabled ? (
        <ChevronRightIcon className="size-4 shrink-0 text-text-tertiary" aria-hidden="true" />
      ) : disabled ? (
        <span className="shrink-0 font-mono text-[10px] text-text-tertiary">Soon</span>
      ) : active ? (
        <Chip size="sm" className="shrink-0">
          Current
        </Chip>
      ) : null}
    </button>
  );
}

export interface MobileNavModule {
  domain: Domain;
  items: NavNode[];
}

export interface MobileNavBarProps {
  items: NavNode[];
  activeId?: string;
  domain: Domain;
  modules?: MobileNavModule[];
  onSelect?: (id: string) => void;
  onDomainChange?: (domain: Domain) => void;
  onModuleSelect?: (id: string, domain: Domain) => void;
}

/** The mobile dock expands into its module drawer as one continuous surface. */
export function MobileNavBar({
  items,
  activeId,
  domain,
  modules,
  onSelect,
  onDomainChange,
  onModuleSelect,
}: MobileNavBarProps) {
  const [open, setOpen] = useState(false);
  const [menuDomain, setMenuDomain] = useState<Domain | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef(false);
  const reduceMotion = useReducedMotion();
  const menuModules = modules ?? allDomains.map((value) => ({ domain: value, items: [] }));
  const selectedModules = menuModules.find((group) => group.domain === menuDomain)?.items ?? [];

  const closeMenu = (restoreFocus = false) => {
    restoreFocusRef.current = restoreFocus;
    setOpen(false);
    setMenuDomain(null);
  };

  useEffect(() => {
    if (!open) return;
    let frame = 0;
    let attempts = 0;
    const label = menuDomain ? `${domainLabels[menuDomain]} modules` : "Switch module";
    const focusMenu = () => {
      if (menuRef.current?.getAttribute("aria-label") === label) {
        menuRef.current.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
      } else if (attempts++ < 30) {
        frame = requestAnimationFrame(focusMenu);
      }
    };
    frame = requestAnimationFrame(focusMenu);
    return () => cancelAnimationFrame(frame);
  }, [open, menuDomain]);

  useEffect(() => {
    if (open || !restoreFocusRef.current) return;
    let frame = 0;
    let attempts = 0;
    const focusDock = () => {
      if (moreRef.current) {
        moreRef.current.focus();
        restoreFocusRef.current = false;
      } else if (attempts++ < 45) {
        frame = requestAnimationFrame(focusDock);
      }
    };
    frame = requestAnimationFrame(focusDock);
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        restoreFocusRef.current = false;
        setOpen(false);
        setMenuDomain(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        restoreFocusRef.current = true;
        setOpen(false);
        setMenuDomain(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <motion.div
      ref={rootRef}
      layout
      initial={false}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 440, damping: 42, mass: 0.9 }}
      className={`ws-nav-pill relative mx-auto max-w-[calc(100vw-32px)] overflow-hidden border border-border-default shadow-[var(--ws-shadow-overlay)] ${open ? "w-[320px] rounded-[20px]" : "w-fit rounded-full"}`}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {open ? (
          <motion.div
            key={menuDomain ?? "domains"}
            ref={menuRef}
            id="ws-mobile-module-menu"
            role="dialog"
            aria-label={menuDomain ? `${domainLabels[menuDomain]} modules` : "Switch module"}
            initial={reduceMotion ? false : { opacity: 0, filter: "blur(5px)", y: 6 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, filter: "blur(5px)", y: -4 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
            className="max-h-[min(55dvh,400px)] overflow-y-auto p-2"
          >
            {menuDomain ? (
              <>
                <button
                  type="button"
                  onClick={() => setMenuDomain(null)}
                  className="flex h-11 w-full items-center gap-2 rounded-xl px-2.5 text-left text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-base hover:text-text-primary"
                >
                  <ChevronLeftIcon className="size-4" aria-hidden="true" />
                  Back
                </button>
                <div className="mx-2 my-1 border-t border-border-subtle" />
                {selectedModules.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={item.disabled}
                      aria-current={item.id === activeId ? "page" : undefined}
                      onClick={() => {
                        onModuleSelect?.(item.id, menuDomain);
                        onDomainChange?.(menuDomain);
                        closeMenu();
                      }}
                      className={`flex h-11 w-full items-center gap-3 rounded-xl px-2.5 text-left text-[13.5px] transition-colors ${item.disabled ? "cursor-not-allowed text-text-tertiary opacity-50" : item.id === activeId ? "bg-surface-raised font-medium text-text-primary" : "text-text-secondary hover:bg-surface-base hover:text-text-primary"}`}
                    >
                      <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.disabled ? <span className="font-mono text-[10px]">Soon</span> : null}
                    </button>
                  );
                })}
              </>
            ) : (
              menuModules.map((group) => (
                <DomainRow
                  key={group.domain}
                  domain={group.domain}
                  active={group.domain === domain}
                  disabled={Boolean(modules && !group.items.some((item) => !item.disabled))}
                  showChevron={Boolean(modules)}
                  onSelect={() => {
                    if (modules) setMenuDomain(group.domain);
                    else {
                      onDomainChange?.(group.domain);
                      closeMenu();
                    }
                  }}
                />
              ))
            )}
          </motion.div>
        ) : (
          <motion.nav
            key="dock"
            aria-label={`${domainLabels[domain]} mobile navigation`}
            initial={reduceMotion ? false : { opacity: 0, filter: "blur(5px)", scale: 0.96 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, filter: "blur(5px)", scale: 0.96 }}
            transition={{ duration: reduceMotion ? 0 : 0.14 }}
            className="flex h-[54px] items-center gap-0.5 px-1.5"
          >
            {items.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  disabled={item.disabled}
                  onClick={() => onSelect?.(item.id)}
                  className={`grid size-11 shrink-0 place-items-center rounded-full transition-colors duration-150 ${item.disabled ? "cursor-not-allowed text-text-disabled" : active ? "bg-surface-raised text-text-primary" : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"}`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </button>
              );
            })}
            <button
              ref={moreRef}
              type="button"
              title="More"
              aria-label="More, switch module"
              aria-haspopup="dialog"
              aria-expanded={false}
              onClick={() => {
                setMenuDomain(null);
                setOpen(true);
              }}
              className="grid size-11 shrink-0 place-items-center rounded-full text-text-secondary transition-colors duration-150 hover:bg-surface-raised hover:text-text-primary"
            >
              <ChevronUpDownIcon className="size-5" aria-hidden="true" />
            </button>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* Real viewport sizes, so the nav is judged at the scale it actually ships at. Both
   frames render at true pixel dimensions and are scaled down to fit the docs column —
   the layout inside is never distorted, only the whole frame is. */
export const MOBILE_VIEWPORT = { w: 402, h: 874 };
export const WEB_VIEWPORT = { w: 1440, h: 1025 };

export function ScaledFrame({
  width,
  height,
  scale,
  className = "",
  children,
}: {
  width: number;
  height: number;
  scale: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="relative mx-auto shrink-0"
      style={{ width: width * scale, height: height * scale }}
    >
      <div
        className={className}
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** A phone at 402 × 874 — an iPhone 16 viewport. The pill bar is docked at the bottom
 *  with real safe-area room beneath it, which is the only way to judge whether the bar
 *  is reachable by a thumb. */
export function DeviceFrame({
  children,
  pageTitle,
  scale = 0.62,
}: {
  children: ReactNode;
  pageTitle?: string;
  scale?: number;
}) {
  return (
    <ScaledFrame
      width={MOBILE_VIEWPORT.w}
      height={MOBILE_VIEWPORT.h}
      scale={scale}
      className="flex flex-col justify-end overflow-hidden rounded-[48px] border-[6px] border-border-strong bg-surface-canvas px-4 pb-8"
    >
      <div className="pointer-events-none absolute top-0 right-0 left-0 flex items-center justify-between px-8 pt-4 font-mono text-[13px] text-text-secondary">
        <span>9:41</span>
        <span className="text-text-tertiary">WorldStreet</span>
      </div>
      {/* A page behind the bar. A nav docked over nothing cannot be judged. */}
      <div className="absolute top-14 right-0 left-0 px-5">
        <p className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">
          {pageTitle ?? "Balance"}
        </p>
        <p className="mt-1 font-mono text-[22px] text-text-secondary tabular-nums">₦2,023,267.12</p>
        <div className="mt-6 space-y-2">
          {["Bakare Adunni", "Chidi Okafor", "Zainab Yusuf"].map((n) => (
            <div
              key={n}
              className="flex items-center justify-between rounded-xl bg-surface-base px-4 py-3"
            >
              <span className="text-[14px] text-text-primary">{n}</span>
              <span className="font-mono text-[13px] text-text-tertiary tabular-nums">₦40,000</span>
            </div>
          ))}
        </div>
      </div>

      {/* The home indicator, so the bar's distance from the bottom edge is honest. */}
      <div className="pointer-events-none absolute right-0 bottom-2 left-0 flex justify-center">
        <span className="h-[5px] w-[134px] rounded-full bg-border-strong" />
      </div>
      {children}
    </ScaledFrame>
  );
}

/** A desktop viewport at 1440 × 1025, rendered as a working app shell rather than a bare
 *  sidebar strip. The top bar is split at the sidebar's edge: workspace identity sits in
 *  the sidebar column and shares its background, search and account actions run across
 *  the content column. Navigation only reads correctly against the thing it navigates. */
export function BrowserFrame({
  sidebar,
  workspace = "WorldStreet",
  plan = "Pro",
  title,
  titleTag,
  actions,
  children,
  scale = 0.6,
}: {
  sidebar: ReactNode;
  workspace?: string;
  plan?: string;
  /** The page header below the bar — the title of wherever the nav has led. */
  title?: string;
  titleTag?: string;
  actions?: ReactNode;
  children?: ReactNode;
  scale?: number;
}) {
  return (
    <ScaledFrame
      width={WEB_VIEWPORT.w}
      height={WEB_VIEWPORT.h}
      scale={scale}
      className="flex flex-col overflow-hidden rounded-xl border border-border-default bg-surface-canvas"
    >
      <header className="flex h-14 shrink-0 items-stretch border-b border-border-subtle">
        {/* Identity lives inside the sidebar column and carries its surface, so the two
            read as one region rather than a bar floating over a panel. */}
        <div className="flex w-[264px] shrink-0 items-center gap-2.5 border-r border-border-subtle bg-surface-sunken px-4">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-action-primary text-[12px] font-bold text-text-on-accent">
            W
          </span>
          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-text-primary">
            {workspace}
          </span>
          {plan ? (
            <span className="shrink-0 rounded-md bg-surface-raised px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">
              {plan}
            </span>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3 px-5">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-2 text-left text-text-tertiary transition-colors duration-150 hover:text-text-secondary"
          >
            <MagnifyingGlassIcon className="size-[18px] shrink-0" />
            <span className="truncate text-[14px]">Search for anything</span>
          </button>

          <div className="flex shrink-0 items-center gap-1">
            {actions}
            {[EyeSlashIcon, Cog6ToothIcon, BellIcon].map((Glyph, i) => (
              <button
                key={i}
                type="button"
                aria-label={["Hide balances", "Settings", "Notifications"][i]}
                className="grid size-9 place-items-center rounded-lg text-text-tertiary transition-colors duration-150 hover:bg-surface-base hover:text-text-primary"
              >
                <Glyph className="size-[18px]" />
              </button>
            ))}
            <span className="pl-1">
              <Avatar name="Bakare Adunni" size="sm" />
            </span>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="h-full w-[264px] shrink-0 overflow-y-auto border-r border-border-subtle bg-surface-sunken px-2">
          {sidebar}
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto">
          {title ? (
            <div className="flex items-center justify-between gap-4 px-10 pt-8 pb-6">
              <div className="flex min-w-0 items-center gap-3">
                <h2 className="truncate text-[30px] font-semibold tracking-[-0.02em] text-text-primary">
                  {title}
                </h2>
                {titleTag ? (
                  <span className="shrink-0 rounded-md bg-surface-base px-2 py-1 text-[12px] text-text-secondary">
                    {titleTag}
                  </span>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-[14px] text-text-secondary transition-colors duration-150 hover:text-text-primary"
                >
                  <ArrowsRightLeftIcon className="size-4" />
                  Transfer funds
                </button>
                <button
                  type="button"
                  className="ws-pressable-flat flex items-center gap-1.5 rounded-lg border border-border-default bg-surface-base px-3.5 py-2 text-[14px] text-text-primary transition-colors duration-150 hover:border-border-strong"
                >
                  Add account
                  <ChevronDownIcon className="size-4 text-text-tertiary" />
                </button>
              </div>
            </div>
          ) : null}
          <div className="px-10 pb-10">{children}</div>
        </div>
      </div>
    </ScaledFrame>
  );
}

export const mobileNavItems: NavNode[] = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "search", label: "Search", icon: MagnifyingGlassIcon },
  { id: "inbox", label: "Inbox", icon: InboxIcon },
  { id: "compose", label: "Compose", icon: PencilSquareIcon },
];
