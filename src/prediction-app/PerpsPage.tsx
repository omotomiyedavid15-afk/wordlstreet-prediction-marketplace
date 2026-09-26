import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeftIcon, ArrowRightIcon, ChartBarIcon, ChartBarSquareIcon, ChartPieIcon, ChevronDownIcon, MagnifyingGlassIcon, StarIcon } from "@heroicons/react/24/outline";
import { Button, IconButton } from "../ui/Button";
import { SelectDropdown } from "../ui/Dropdown";
import { Modal } from "../ui/Modal";
import { Accordion, AccordionItem } from "../ui/Accordion";
import { LineChart, Sparkline } from "../ui/Charts";
import { PerpAssetMark } from "./PerpAssetMark";
import { PerpAssetPalette } from "./PerpAssetPalette";
import { PerpPositionTicket } from "./PerpPositionTicket";
import { IndexCandlestickChart } from "./IndexCandlestickChart";
import { usePerps } from "./PerpsContext";
import { compactPerpMoney, liquidationEstimate, perpAssets, perpCandles, perpGroups, perpMoney, perpReference, type PerpAsset, type PerpDirection } from "./perpsData";
import banner from "../domains/finance/assets/perps-banner-figma.png";
import "./marketBoard.css";
import "./perps.css";

export function PerpsPage() {
  const {symbol}=useParams();const [params,setParams]=useSearchParams();const navigate=useNavigate();
  const location=useLocation();
  const [palette,setPalette]=useState(false);const [learn,setLearn]=useState(false);
  const asset=perpAssets.find(a=>a.symbol===symbol?.toUpperCase());
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();setPalette(p=>!p);}};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);},[]);
  useEffect(()=>{if(location.hash==="#perp-account"){const timer=setTimeout(()=>document.getElementById("perp-account")?.scrollIntoView({block:"start"}),50);return()=>clearTimeout(timer);}},[location.key,location.hash]);
  const select=(symbol:string)=>{setPalette(false);navigate(`/perps/${symbol}`);};
  const group=params.get("group")??"All",q=(params.get("q")??"").toLowerCase();
  const exchange=params.get("exchange")??"All";
  const exchanges=[...new Set(perpAssets.filter(a=>(group==="All"||a.group===group)&&a.exchange).map(a=>a.exchange!))].sort();
  const filtered=perpAssets.filter(a=>(group==="All"||a.group===group)&&(exchange==="All"||a.exchange===exchange)&&`${a.symbol} ${a.name} ${a.exchange??""} ${a.referenceCurrency??""}`.toLowerCase().includes(q));
  return <section className="perps-page">
    {symbol&&!asset?<section className="perp-empty"><h1>Perpetual not found</h1><Button onClick={()=>navigate("/perps")}>All perpetuals</Button></section>:asset?<PerpWorkspace key={asset.symbol} asset={asset} direction={params.get("direction")==="down"?"down":"up"} onPalette={()=>setPalette(true)}/>:<>
      <section className="perp-banner" style={{backgroundImage:`url(${banner})`}} aria-label="WorldStreet perpetuals" data-theme="dark">
        <section><p>WORLDSTREET / PERPETUALS</p><h1>Both sides of the market.</h1><p>Crypto, metals, stocks and indices. No expiry.</p><section className="perp-banner-actions"><Button size="lg" variant="primary" suffixIcon={ArrowRightIcon} onClick={()=>setPalette(true)}>Explore Positions</Button><Button size="lg" variant="secondary" suffixIcon={ArrowRightIcon} onClick={()=>setLearn(true)}>Learn about Perpetuals</Button></section></section>
      </section>
      <header className="perp-page-heading"><section><h2>Perpetual markets</h2><p>{filtered.length} markets / Sample data / Demo trading</p></section><section className="perp-market-tools">{exchanges.length>0&&<SelectDropdown label="Reference market" hideLabel value={exchange} onChange={value=>setParams(previous=>{const next=new URLSearchParams(previous);if(value==="All")next.delete("exchange");else next.set("exchange",String(value));return next;})} options={[{value:"All",label:"All reference markets"},...exchanges.map(value=>({value,label:value}))]}/>}<Button variant="secondary" prefixIcon={MagnifyingGlassIcon} onClick={()=>setPalette(true)}>Find an asset</Button></section></header>
      {perpGroups.filter(g=>filtered.some(a=>a.group===g)).map(g=><section className="perp-market-group" key={g}><h3>{g} perpetuals ({filtered.filter(a=>a.group===g).length})</h3><section className="perp-list" aria-label={`${g} perpetuals`}>
        {filtered.filter(a=>a.group===g).map(a=><PerpMarketRow key={a.symbol} asset={a}/>)}</section></section>)}
      {!filtered.length&&<p className="perp-empty">No assets match this search.</p>}
    </>}
    <PerpAssetPalette open={palette} onClose={()=>setPalette(false)} onSelect={select}/>
    <Modal open={learn} onClose={()=>setLearn(false)} title="Perpetuals" size="sm"><p>Take a long or short position in an asset without a scheduled expiry. Margin is the collateral supporting your position; leverage increases both exposure and risk.</p><p>Funding payments and fees can change returns. A position may be liquidated if its collateral is insufficient. All prices, balances and orders in this workspace are simulated.</p></Modal>
  </section>;
}

