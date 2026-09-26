import { useState } from "react";
import { Link, useParams } from "react-router";
import { Layout } from "@astryxdesign/core/Layout";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { Token } from "@astryxdesign/core/Token";
import { ChevronLeftIcon, ShareIcon, BookmarkIcon, TrophyIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { PredictionTradeTicket } from "./PredictionTradeTicket";
import { MarketDiscussion } from "../domains/finance/PredictionCardVariants";
import { PositionReceipt } from "../domains/finance/PositionReceipt";
import { ParticipantMark } from "../domains/finance/ParticipantMark";
import { predictionMarkets, type PredictionMarket } from "../domains/finance/predictionData";
import type { PurchasedPosition } from "../domains/finance/predictionCardData";
import { isBinaryMarket } from "../domains/finance/predictionContracts";
import { usePrediction } from "./PredictionContext";
import { RosenProbabilityChart } from "./RosenProbabilityChart";
import { sportsContracts, sportOf, findPredictionMarket } from "./sportsMarketCatalog";

const money = (n: number) => new Intl.NumberFormat("en-US", {style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
const styles = `
.market-detail { color:var(--ws-text-primary); }
.market-detail .astryx-text,.market-detail .astryx-heading { color:inherit; }
.market-detail .detail-muted { color:var(--ws-text-secondary); }
.market-detail .detail-eyebrow { color:var(--ws-text-secondary); font-size:var(--font-size-sm); letter-spacing:.09em; text-transform:uppercase; }
.market-detail .detail-columns { align-items:flex-start; }
.market-detail .detail-main { flex:1; min-width:0; }
.market-detail .detail-aside { width:calc(var(--spacing-12) * 7.5); flex-shrink:0; position:sticky; top:calc(var(--spacing-12) * 3); }
.market-detail .detail-order { border:solid calc(var(--spacing-1) / 4) var(--ws-border-default); border-radius:var(--radius-container); background:var(--ws-surface-sunken); }
.market-detail .detail-event-lockup { align-items:center; }
.market-detail .detail-event-lockup > .pm-participant-mark { width:var(--spacing-12); height:var(--spacing-12); flex:0 0 var(--spacing-12); }
.market-detail .detail-match-title { font-size:var(--font-size-3xl); line-height:1.25; font-weight:700; letter-spacing:-.02em; }
.market-detail .detail-score { padding-block:var(--spacing-8); }
.market-detail .detail-team { width:35%; min-width:0; text-align:center; align-items:center; }
.market-detail .detail-team .pm-participant-mark { width:var(--spacing-12); height:var(--spacing-12); overflow:visible; padding:var(--spacing-1); }
.market-detail .detail-team .pm-participant-mark img { object-fit:contain; }
.market-detail .detail-score-number { font-size:var(--font-size-5xl); font-weight:600; font-variant-numeric:tabular-nums; }
.market-detail .detail-score-middle { flex-shrink:0; text-align:center; }
.market-detail .detail-section { padding-block:var(--spacing-5); border-top:solid calc(var(--spacing-1) / 4) var(--ws-border-default); }
.market-detail .detail-row { min-height:calc(var(--spacing-12) * 1.6); padding-block:var(--spacing-4); border-bottom:solid calc(var(--spacing-1) / 4) var(--ws-border-default); }
.market-detail .detail-row[data-selected=true] { background:color-mix(in srgb,var(--ws-domain-prediction-accent),transparent 88%); }
.market-detail .detail-row-label { flex:1; min-width:0; }
.market-detail .detail-row-label .astryx-text { font-size:var(--font-size-lg); font-weight:600; }
.market-detail .detail-row .pm-participant-mark { width:var(--spacing-10); height:var(--spacing-10); flex:0 0 var(--spacing-10); flex-shrink:0; }
.market-detail .detail-probability { font-size:var(--font-size-2xl); font-weight:700; min-width:var(--spacing-12); text-align:right; font-variant-numeric:tabular-nums; }
.market-detail .detail-yes,.market-detail .detail-no { min-width:calc(var(--spacing-12) * 1.7); min-height:var(--spacing-10); border-radius:var(--radius-full); background:transparent !important; border:solid calc(var(--spacing-1) / 4) var(--ws-border-default) !important; box-shadow:none !important; font-weight:600; }
.market-detail .detail-yes { color:var(--ws-tonal-success-text) !important; }
.market-detail .detail-no { color:var(--ws-tonal-error-text) !important; }
.market-detail .detail-yes:hover:not(:disabled) { background:color-mix(in srgb,var(--ws-feedback-success),transparent 88%) !important; border-color:var(--ws-feedback-success) !important; }
.market-detail .detail-no:hover:not(:disabled) { background:color-mix(in srgb,var(--ws-feedback-danger),transparent 88%) !important; border-color:var(--ws-feedback-danger) !important; }
.market-detail .detail-yes[aria-pressed=true] { border-color:var(--ws-feedback-success) !important; outline:solid calc(var(--spacing-1) / 2) color-mix(in srgb,var(--ws-feedback-success),transparent 80%); outline-offset:calc(var(--spacing-1) / 2); }
.market-detail .detail-no[aria-pressed=true] { border-color:var(--ws-feedback-danger) !important; outline:solid calc(var(--spacing-1) / 2) color-mix(in srgb,var(--ws-feedback-danger),transparent 80%); outline-offset:calc(var(--spacing-1) / 2); }
.market-detail .detail-tabs button { border-radius:var(--radius-full); }
.market-detail .detail-tabs button[aria-pressed=true] { background:color-mix(in srgb,var(--ws-domain-prediction-accent),transparent 82%); color:var(--ws-text-primary); }
.market-detail .detail-sport-links { padding-bottom:var(--spacing-4); border-bottom:solid calc(var(--spacing-1) / 4) var(--ws-border-default); overflow:auto; }
.market-detail .detail-sport-links a { white-space:nowrap; font-size:var(--font-size-sm); padding:var(--spacing-2) var(--spacing-3); border-radius:var(--radius-full); color:var(--ws-text-secondary); }
.market-detail .detail-sport-links a[aria-current=page] { background:var(--ws-surface-raised); color:var(--ws-text-primary); }
.market-detail details > summary { cursor:pointer; padding-block:var(--spacing-4); font-size:var(--font-size-lg); font-weight:600; }
.market-detail .detail-rules { font-size:var(--font-size-base); color:var(--ws-text-secondary); line-height:1.8; }
.market-detail .detail-rules a { text-decoration:underline; }
.market-detail .detail-related { border-bottom:solid calc(var(--spacing-1) / 4) var(--ws-border-default); padding-block:var(--spacing-4); }
.market-detail .pm-discussion { max-width:none; width:100%; }
.market-detail .detail-mobile-trade { display:none; }
.market-detail .detail-chart { min-width:0; }
.market-detail .detail-chart .rosen-frame { min-height:calc(var(--spacing-12) * 5); }
.market-detail .detail-demo { font-size:var(--font-size-sm); color:var(--ws-text-secondary); }
@media(max-width:64em) {
 .market-detail .detail-aside { display:none; }
 .market-detail .detail-mobile-trade { display:flex; position:sticky; bottom:calc(var(--spacing-12) * 2); z-index:10; background:var(--ws-surface-base); border:solid calc(var(--spacing-1) / 4) var(--ws-border-default); border-radius:var(--radius-container); padding:var(--spacing-3); }
}
@media(max-width:40em) {
 .market-detail .detail-row { flex-wrap:wrap; gap:var(--spacing-3); }
 .market-detail .detail-row-label { flex-basis:65%; }
 .market-detail .detail-row-actions { width:100%; }
 .market-detail .detail-row-actions button { flex:1; }
 .market-detail .detail-match-title { font-size:var(--font-size-2xl); }
 .market-detail .detail-score { gap:var(--spacing-3); width:100%; }
 .market-detail .detail-team { flex:1; width:auto; font-size:var(--font-size-sm); }
 .market-detail .detail-score-middle { max-width:30%; }
 .market-detail .detail-chart .rosen-frame { min-height:calc(var(--spacing-12) * 4); }
}
`;

export function MarketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const market = id ? findPredictionMarket(id) : undefined;
  if (!market) return <VStack gap={4}><Heading level={1}>Market not found</Heading><Link to="/">Back to markets</Link></VStack>;
  return <MarketScreen key={market.id} market={market}/>;
}
function MarketScreen({ market }: {market: PredictionMarket}) {
  const { savedMarkets, toggleSaveMarket, positions, setToast } = usePrediction();
  const contracts = sportsContracts(market);
  const [selected, setSelected] = useState({market, outcome:market.outcomes[0].id});
  const [mobileTrade, setMobileTrade] = useState(false);
  const [group, setGroup] = useState("Game lines");
  const [section, setSection] = useState("All");
  const [range, setRange] = useState("ALL");
  const [preview, setPreview] = useState("Yes · Open");
  const groups = [...new Set(contracts.map(c => c.group))];
  const sections = [...new Set(contracts.filter(c => c.group === group).map(c => c.section))];
  const owned: PurchasedPosition[] = positions.filter(p => p.marketId === market.id || contracts.some(c => c.market.id === p.marketId)).flatMap(p => {
    const source = findPredictionMarket(p.marketId);
    return source ? [{id:p.id,market:source,outcomeId:p.outcomeId,shares:p.shares,entryPrice:p.avgPrice}] : [];
  });
  const choose = (target: PredictionMarket, outcome: string) => {
    setSelected({market:target,outcome});
    if (window.matchMedia("(max-width: 64em)").matches) setMobileTrade(true);
  };
  const chartColors = ["var(--ws-domain-prediction-accent)","var(--ws-feedback-info)","var(--ws-feedback-success)","var(--ws-action-primary-default)"];
  const binary = isBinaryMarket(market);
  const chartOutcomes = market.outcomeHistories ? market.outcomes : market.outcomes.slice(0, binary ? 2 : 1);
  const count = range === "RECENT" ? 5 : market.history.length;
  const series = chartOutcomes.map((o,i) => ({id:o.id,label:o.label,tone:"primary" as const,color:chartColors[i % chartColors.length],values:(market.outcomeHistories?.[o.id] ?? (binary && i === 1 ? market.history.map(v => 100-v) : market.history)).slice(-count)}));
  const points = series[0]?.values.length ?? 0;
  const related = predictionMarkets.filter(m => m.category === market.category && m.id !== market.id && (market.category !== "Sports" || m.sportType === "Games")).slice(0,3);
  const eventLinks = predictionMarkets.filter(m => ["demo-soccer","demo-baseball","demo-basketball","demo-cricket","demo-tennis","demo-nfl","demo-hockey"].includes(m.id));
  const demoNo = preview.startsWith("No");
  const demoWon = preview.endsWith("Won"), demoLost = preview.endsWith("Lost");
  const base = market.outcomes[0];
  const other = market.outcomes[1];
  const demoId = binary ? (demoNo ? other.id : base.id) : `${base.id}${demoNo ? "::no" : ""}`;
  const receipt: PurchasedPosition = { id:"WS-0148 · SAMPLE", market:{...market, winner:demoWon ? (demoNo ? other.id : base.id) : demoLost ? (demoNo ? base.id : other.id) : undefined}, outcomeId:demoId, entryPrice:demoNo ? .68 : .32,shares:250 };
  const rows = (target: PredictionMarket, label?: string) => (isBinaryMarket(target) ? target.outcomes.slice(0,1) : target.outcomes).map(o => {
    const no = isBinaryMarket(target) ? target.outcomes[1].id : `${o.id}::no`;
    return <HStack key={`${target.id}-${o.id}`} className="detail-row" vAlign="center" gap={4} data-selected={String(selected.market.id === target.id && [o.id,no].includes(selected.outcome))}>
      <HStack className="detail-row-label" gap={3} vAlign="center"><ParticipantMark outcome={o}/><Text weight="medium">{label ?? (isBinaryMarket(target) ? target.question : o.label)}</Text></HStack>
      <Text className="detail-probability">{o.probability}%</Text>
      <HStack className="detail-row-actions" gap={2}><Button size="sm" className="detail-yes" aria-label={`Yes: ${label ?? o.label}`} aria-pressed={selected.market.id === target.id && selected.outcome === o.id} disabled={Boolean(target.winner)} onClick={() => choose(target,o.id)}>Yes {o.probability}¢</Button><Button size="sm" className="detail-no" aria-label={`No: ${label ?? o.label}`} aria-pressed={selected.market.id === target.id && selected.outcome === no} disabled={Boolean(target.winner)} onClick={() => choose(target,no)}>No {100-o.probability}¢</Button></HStack>
    </HStack>;
  });
  return <Layout height="auto"><VStack className="market-detail" gap={6}><style>{styles}</style>
    <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}><Link to="/"><HStack vAlign="center" gap={2}><ChevronLeftIcon style={{width:"var(--spacing-4)"}}/><Text size="sm">Markets / {market.category}</Text></HStack></Link><HStack gap={2}><Button size="sm" variant="ghost" prefixIcon={BookmarkIcon} aria-pressed={savedMarkets.includes(market.id)} onClick={() => toggleSaveMarket(market.id)}>{savedMarkets.includes(market.id) ? "Saved" : "Save"}</Button><Button size="sm" variant="ghost" prefixIcon={ShareIcon} onClick={async () => {try {await navigator.clipboard.writeText(window.location.href);setToast({key:Date.now(),message:"Market link copied",tone:"success"});} catch {setToast({key:Date.now(),message:"Could not copy link. Copy the address from your browser.",tone:"neutral"});}}}>Share</Button></HStack></HStack>
    {market.category === "Sports" && <HStack as="nav" gap={2} className="detail-sport-links" aria-label="Explore sports matches">{eventLinks.map(event => <Link key={event.id} to={`/market/${event.id}`} aria-current={event.id === market.id ? "page" : undefined}>{sportOf(event)}</Link>)}</HStack>}
    <HStack gap={10} className="detail-columns">
      <VStack className="detail-main" gap={6}>
        <HStack className="detail-event-lockup" gap={4} vAlign="center"><ParticipantMark outcome={market.outcomes[0]}/><VStack gap={2}><HStack gap={3} vAlign="center"><Text className="detail-eyebrow">{market.league ?? market.category} · {market.sportType ?? "Market"}</Text><Token size="sm" label={market.winner ? "Settled" : market.liveDemo ? "Live demo" : "Open"} color={market.winner ? "gray" : market.liveDemo ? "red" : "purple"}/></HStack><Heading level={1} className="detail-match-title">{market.question}</Heading></VStack></HStack>
        {market.score && <HStack className="detail-score" gap={6} hAlign="center" vAlign="center">{market.outcomes.slice(0,2).map((o,i) => <VStack key={o.id} className="detail-team" gap={3}><ParticipantMark outcome={o}/><Text weight="semibold">{o.label}</Text><Text className="detail-score-number">{market.score!.rows[i]?.score}</Text><Text size="sm">{market.score!.rows[i]?.detail ?? ""}</Text></VStack>).reduce<React.ReactNode[]>((acc,node,i) => i === 0 ? [node,<VStack key="period" className="detail-score-middle" gap={2}><Text weight="bold">{market.score!.period}</Text><Text className="detail-demo">Sample score</Text></VStack>] : [...acc,node],[])}</HStack>}
        <VStack gap={3} className="detail-chart"><HStack hAlign="between" vAlign="center"><Text weight="semibold">Market probability</Text><Text className="detail-demo">Illustrative history</Text></HStack>{points > 1 ? <RosenProbabilityChart variant="compact" series={series} labels={Array.from({length:points},(_,i) => i === points-1 ? "Latest" : `Point ${i+1}`)} summary={`Sample probability history for ${market.question}`}/> : <Text className="detail-muted">Historical prices are not available for this contract.</Text>}<HStack hAlign="between" vAlign="center"><Text size="sm">{money(market.volume)} volume</Text><HStack gap={1}>{["RECENT","ALL"].map(r => <Button key={r} size="sm" variant={range === r ? "tonal" : "ghost"} aria-pressed={range === r} onClick={() => setRange(r)}>{r === "ALL" ? "All history" : "Recent"}</Button>)}</HStack></HStack></VStack>
        <VStack className="detail-section" gap={0}><HStack hAlign="between" vAlign="center"><Heading level={2}>{market.sportType === "Games" ? "Match winner" : "Outcomes"}</Heading><Text className="detail-demo">Chance · Price per share</Text></HStack>{rows(market)}{market.sportType === "Games" && sportOf(market) === "Football" && <Text className="detail-demo" style={{paddingTop:"var(--spacing-3)"}}>90 minutes + stoppage time · Draw included</Text>}</VStack>
        {contracts.length > 0 && <VStack className="detail-section" gap={5}><HStack className="detail-tabs" gap={2} wrap="wrap" aria-label="Sports market groups">{groups.map(g => <Button key={g} variant="ghost" aria-pressed={group === g} onClick={() => {setGroup(g);setSection("All");}}>{g}</Button>)}</HStack><HStack className="detail-tabs" gap={2} wrap="wrap" aria-label="Market types">{["All",...sections].map(s => <Button key={s} size="sm" variant="ghost" aria-pressed={section === s} onClick={() => setSection(s)}>{s}</Button>)}</HStack><VStack gap={0}>{contracts.filter(c => c.group === group && (section === "All" || c.section === section)).map(c => <VStack key={c.market.id} gap={0}>{rows(c.market,c.label)}</VStack>)}</VStack><Text className="detail-demo">Each line is a separate Yes / No market. Sample prices.</Text></VStack>}
        <VStack className="detail-section" gap={3}><details open><summary>Market rules</summary><VStack className="detail-rules" gap={3}><Text weight="semibold">{selected.market.question}</Text><Text as="p">{selected.market.rules}</Text><Text>Resolution source: <a href={selected.market.source.url} target="_blank" rel="noreferrer">{selected.market.source.label}</a></Text></VStack></details><details><summary>Timeline and payout</summary><Text className="detail-rules">Closes {new Date(selected.market.closesAt).toLocaleString()}. Winning shares pay $1, losing shares pay $0. For a No position, the named outcome must not occur. Voided contracts return the purchase cost.</Text></details></VStack>
        {owned.length > 0 && <VStack gap={4}><Heading level={2}>Your positions</Heading>{owned.map(p => <PositionReceipt key={p.id} position={p} showAmounts/>)}</VStack>}
        <VStack className="detail-section" gap={2}><Heading level={2}>People are also trading</Heading>{related.map(r => <Link className="detail-related" key={r.id} to={`/market/${r.id}`}><HStack gap={3} vAlign="center"><TrophyIcon style={{width:"var(--spacing-6)",color:"var(--ws-domain-prediction-accent)"}}/><Text weight="medium">{r.question}</Text></HStack></Link>)}</VStack>
        <VStack as="section" id="market-social" className="detail-section" gap={5}><HStack gap={3} vAlign="center"><ChatBubbleLeftIcon style={{width:"var(--spacing-6)"}}/><Heading level={2}>Social & activity</Heading></HStack><MarketDiscussion key={market.id} market={market} availablePositions={owned}/></VStack>
        <details className="detail-section"><summary>Explore position ticket styles</summary><VStack gap={5}><Text className="detail-demo">Sample tickets · These previews do not change your positions.</Text><HStack className="detail-tabs" gap={2} wrap="wrap">{["Yes · Open","No · Open","Yes · Won","No · Won","Yes · Lost","No · Lost"].map(p => <Button key={p} size="sm" aria-pressed={preview === p} onClick={() => setPreview(p)} variant="ghost">{p}</Button>)}</HStack><PositionReceipt position={receipt} showAmounts/></VStack></details>
      </VStack>
      <VStack as="aside" className="detail-aside" gap={4}><VStack className="detail-order" padding={5} gap={4} style={{padding:"var(--spacing-5)"}}><HStack hAlign="between" vAlign="center"><Heading level={2}>Trade outcome</Heading><Token size="sm" label="Preview" color="purple"/></HStack><PredictionTradeTicket key={`${selected.market.id}-${selected.outcome}`} market={selected.market} initialOutcome={selected.outcome}/></VStack><Text className="detail-demo">Sandbox funds · Prices and event scores are illustrative.</Text></VStack>
    </HStack>
    <HStack className="detail-mobile-trade" hAlign="between" vAlign="center" gap={3}><Text size="sm">Choose an outcome to trade</Text><Button onClick={() => setMobileTrade(true)}>Trade</Button></HStack>
    <Modal open={mobileTrade} onClose={() => setMobileTrade(false)} title="Trade outcome" size="md"><PredictionTradeTicket key={`mobile-${selected.market.id}-${selected.outcome}`} market={selected.market} initialOutcome={selected.outcome}/></Modal>
  </VStack></Layout>;
}
