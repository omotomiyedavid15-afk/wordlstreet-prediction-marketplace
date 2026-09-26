import { useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { ChevronLeftIcon, ChevronRightIcon, SquaresPlusIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";
import { Modal } from "../ui/Modal";
import { Button, IconButton } from "../ui/Button";
import { MarketTools } from "./MarketTools";
import { CategoryMarkets } from "./CategoryMarkets";
import { PredictionTradeTicket } from "./PredictionTradeTicket";
import { predictionMarkets, type PredictionMarket } from "../domains/finance/predictionData";
import { usePrediction } from "./PredictionContext";
import { FeaturedMarket, marketVolume } from "./MarketBoardCards";
import { MarketDiscoveryFeed } from "./MarketDiscoveryFeed";
import { cryptoLogo } from "../ui/logos";
import "./marketBoard.css";
import "./categoryMarkets.css";

export function PredictionHome() {
  const [params, setParams] = useSearchParams();
  const { savedMarkets, toggleSaveMarket } = usePrediction();
  const [featuredIndex,setFeaturedIndex] = useState(1);
  const [savedOnly,setSavedOnly] = useState(false);
  const navigate = useNavigate();
  const [selection,setSelection] = useState<{market:PredictionMarket;outcome:string}|null>(null);
  const grid = useRef<HTMLElement>(null);
  const query = params.get("q") ?? "";
  const category = params.get("category") ?? "All";
  const sort = params.get("sort") ?? "trending";
  const reverse = params.get("reverse") === "true";
  const view = params.get("view") ?? "";
  const update = (key:string,value:string) => setParams(current=>{const next=new URLSearchParams(current);value ? next.set(key,value) : next.delete(key);return next;});
  const featured = predictionMarkets[featuredIndex];
  const markets = predictionMarkets.filter(m =>
    (category === "All" || m.category === (category === "Economy" ? "Economics" : category)) &&
    m.question.toLowerCase().includes(query.toLowerCase()) &&
    (!savedOnly || savedMarkets.includes(m.id)) &&
    (view !== "breaking" || m.breaking) && (view !== "new" || m.openedAt) && (view !== "live" || m.liveDemo)
  ).sort((a, b) => (reverse ? -1 : 1) * (view === "new" || sort === "new" ? Date.parse(b.openedAt ?? "2026-01-01") - Date.parse(a.openedAt ?? "2026-01-01") : sort === "closing" ? Date.parse(a.closesAt) - Date.parse(b.closesAt) : sort === "movers" ? Math.abs(b.change)-Math.abs(a.change) : sort === "balanced" ? Math.abs(a.outcomes[0].probability - 50) - Math.abs(b.outcomes[0].probability - 50) : sort === "trending" ? (b.volume * (1 + Math.abs(b.change) / 100)) - (a.volume * (1 + Math.abs(a.change) / 100)) : b.volume - a.volume));
  const hot = [...predictionMarkets].sort((a,b)=>b.volume-a.volume).slice(0,5);
  const marketTools = <MarketTools query={query} sort={sort} reverse={reverse} savedOnly={savedOnly} onQuery={value=>update("q",value)} onSort={value=>update("sort",value)} onReverse={value=>update("reverse",value?"true":"")} onSaved={()=>setSavedOnly(!savedOnly)}/>;
  if(view==="perps")return <Navigate to="/perps" replace/>;
  if(view === "live") return <CategoryMarkets key="live-sports" category="Sports" markets={markets.filter(m => m.category === "Sports" && m.liveDemo)} tools={marketTools} savedMarkets={savedMarkets} onSave={toggleSaveMarket} onTrade={(market,outcome)=>setSelection({market,outcome})}/>;
  return <section className="market-home">
    {category === "All" && <h1 className="sr-only">Prediction markets</h1>}
    {!query && category==="All" && !savedOnly && !view && <section className="board-lead" aria-label="Featured markets and discovery">
      <section className="board-stage">
        <FeaturedMarket market={featured} saved={savedMarkets.includes(featured.id)} onSave={()=>toggleSaveMarket(featured.id)} onTrade={outcome=>setSelection({market:featured,outcome})}/>
        <nav className="board-carousel" aria-label="Featured market navigation">
          <section className="board-dots">{predictionMarkets.slice(0,6).map((m,i)=><Button size="sm" variant="ghost" key={m.id} aria-label={"Show featured market: "+m.question} aria-current={i===featuredIndex?"true":undefined} onClick={()=>setFeaturedIndex(i)}>{null}</Button>)}</section>
          <section className="board-arrows">
            <IconButton icon={ChevronLeftIcon} label="Previous featured market" onClick={()=>setFeaturedIndex(i=>(i+5)%6)}/>
            <IconButton icon={ChevronRightIcon} label="Next featured market" onClick={()=>setFeaturedIndex(i=>(i+1)%6)}/>
          </section>
        </nav>
      </section>
      <aside className="board-sidebar" aria-label="Discover">
        <article className="board-promo">
          <img src={cryptoLogo("BTC")} alt="" className="board-promo-coin"/>
          <h2>Perpetuals</h2><p>Crypto, around the clock.</p>
          <Button size="sm" suffixIcon={ArrowTrendingUpIcon} onClick={()=>navigate("/perps")}>Explore perpetuals</Button>
        </article>
        <article className="board-promo board-promo-watch">
          <h2><SquaresPlusIcon aria-hidden="true"/>Your watchlist</h2><p>{predictionMarkets.filter(m=>savedMarkets.includes(m.id)).length} markets saved</p>
          <Button size="sm" variant="tonal" onClick={()=>{setSavedOnly(true);grid.current?.scrollIntoView({block:"start"});}}>View saved markets</Button>
        </article>
        <section className="board-hot">
          <h2>Hot topics<ChevronRightIcon aria-hidden="true"/></h2>
          <ol>{hot.map((m,i)=><li key={m.id}><Link to={"/market/"+m.id}><span>{i+1}</span><strong>{m.symbol??(m.category==="Economics"?"Fed decision":m.category==="Sports"?"Premier League":m.category==="Politics"?"Electoral reform":m.category==="Finance"?"Gold":"AI benchmarks")}</strong><small>{marketVolume(m.volume)} Vol.</small><ChevronRightIcon aria-hidden="true"/></Link></li>)}</ol>
          <Button onClick={()=>grid.current?.scrollIntoView({block:"start"})}>Explore all</Button>
        </section>
      </aside>
    </section>}
    {category !== "All" ? <CategoryMarkets key={category} category={category} markets={markets} tools={marketTools} savedMarkets={savedMarkets} onSave={toggleSaveMarket} onTrade={(market,outcome)=>setSelection({market,outcome})}/> : <section ref={grid} className="board-list" aria-label="Browse markets">
      <header className="board-toolbar">{(savedOnly||view||query) && <h2>{savedOnly?"Saved markets":view==="live"?"Live markets":view==="breaking"?"Breaking markets":view==="new"?"New markets":"Search results"}</h2>}{marketTools}</header>
      {markets.length > 0 && <MarketDiscoveryFeed markets={markets} grouped={!query && category==="All" && !savedOnly && !view && !params.has("sort")} savedMarkets={savedMarkets} onSave={toggleSaveMarket} onTrade={(market,outcome)=>setSelection({market,outcome})}/>}
      {!markets.length && <section className="board-empty"><p>No markets match these filters.</p><Button variant="tonal" onClick={()=>{setParams({});setSavedOnly(false);}}>Show all markets</Button></section>}
    </section>}
    <Modal open={!!selection} onClose={()=>setSelection(null)} title="Trade outcome" size="md">{selection&&<PredictionTradeTicket key={selection.market.id+selection.outcome} market={selection.market} initialOutcome={selection.outcome}/>}</Modal>
  </section>;
}
