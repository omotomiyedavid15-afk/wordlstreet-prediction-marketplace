import { useEffect, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button, IconButton } from "../ui/Button";
import { Modal, Popover } from "../ui/Modal";
import { RadioGroup } from "../ui/Choice";
import { PredictionTradeTicket } from "./PredictionTradeTicket";
import { SportsEventRail } from "./SportsEventRail";
import { predictionMarkets, type PredictionMarket } from "../domains/finance/predictionData";
import { FeaturedMarket, MarketBoardCard } from "./MarketBoardCards";
import { categoryGroups, hasMarketGroup } from "./categoryCatalog";

function CategorySidebar({ category, group }: { category: string; group: string }) {
  const [params] = useSearchParams();
  const destination = (label: string) => { const next = new URLSearchParams(params); label ? next.set("group", label) : next.delete("group"); next.delete("sport"); return "/?" + next; };
  const link = (label: string, all = false) => <Link to={destination(all ? "" : label)} aria-current={group === (all ? "" : label) ? "page" : undefined}>{label}</Link>;
  return <nav className="category-sidebar" aria-label={category + " subgroups"}>
    {category === "Sports" && <p className="category-sidebar-kicker">Featured</p>}
    {link("All markets", true)}
    {category === "Sports" && <p className="category-sidebar-next">What's next</p>}
    {(categoryGroups[category] ?? []).map(item => item.children ? <details key={item.label} open={group === item.label || item.children.includes(group) ? true : undefined}>
      <summary>{item.label}<ChevronDownIcon aria-hidden="true"/></summary>
      <section>{link(item.label)}{item.children.map(child => <section key={child}>{link(child)}</section>)}</section>
    </details> : <section key={item.label}>{link(item.label)}</section>)}
  </nav>;
}

function SportsTicket({ market, outcome }: { market: PredictionMarket; outcome: string }) {
  return <PredictionTradeTicket market={market} initialOutcome={outcome}/>;
}

export function CategoryMarkets({ category, markets, tools, savedMarkets, onSave, onTrade }: {
  category: string; markets: PredictionMarket[]; tools: ReactNode; savedMarkets: string[];
  onSave: (id: string) => void; onTrade: (market: PredictionMarket, outcome: string) => void;
}) {
  const [params, setParams] = useSearchParams();
  const group = params.get("group") ?? "";
  const frequency = params.get("frequency") ?? "all";
  const sport = params.get("sport") ?? "All";
  const sports = category === "Sports";
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 1000px)").matches);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [picked, setPicked] = useState<{ market: PredictionMarket; outcome: string } | null>(null);
  const [promo, setPromo] = useState(true);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1000px)");
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const update = (key: string, value: string) => setParams(current => { const next = new URLSearchParams(current); value ? next.set(key, value) : next.delete(key); return next; });
  const filtered = markets.filter(m => hasMarketGroup(m, group) && (frequency === "all" || hasMarketGroup(m, frequency)) && (!sports || sport === "All" || (m.sportType ?? "Futures") === sport));
  const liveCount = filtered.filter(m => m.liveDemo).length;
  const featured = filtered[featuredIndex % Math.max(filtered.length, 1)];
  const events = predictionMarkets.filter(m => m.category === "Sports");
  const activeTicket = picked ?? (filtered[0] ? { market: filtered[0], outcome: filtered[0].outcomes[0].id } : null);
  const trade = (market: PredictionMarket, outcome: string) => {
    if (!sports) { onTrade(market, outcome); return; }
    setPicked({ market, outcome }); setTicketOpen(true);
  };
  const cards = <section className={sports ? "sports-market-list" : "board-grid"} aria-label={category + " markets"}>{filtered.map(m => <MarketBoardCard key={m.id} market={m} saved={savedMarkets.includes(m.id)} onSave={() => onSave(m.id)} onTrade={outcome => trade(m, outcome)}/>)}</section>;
  return <section className="category-screen" data-category={category}>
    {sports && <SportsEventRail markets={events} onSelect={trade}/>}
    <section className="category-layout">
      <CategorySidebar category={category} group={group}/>
      <section className="category-content">
        <header className="category-heading"><h1>{sports && liveCount > 0 ? <>LIVE <small className="category-live-count">· {liveCount}</small></> : group || category}</h1><section className="category-heading-tools">{tools}
          {!sports && <Popover label="Market frequency" align="end" className="market-filter-menu" trigger={p => <Button {...p} suffixIcon={ChevronDownIcon}>{frequency === "all" ? "Frequency" : frequency}</Button>}>
            <RadioGroup label="Frequency" hideLabel value={frequency} onChange={value => update("frequency", value)} options={["all", "15 min", "Hourly", "Daily", "Weekly", "Monthly", "Annual"].map(value => ({ value, label: value === "all" ? "All frequencies" : value }))}/>
          </Popover>}
        </section></header>
        {category === "Crypto" && !group && promo && <section className="category-perps-banner"><section><h2>Perpetuals</h2><p>Explore crypto markets</p></section><Link to="/?view=perps">Explore perps<ChevronRightIcon aria-hidden="true"/></Link><IconButton icon={XMarkIcon} label="Dismiss perpetuals banner" onClick={() => setPromo(false)}/></section>}
        {!sports && featured && <section className="category-featured">
          <FeaturedMarket market={featured} saved={savedMarkets.includes(featured.id)} onSave={() => onSave(featured.id)} onTrade={outcome => trade(featured, outcome)}/>
          <nav aria-label="Category featured markets"><IconButton icon={ChevronLeftIcon} label="Previous category feature" disabled={filtered.length < 2} onClick={() => setFeaturedIndex(i => (i + filtered.length - 1) % filtered.length)}/><small>{featuredIndex % filtered.length + 1} of {filtered.length}</small><IconButton icon={ChevronRightIcon} label="Next category feature" disabled={filtered.length < 2} onClick={() => setFeaturedIndex(i => (i + 1) % filtered.length)}/></nav>
        </section>}
        {sports && <nav className="sports-types ws-scroll-x" aria-label="Sports market types">{["All", "Games", "Props", "To advance", "Futures", "Win totals", "Awards"].map(label => <Button key={label} variant={sport === label ? "tonal" : "secondary"} shape="pill" aria-pressed={sport === label} onClick={() => update("sport", label)}>{label} ({markets.filter(m => hasMarketGroup(m, group) && (label === "All" || (m.sportType ?? "Futures") === label)).length})</Button>)}</nav>}
        {filtered.length ? sports ? <section className="sports-trading-layout">{cards}{activeTicket && !mobile && <aside className="sports-ticket" aria-label="Sports trade ticket"><SportsTicket market={activeTicket.market} outcome={activeTicket.outcome}/></aside>}</section> : cards
          : <section className="board-empty"><p>No sample markets match this selection.</p><Button onClick={() => setParams({ category })}>Show all {category.toLowerCase()} markets</Button></section>}
      </section>
    </section>
    <Modal open={sports && mobile && ticketOpen} onClose={() => setTicketOpen(false)} title="Trade outcome" size="md">{activeTicket && <SportsTicket market={activeTicket.market} outcome={activeTicket.outcome}/>}</Modal>
  </section>;
}