function PerpMarketRow({asset}:{asset:PerpAsset}) {
  const navigate=useNavigate();const {watchlist,toggleWatch}=usePerps();
  return <article className="perp-market-row">
    <Link className="perp-row-main" to={`/perps/${asset.symbol}`} aria-label={`Open ${asset.name} perpetual`}>
      <section className="perp-identity"><PerpAssetMark asset={asset}/><p><strong>{asset.symbol}</strong><small>{asset.name}</small><small><b className="perp-accent">{asset.maxLeverage}x</b>{asset.exchange?` / ${asset.exchange}`:" max leverage"}</small></p></section>
      <p>{perpMoney(asset.price)}<small data-positive={asset.change>=0}>{asset.change>=0?"+":""}{asset.change.toFixed(2)}%</small>{perpReference(asset)&&<small>{perpReference(asset)} ref.</small>}</p>
      <p className="perp-row-volume">24h vol {compactPerpMoney(asset.volume)}<small>Funding <b data-positive="true">{asset.funding}%</b></small></p>
      <section className="perp-mini-chart"><Sparkline values={perpCandles(asset,"1D",60).map(c=>c.close)} tone={asset.change>=0?"success":"danger"} label={`${asset.symbol} sample price`}/></section>
    </Link>
    <section className="perp-row-actions"><Button size="sm" variant="secondary" onClick={()=>navigate(`/perps/${asset.symbol}?direction=up`)}>Up</Button><Button size="sm" variant="secondary" onClick={()=>navigate(`/perps/${asset.symbol}?direction=down`)}>Down</Button><IconButton size="sm" icon={StarIcon} variant={watchlist.includes(asset.symbol)?"tonal":"ghost"} label={`${watchlist.includes(asset.symbol)?"Unwatch":"Watch"} ${asset.symbol}`} aria-pressed={watchlist.includes(asset.symbol)} onClick={()=>toggleWatch(asset.symbol)}/></section>
  </article>;
}

