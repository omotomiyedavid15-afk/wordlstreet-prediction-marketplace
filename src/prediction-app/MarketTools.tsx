import { useRef, useState } from "react";
import { AdjustmentsHorizontalIcon, BookmarkIcon, MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button, IconButton } from "../ui/Button";
import { InputField } from "../ui/InputField";
import { Popover } from "../ui/Modal";
import { RadioGroup, Switch } from "../ui/Choice";

export const marketSortOptions = [
  { value: "trending", label: "Trending" }, { value: "movers", label: "Volatile" },
  { value: "new", label: "New" }, { value: "closing", label: "Closing soon" },
  { value: "volume", label: "Volume" }, { value: "balanced", label: "50-50" },
];

export function MarketTools({ query, sort, reverse, savedOnly, onQuery, onSort, onReverse, onSaved }: {
  query: string; sort: string; reverse: boolean; savedOnly: boolean;
  onQuery: (value: string) => void; onSort: (value: string) => void;
  onReverse: (value: boolean) => void; onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const expanded = open || !!query;
  const close = () => { onQuery(""); setOpen(false); requestAnimationFrame(() => trigger.current?.querySelector<HTMLButtonElement>("button")?.focus()); };
  return <section className="market-tools" aria-label="Market tools">
    <section ref={trigger} className="market-search-morph" data-expanded={expanded}>
      {expanded ? <InputField inputRef={input} autoFocus type="search" label="Filter markets" hideLabel hideMessage fieldSize="md"
        leadingIcon={MagnifyingGlassIcon} placeholder="Search markets..." value={query} onChange={e => onQuery(e.target.value)}
        onKeyDown={e => { if (e.key === "Escape") { e.preventDefault(); close(); } }}
        trailingContent={<IconButton size="sm" icon={XMarkIcon} label="Close market search" onClick={close}/>}/>
        : <IconButton icon={MagnifyingGlassIcon} label="Search markets" aria-expanded={false} onClick={() => setOpen(true)}/>}
    </section>
    <Popover label="Market filters" align="end" className="market-filter-menu" trigger={props =>
      <IconButton {...props} icon={AdjustmentsHorizontalIcon} label="Filter markets" tooltip={false}/> }>
      <RadioGroup label="Sort markets" hideLabel options={marketSortOptions} value={sort} onChange={onSort}/>
      <hr/>
      <Switch label="Reverse sort" labelPosition="before" checked={reverse} onChange={onReverse}/>
      {(sort !== "trending" || reverse) && <Button className="market-filter-reset" size="sm" variant="ghost" onClick={() => { onSort("trending"); onReverse(false); }}>Reset sort</Button>}
    </Popover>
    <IconButton icon={BookmarkIcon} variant={savedOnly ? "tonal" : "ghost"} label="Show saved markets" aria-pressed={savedOnly} onClick={onSaved}/>
  </section>;
}
