import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { IconButton } from "../ui/Button";
import { predictionMarkets, type PredictionMarket } from "../domains/finance/predictionData";
import { MarketBoardCard, MarketIdentity, marketVolume } from "./MarketBoardCards";

const groups = [
  { title: "Sports", categories: ["Sports", "Esports"], filter: "Sports" },
  { title: "Politics & Economy", categories: ["Politics", "Economics"], filter: "Politics" },
  { title: "Crypto", categories: ["Crypto"], filter: "Crypto" },
  { title: "Weather", categories: ["Weather"], filter: "Weather" },
  { title: "Culture & Technology", categories: ["Culture", "Tech", "Social media"], filter: "Culture" },
  { title: "Metals & Finance", categories: ["Finance"], filter: "Finance" },
];

function UpcomingMarkets() {
  const rail = useRef<HTMLElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const measure = () => {
    const element = rail.current;
    if (element) setEdges({ start: element.scrollLeft <= 1, end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 1 });
  };
  useEffect(() => {
    const observer = new ResizeObserver(measure);
    if (rail.current) observer.observe(rail.current);
    measure();
    return () => observer.disconnect();
  }, []);
  const markets = [...predictionMarkets].sort((a, b) => Date.parse(a.closesAt) - Date.parse(b.closesAt)).slice(0, 6);
  return <section className="board-upcoming" aria-labelledby="upcoming-title">
    <header className="board-section-heading"><h2 id="upcoming-title">Upcoming</h2><nav aria-label="Upcoming market navigation">
      <IconButton icon={ChevronLeftIcon} label="Previous upcoming markets" disabled={edges.start} onClick={() => rail.current?.scrollBy({left:-240})}/>
      <IconButton icon={ChevronRightIcon} label="Next upcoming markets" disabled={edges.end} onClick={() => rail.current?.scrollBy({left:240})}/>
    </nav></header>
    <section ref={rail} className="board-upcoming-rail ws-scroll-x" onScroll={measure} data-at-start={edges.start} data-at-end={edges.end}>{markets.map(m => <Link className="board-upcoming-item" to={"/market/" + m.id} key={m.id}>
      <MarketIdentity market={m}/><time dateTime={m.closesAt}>{new Date(m.closesAt).toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"})}</time>
      <h3>{m.question}</h3><small>{m.category}</small>
    </Link>)}</section>
  </section>;
}

function Ranking({ title, markets, to, volume = false }: { title: string; markets: PredictionMarket[]; to: string; volume?: boolean }) {
  return <section className="board-ranking" aria-label={title}>
    <header><h2><Link to={to}>{title}<ChevronRightIcon aria-hidden="true"/></Link></h2></header>
    <ol>{markets.map(m => <li key={m.id}><Link to={"/market/" + m.id}>
      <section><h3>{m.question}</h3><p>{m.outcomes[0].label}</p>{volume && <small>{marketVolume(m.volume)} vol · {m.outcomes.length} outcomes</small>}</section>
      <section className="board-ranking-quote"><strong>{m.outcomes[0].probability}%</strong><abbr title="Percentage-point change since open" data-direction={m.change < 0 ? "down" : "up"}>{m.change > 0 ? "+" : ""}{m.change}</abbr></section>
    </Link></li>)}</ol>
  </section>;
}

export function MarketDiscoveryFeed({ markets, grouped, savedMarkets, onSave, onTrade }: {
  markets: PredictionMarket[]; grouped: boolean; savedMarkets: string[];
  onSave: (id: string) => void; onTrade: (market: PredictionMarket, outcome: string) => void;
}) {
  const byVolume = [...predictionMarkets].sort((a,b) => b.volume-a.volume);
  const movers = [...predictionMarkets].sort((a,b) => Math.abs(b.change)-Math.abs(a.change));
  const newest = predictionMarkets.filter(m=>m.openedAt).sort((a,b)=>Date.parse(b.openedAt!)-Date.parse(a.openedAt!));
  const cards = (items: PredictionMarket[]) => <section className="board-grid" aria-label="Markets">{items.map(m =>
    <MarketBoardCard key={m.id} market={m} saved={savedMarkets.includes(m.id)} onSave={()=>onSave(m.id)} onTrade={outcome=>onTrade(m,outcome)}/>
  )}</section>;
  return <section className={grouped ? "board-browse" : "board-browse board-browse-flat"}>
    <section className="board-feed">
      {grouped ? groups.map((group, index) => <section className="board-category-section" key={group.title}>
        <header className="board-section-heading"><h2><Link to={"/?category="+encodeURIComponent(group.filter)}>{group.title}<ChevronRightIcon aria-hidden="true"/></Link></h2></header>
        {cards(markets.filter(m=>group.categories.includes(m.category)))}
        {index===0 && <UpcomingMarkets/>}
      </section>) : cards(markets)}
    </section>
    {grouped && <aside className="board-rankings" aria-label="Market rankings">
      <Ranking title="Trending" markets={byVolume.slice(0,3)} to="/"/>
      <Ranking title="Top movers" markets={movers.slice(0,3)} to="/?sort=movers"/>
      <Ranking title="New" markets={newest.slice(0,3)} to="/?view=new"/>
      <Ranking title="Highest volume" markets={byVolume.slice(0,3)} to="/?sort=volume" volume/>
    </aside>}
  </section>;
}