function PerpWorkspace({asset,direction,onPalette}:{asset:PerpAsset;direction:PerpDirection;onPalette:()=>void}) {
  const {watchlist,toggleWatch}=usePerps();
  const [range,setRange]=useState("1D");const [interval,setInterval]=useState("15");const [chart,setChart]=useState("candles");
  const [book,setBook]=useState(true);const [limit,setLimit]=useState<number>();const [revision,setRevision]=useState(0);
  const intervals=({"1H":[5,10,15],"1D":[15,30,60],"1W":[60,120,240],"1M":[240,720,1440]} as Record<string,number[]>)[range];
  const candles=perpCandles(asset,range,Number(interval));
  return <>
    <nav className="perp-breadcrumb" aria-label="Perpetual breadcrumb"><Link to="/perps"><ArrowLeftIcon/>Perps</Link><Link to={`/perps?group=${asset.group}`}>{asset.group}</Link><strong>{asset.symbol}</strong></nav>
    {asset.exchange&&<p className="perp-disclaimer">{asset.name} / Reference market: {asset.exchange}{perpReference(asset)?` / Native reference: ${perpReference(asset)}`:""} / USD-settled demo contract</p>}
    <section className="perp-terminal" data-book={book}>
      <section className="perp-chart-column">
        <header className="perp-workspace-heading"><section className="perp-identity"><PerpAssetMark asset={asset}/><section><p>PERPETUAL / {asset.group}</p><Button variant="ghost" suffixIcon={ChevronDownIcon} onClick={onPalette} aria-label="Switch perpetual">{asset.symbol}</Button></section><b className="perp-leverage-label">{asset.maxLeverage}x</b></section><section className="perp-tools"><IconButton icon={StarIcon} label={`${watchlist.includes(asset.symbol)?"Unwatch":"Watch"} ${asset.symbol}`} aria-pressed={watchlist.includes(asset.symbol)} variant={watchlist.includes(asset.symbol)?"tonal":"ghost"} onClick={()=>toggleWatch(asset.symbol)}/><IconButton icon={ChartBarSquareIcon} label="Toggle order book" aria-pressed={book} variant={book?"tonal":"ghost"} onClick={()=>setBook(!book)}/></section></header>
        <section className="perp-quote"><section><h1>{perpMoney(asset.price)}</h1><p data-positive={asset.change>=0}>{asset.change>=0?"+":""}{asset.change}% <small>/ 24h</small></p></section><p>24h vol <strong>{compactPerpMoney(asset.volume)}</strong><small>Open interest {compactPerpMoney(asset.interest)} / Funding {asset.funding}%</small></p></section>
        <section className="perp-chart" aria-label={`${asset.symbol} price chart`}>
          {chart==="candles"?<IndexCandlestickChart key={`${range}-${interval}`} candles={candles} name={asset.symbol} priceLabel="Sample perpetual price" intervalLabel={`${interval} min / UTC`}/>:<LineChart key={`${range}-${interval}`} series={[{id:asset.symbol,label:asset.symbol,values:candles.map(c=>c.close),tone:"primary"}]} labels={candles.map(c=>new Date(c.time).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC"}))} height={340} summary={`${asset.symbol} sample price history`}/>}
        </section>
        <section className="perp-chart-controls"><nav className="perp-tabs" aria-label="Chart range">{["1H","1D","1W","1M"].map(r=><Button key={r} size="sm" variant={range===r?"tonal":"ghost"} aria-pressed={range===r} onClick={()=>{setRange(r);setInterval(({"1H":"5","1D":"15","1W":"60","1M":"240"} as Record<string,string>)[r]);}}>{r}</Button>)}</nav><SelectDropdown label="Candle interval" hideLabel size="md" value={interval} onChange={v=>setInterval(String(v))} options={intervals.map(n=>({value:String(n),label:n<60?`${n} min`:`${n/60} hour${n===60?"":"s"}`}))}/><section role="group" aria-label="Chart type"><IconButton size="sm" icon={ChartPieIcon} label="Line chart" aria-pressed={chart==="line"} variant={chart==="line"?"tonal":"ghost"} onClick={()=>setChart("line")}/><IconButton size="sm" icon={ChartBarIcon} label="Candlestick chart" aria-pressed={chart==="candles"} variant={chart==="candles"?"tonal":"ghost"} onClick={()=>setChart("candles")}/></section></section>
      </section>
      {book&&<PerpOrderBook asset={asset} onPrice={price=>{setLimit(price);setRevision(v=>v+1);}}/>}
      <PerpPositionTicket key={`${asset.symbol}-${revision}`} asset={asset} initialDirection={direction} initialLimit={limit}/>
      <section className="perp-below"><PerpPositions asset={asset}/><PerpInsights asset={asset}/></section>
    </section>
  </>;
}

function PerpOrderBook({asset,onPrice}:{asset:PerpAsset;onPrice:(price:number)=>void}) {
  const [aggregation,setAggregation]=useState("1");
  const tick=Math.max(.0001,asset.price*.00005)*Number(aggregation);
  const side=(ask:boolean)=>{
    let total=0;
    const rows=Array.from({length:7},(_,i)=>{const level=i+1,size=Math.round((Math.sin(level*2.3)+1.2)*13750);total+=size;return {price:asset.price+(ask?1:-1)*tick*level,size,total,depth:20+level*10};});
    return ask?rows.reverse():rows;
  };
  return <section className="perp-book" aria-label="Order book"><header><h2>Order book</h2><SelectDropdown label="Price aggregation" hideLabel size="md" value={aggregation} onChange={v=>setAggregation(String(v))} options={[{value:"1",label:"1x"},{value:"5",label:"5x"},{value:"10",label:"10x"}]}/></header><section className="perp-book-labels"><small>Price</small><small>Size</small><small>Total</small></section>
    {[true,false].map(ask=><section key={String(ask)} aria-label={ask?"Asks":"Bids"}>
      {!ask&&<p className="perp-spread">Spread {perpMoney(tick*2)} / {(tick*2/asset.price*100).toFixed(3)}%</p>}
      {side(ask).map((row,i)=><button key={i} className="perp-book-row" data-positive={!ask} style={{backgroundSize:`${row.depth}% 100%`}} aria-label={`Set limit price ${row.price.toFixed(4)}`} onClick={()=>onPrice(row.price)}><strong>{row.price.toLocaleString("en-US",{maximumFractionDigits:asset.price<10?4:2})}</strong><small>{(row.size/1000).toFixed(1)}K</small><small>{(row.total/1000).toFixed(1)}K</small></button>)}
    </section>)}<p className="perp-disclaimer">Sample depth / USD notional</p></section>;
}

function PerpPositions({asset}:{asset:PerpAsset}) {
  const {account,dispatch}=usePerps();const [tab,setTab]=useState("Positions");
  return <section id="perp-account" className="perp-account" aria-label="Perpetual account"><nav className="perp-tabs" aria-label="Account views">{["Positions","Open orders","History"].map(t=><Button key={t} variant={tab===t?"tonal":"ghost"} size="sm" aria-pressed={tab===t} onClick={()=>setTab(t)}>{t}{t==="Positions"?` (${account.positions.length})`:t==="Open orders"?` (${account.orders.length})`:""}</Button>)}</nav>
    <section className="perp-table-wrap"><table><thead><tr>{["Asset / Side",tab==="History"?"Action":"Size",tab==="History"?"Notional":"Entry",tab==="History"?"Time":"Margin",tab==="Positions"?"Est. liquidation":"Status"].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>
      {tab==="Positions"&&account.positions.map(p=><tr key={p.id}><td><Link to={`/perps/${p.symbol}`}>{p.symbol} / {p.direction} <b className="perp-accent">{p.leverage}x</b></Link></td><td>{perpMoney(p.quantity*p.entry)}</td><td>{perpMoney(p.entry)}</td><td>{p.margin.toLocaleString("en-US",{maximumFractionDigits:6})} {p.collateral}</td><td>{perpMoney(liquidationEstimate(p.entry,p.leverage,p.direction))}{p.takeProfit&&<small>TP {perpMoney(p.takeProfit)} / SL {perpMoney(p.stopLoss!)}</small>}</td></tr>)}
      {tab==="Open orders"&&account.orders.map(o=><tr key={o.id}><td>{o.symbol} / {o.direction}</td><td>{perpMoney(o.quantity*o.entry)}</td><td>{perpMoney(o.entry)}</td><td>{o.margin.toLocaleString("en-US",{maximumFractionDigits:6})} {o.collateral}</td><td><Button size="sm" variant="ghost" onClick={()=>dispatch({type:"cancel",id:o.id})}>Cancel order</Button></td></tr>)}
      {tab==="History"&&account.history.map((h,i)=><tr key={h.id+String(i)}><td>{h.symbol} / {h.direction}</td><td>{h.action}</td><td>{perpMoney(h.size)}</td><td>{new Date(h.time).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</td><td>Demo</td></tr>)}
    </tbody></table></section>
    {(tab==="Positions"&&!account.positions.length||tab==="Open orders"&&!account.orders.length||tab==="History"&&!account.history.length)&&<p className="perp-empty">{tab==="Positions"?`No open positions. ${asset.symbol} orders will appear here after a simulated fill.`:tab==="Open orders"?"No pending limit orders.":"No trades yet."}</p>}
  </section>;
}

function PerpInsights({asset}:{asset:PerpAsset}) {
  const [expanded,setExpanded]=useState(false);
  const up=asset.change>=0?54:47;
  return <section className="perp-insights"><h2>Market insights</h2><section className="perp-insight-grid">
    <article><h3>Order flow</h3><p className="perp-disclaimer">Sample trader sentiment</p><section className="perp-sentiment"><strong data-positive="true">{up}% Up</strong><strong data-positive="false">{100-up}% Down</strong></section><progress max="100" value={up} aria-label="Sample long interest"/><dl className="perp-stats"><section><dt>24h volume</dt><dd>{compactPerpMoney(asset.volume)}</dd></section><section><dt>Open interest</dt><dd>{compactPerpMoney(asset.interest)}</dd></section><section><dt>Funding / 8h</dt><dd>{asset.funding}%</dd></section><section><dt>Max leverage</dt><dd>{asset.maxLeverage}x</dd></section></dl></article>
    <article><h3>Contract details</h3><dl className="perp-stats"><section><dt>Mark price</dt><dd>{perpMoney(asset.price)}</dd></section><section><dt>Contract</dt><dd>{asset.symbol} / USD</dd></section><section><dt>Settlement</dt><dd>Cash equivalent</dd></section><section><dt>Expiry</dt><dd>Perpetual</dd></section><section><dt>Sample fee</dt><dd>0.05% per side</dd></section><section><dt>Margin mode</dt><dd>Isolated</dd></section></dl></article>
  </section><section className="perp-about"><h3>About {asset.name}</h3><p>{asset.description}</p>{expanded&&<p>This sandbox uses fixed illustrative prices, an estimated liquidation threshold and an isolated-margin model. It has no live venue connection, funding settlement or automatic liquidation engine. Limit and protective orders are recorded for demonstration only.</p>}<Button size="sm" variant="ghost" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?"Read less":"Read more"}</Button></section>
  <section className="perp-faq"><h3>Common questions</h3><Accordion variant="highlight" type="single" level={4}>{[
    ["Does the contract expire?","Perpetuals have no scheduled expiry. A position remains open until closed or liquidated, subject to the venue's rules."],
    ["How does leverage work?","Leverage increases notional exposure relative to posted margin. Both gains and losses are magnified; the entire margin can be lost."],
    ["What is the liquidation price?","It is an estimate of the price at which collateral may no longer satisfy maintenance requirements. This demo uses a simplified estimate, not a venue quote."],
    ["What is funding?","Funding is a periodic payment between long and short holders. Its direction and amount depend on the contract. Funding is displayed but not settled in this demo."],
  ].map(([q,a])=><AccordionItem key={q} value={q} title={q}><p>{a}</p></AccordionItem>)}</Accordion></section></section>;
}
