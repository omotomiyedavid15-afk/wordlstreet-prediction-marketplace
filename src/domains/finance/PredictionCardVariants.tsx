import { VStack } from "@astryxdesign/core/VStack";
import { PositionReceipt } from "./PositionReceipt";
import { contractOutcome } from "./predictionContracts";
import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowUpRightIcon, BookmarkIcon, ChevronDownIcon, ChevronRightIcon, ChatBubbleLeftIcon, DocumentDuplicateIcon, HeartIcon, LinkIcon, PaperAirplaneIcon, ShareIcon, TicketIcon, TrophyIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as FilledBookmarkIcon, ChatBubbleLeftIcon as FilledCommentIcon, HeartIcon as FilledHeartIcon, ShareIcon as FilledShareIcon } from "@heroicons/react/24/solid";
import { Avatar } from "../../ui/Avatar";
import { Button, IconButton } from "../../ui/Button";
import { FilterTabs } from "../../ui/Table";
import { Modal } from "../../ui/Modal";
import { LineChart, type ChartSeries, type ChartTone } from "../../ui/Charts";
import { PredictionBetSlip, ProbabilityChart, predictionMoney, OutcomeSelector } from "./PredictionMarkets";
import { predictionMarkets, type PredictionMarket } from "./predictionData";
import { candidateHistories, candidateMarket, clubAssets, demoPositions, mentionsMarket, momentumMarket, type PurchasedPosition } from "./predictionCardData";
import "./predictionCards.css";

const colors = ["var(--ws-action-primary-default)", "var(--ws-feedback-info)", "var(--ws-feedback-success)", "var(--ws-text-secondary)", "var(--ws-domain-prediction-accent)"];
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
type Trade = (market: PredictionMarket, outcome: string) => void;
interface CardProps { market: PredictionMarket; onTrade: Trade; onOpen: (market: PredictionMarket) => void }

export interface FeaturedPredictionMarketCardProps extends CardProps {
  comparison?: { labels: string[]; series: ChartSeries[] };
}

export function FeaturedPredictionMarketCard({ market, onTrade, onOpen, comparison }: FeaturedPredictionMarketCardProps) {
  const main = market.outcomes[0];
  const categorical = market.outcomes.length > 2;
  const [saved, setSaved] = useState(false);
  return <article className="pm-featured-market" data-featured-kind={categorical ? "multiple" : "binary"}>
    <header><span>Featured market</span><div><span>{market.category}{market.symbol ? ` / ${market.symbol}` : ""}</span><IconButton size="sm" icon={BookmarkIcon} label={`${saved ? "Unsave" : "Save"} featured ${market.question}`} aria-pressed={saved} variant={saved ? "tonal" : "ghost"} onClick={() => setSaved(!saved)} /></div></header>
    <div className="pm-featured-layout">
      <div className="pm-featured-overview">
        <h3><button type="button" onClick={() => onOpen(market)}>{market.question}</button></h3>
        {categorical ? <>
          <p className="pm-featured-context">{market.outcomes.length} outcomes · One winner</p>
          <div className="pm-featured-contenders">{market.outcomes.map((outcome, i) => <button type="button" key={outcome.id} onClick={() => onTrade(market, outcome.id)} aria-label={`Buy ${outcome.label} at ${outcome.probability} cents`}>
            <i style={{background:colors[i % colors.length]}}/><span>{outcome.label}</span><strong>{outcome.probability}<small>%</small></strong><ChevronRightIcon />
          </button>)}</div>
        </> : <>
          <div className="pm-featured-quote"><strong>{main.probability}<small>%</small></strong><div><span>{main.label} probability</span><span className={market.change < 0 ? "text-tonal-error-text" : "text-tonal-success-text"}>{market.change > 0 ? "+" : ""}{market.change} pp since open</span></div></div>
          <div className="pm-featured-trade"><OutcomeSelector outcomes={market.outcomes} onChange={id => onTrade(market,id)} /></div>
          <p className="pm-featured-context">Winning shares pay $1. Losing shares pay $0.</p>
        </>}
      </div>
      <div className="pm-featured-visual">{comparison ? <LineChart series={comparison.series} labels={comparison.labels} height={240} valueSuffix="%" yDomain={[0,100]} summary={`${market.question} Illustrative probability history.`}/> : categorical ? <p className="text-sm text-text-secondary">Outcome history is not available.</p> : <ProbabilityChart values={market.history} label={market.question} />}</div>
    </div>
    <footer><span><strong>{money(market.volume)}</strong> traded</span><time dateTime={market.closesAt}>Closes {new Date(market.closesAt).toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"})}</time><button type="button" onClick={() => onOpen(market)}>Resolution rules <ChevronRightIcon /></button></footer>
  </article>;
}

export function FeaturedMultipleOutcomesExample() {
  const [outcome, setOutcome] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  return <>
    <FeaturedPredictionMarketCard market={candidateMarket} onTrade={(_,id) => setOutcome(id)} onOpen={() => setRulesOpen(true)} comparison={{labels:["Sep 9","Sep 10","Sep 11","Sep 12","Sep 13","Sep 14","Sep 15"],series:candidateMarket.outcomes.map((o,i) => ({id:o.id,label:o.label,tone:(["primary","info","success","neutral"] as ChartTone[])[i],values:candidateHistories[i]}))}} />
    <Modal open={outcome !== null} onClose={() => setOutcome(null)} title="Trade outcome" size="md">{outcome && <PredictionBetSlip key={outcome} market={candidateMarket} initialOutcome={outcome}/>}</Modal>
    <Modal open={rulesOpen} onClose={() => setRulesOpen(false)} title="Market rules" size="md"><h3 className="text-lg font-semibold">{candidateMarket.question}</h3><p className="mt-4 text-sm leading-relaxed text-text-secondary">{candidateMarket.rules}</p></Modal>
  </>;
}

export function ClubMark({ id, name }: { id: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const club = clubAssets[id];
  return <span className="pm-club-mark">{club && !failed ? <img src={club.logo} alt={`${name} crest`} width="64" height="64" onError={() => setFailed(true)} /> : <span aria-label={name}>{club?.abbreviation ?? name.slice(0, 2)}</span>}</span>;
}

function CardShell({ market, onOpen, children, label, className = "" }: { market: PredictionMarket; onOpen: (market: PredictionMarket) => void; children: ReactNode; label: string; className?: string }) {
  const [saved, setSaved] = useState(false);
  return <article className={`pm-creative-card ${className}`} data-prediction-variant={label}>
    <header><span className="pm-eyebrow">{market.category} <span aria-hidden="true">/</span> {label}</span><IconButton icon={BookmarkIcon} label={`${saved ? "Unsave" : "Save"} ${market.question}`} variant={saved ? "tonal" : "ghost"} size="sm" aria-pressed={saved} onClick={() => setSaved(!saved)} /></header>
    <h3><button type="button" onClick={() => onOpen(market)}>{market.question}</button></h3>
    {children}
    <footer><span><strong>{money(market.volume)}</strong> volume</span><time dateTime={market.closesAt}>{new Date(market.closesAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</time><button type="button" onClick={() => onOpen(market)}>Rules <ChevronRightIcon /></button></footer>
  </article>;
}

export function SportsMatchupCard({ market, onTrade, onOpen }: CardProps) {
  const [expanded, setExpanded] = useState(false);
  return <CardShell market={market} onOpen={onOpen} label="Title race" className="pm-matchup">
    <div className="pm-matchup-season"><TrophyIcon /> Premier League <span>2026 / 27</span></div>
    <div className="pm-contenders">{market.outcomes.slice(0, 2).map((outcome, i) => <div className="pm-contender" key={outcome.id} style={{ "--club-color": clubAssets[outcome.id]?.color, "--club-ink": clubAssets[outcome.id]?.ink } as CSSProperties}>
      <ClubMark id={outcome.id} name={outcome.label} /><span className="pm-team-name">{outcome.label}</span><strong>{outcome.probability}<small>%</small></strong>
      <Button variant="tonal" className="pm-team-button" onClick={() => onTrade(market, outcome.id)} aria-label={`Buy ${outcome.label} at ${outcome.probability} cents`}>{clubAssets[outcome.id]?.abbreviation ?? outcome.label}<span>{outcome.probability}¢ <ArrowUpRightIcon /></span></Button>
      {i === 0 && <span className="pm-versus" aria-hidden="true">VS</span>}
    </div>)}</div>
    <div className="pm-race-rail" role="img" aria-label={market.outcomes.map(o => `${o.label} ${o.probability}%`).join(", ")}>{market.outcomes.map((o, i) => <span key={o.id} style={{ flex: o.probability, background: clubAssets[o.id]?.color ?? colors[i] }} />)}</div>
    <Button variant="ghost" size="sm" className="pm-expand" suffixIcon={ChevronDownIcon} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Hide other clubs" : `Other clubs · ${market.outcomes.slice(2).reduce((s, o) => s + o.probability, 0)}%`}</Button>
    {expanded && <div className="pm-other-outcomes">{market.outcomes.slice(2).map(o => <button key={o.id} onClick={() => onTrade(market, o.id)}>{o.label}<strong>{o.probability}¢ <ChevronRightIcon /></strong></button>)}</div>}
  </CardShell>;
}

export function MultiOutcomeMarketCard({ market, onTrade, onOpen, independent = false }: CardProps & { independent?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState("Outcomes");
  const [period, setPeriod] = useState("Now");
  const isCandidates = market.id === candidateMarket.id;
  const historical = isCandidates && period === "7 days ago";
  const displayed = market.outcomes.map((o, i) => ({ ...o, probability: historical ? candidateHistories[i][0] : o.probability }));
  const visible = expanded ? displayed : displayed.slice(0, 2);
  const choose = (id: string) => {
    if (!independent) return onTrade(market, id);
    const topic = market.outcomes.find(o => o.id === id)!;
    onTrade({ ...market, id: `${market.id}-${id}`, question: `Will ${topic.label} be mentioned at the next tech keynote?`, outcomes: [{ id: "yes", label: "Yes", probability: topic.probability }, { id: "no", label: "No", probability: 100 - topic.probability }] }, "yes");
  };
  return <CardShell market={market} onOpen={onOpen} label={independent ? "Mentions" : "Multiple outcomes"}>
    <div className="pm-market-context"><span>{independent ? "Independent Yes / No markets" : "One winner · probabilities total 100%"}</span>{isCandidates && <span>Fictional candidates</span>}</div>
    {isCandidates && <div className="pm-chart-controls"><FilterTabs label="Candidate chart view" value={view} onChange={setView} options={[{value:"Outcomes", label:"Outcomes"}, {value:"History", label:"History"}]} />{view === "Outcomes" && <label className="pm-period"><span className="sr-only">Candidate snapshot</span><select value={period} onChange={e => setPeriod(e.target.value)}><option>Now</option><option>7 days ago</option></select></label>}</div>}
    {view === "History" ? <div className="pm-candidate-history"><LineChart height={120} labels={["Sep 9", "Sep 10", "Sep 11", "Sep 12", "Sep 13", "Sep 14", "Sep 15"]} valueSuffix="%" yDomain={[0,100]} summary="Illustrative candidate probability history" series={market.outcomes.map((o, i) => ({ id:o.id, label:o.label, tone:(["primary","info","success","neutral"] as ChartTone[])[i], values:candidateHistories[i] }))} /></div> : <>
      {!independent && <div className="pm-composition-strip" role="img" aria-label={displayed.map(o => `${o.label} ${o.probability}%`).join(", ")}>{displayed.map((o, i) => <span key={o.id} style={{flex:o.probability, background:colors[i % colors.length]}} />)}</div>}
      <div className="pm-probability-list">{visible.map((o, i) => <button type="button" key={o.id} className="pm-probability-row" style={{ "--outcome-color": colors[i % colors.length] } as CSSProperties} disabled={historical} onClick={() => choose(o.id)} aria-label={historical ? `${o.label}: ${o.probability}% seven days ago` : `Buy ${o.label}; current price ${market.outcomes[i].probability} cents`}>
        <span className="pm-row-fill" style={{transform:`scaleX(${o.probability / 100})`}} /><span className="pm-outcome-initial" aria-hidden="true">{independent ? <ChatBubbleLeftIcon /> : o.label.split(" ").map(s => s[0]).slice(0,2).join("")}</span><span className="pm-outcome-name">{o.label}</span><strong>{o.probability}<small>%</small></strong>{!historical && <ChevronRightIcon className="pm-row-arrow" />}
      </button>)}</div>
      {displayed.length > visible.length || expanded ? <Button variant="ghost" size="sm" className="pm-expand" suffixIcon={ChevronDownIcon} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Fewer outcomes" : `${displayed.length - visible.length} more outcomes`}</Button> : null}
    </>}
    {independent && <div className="pm-card-activity"><Avatar name="Zara Chen" size="sm" /><p><strong>Zara Chen</strong> bought <b>AI agents</b><span>$42 · 2 min ago · sample activity</span></p></div>}
  </CardShell>;
}

export function MomentumMarketCard({ market, onTrade, onOpen }: CardProps) {
  const [active, setActive] = useState(6);
  const days = ["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"];
  const value = market.history[active];
  return <CardShell market={market} onOpen={onOpen} label="Probability blocks">
    <div className="pm-block-summary"><div><span>Yes probability · {days[active]}</span><strong>{value}<small>%</small></strong></div><div className="pm-block-legend"><span><i />Yes {value}%</span><span><i />No {100-value}%</span></div></div>
    <div className="pm-block-chart" role="group" aria-label="Seven-day probability history; each full block represents twenty percentage points">
      {days.map((day, i) => <button type="button" className="pm-block-column" key={day} aria-pressed={active === i} aria-label={`${day}: Yes ${market.history[i]}%, No ${100 - market.history[i]}%`} onClick={() => setActive(i)}>
        <span className="pm-block-half pm-block-yes">{Array.from({length:5}, (_, j) => <i key={j}><span style={{transform:`scaleY(${Math.max(0,Math.min(1,(market.history[i]-j*20)/20))})`}} /></i>)}</span><span className="pm-block-baseline"/><span className="pm-block-half pm-block-no">{Array.from({length:5}, (_, j) => <i key={j}><span style={{transform:`scaleY(${Math.max(0,Math.min(1,(100-market.history[i]-j*20)/20))})`}} /></i>)}</span><span className="pm-block-day">{day}</span>
      </button>)}
      <div className="pm-block-scale" aria-hidden="true"><span>100%</span><span>0</span><span>100%</span></div>
    </div>
    <div className="pm-block-trade"><OutcomeSelector outcomes={market.outcomes} onChange={id => onTrade(market, id)} /></div>
  </CardShell>;
}

export function PredictionCardGallery() {
  const [selection, setSelection] = useState<{market:PredictionMarket; outcome:string} | null>(null);
  const [detail, setDetail] = useState<PredictionMarket | null>(null);
  const trade: Trade = (market, outcome) => setSelection({market, outcome});
  return <div className="pm-card-gallery">
    <div className="pm-variant-grid"><SportsMatchupCard market={predictionMarkets[4]} onTrade={trade} onOpen={setDetail}/><MultiOutcomeMarketCard market={candidateMarket} onTrade={trade} onOpen={setDetail}/><MomentumMarketCard market={momentumMarket} onTrade={trade} onOpen={setDetail}/><MultiOutcomeMarketCard market={mentionsMarket} independent onTrade={trade} onOpen={setDetail}/></div>
    <Modal open={Boolean(selection)} onClose={() => setSelection(null)} title="Trade outcome" size="md">{selection && <PredictionBetSlip key={`${selection.market.id}-${selection.outcome}`} market={selection.market} initialOutcome={selection.outcome}/>}</Modal>
    <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Market rules" size="md">{detail && <div className="space-y-4"><h3 className="text-lg font-semibold">{detail.question}</h3><p className="text-sm text-text-secondary leading-relaxed">{detail.rules}</p><p className="text-xs text-text-secondary">Closes {new Date(detail.closesAt).toLocaleDateString("en-US", {timeZone:"UTC"})} · Sample market</p></div>}</Modal>
  </div>;
}

export function OutcomePostCard({ position, showAmounts = false, onCopyTrade }: { position: PurchasedPosition; showAmounts?: boolean; onCopyTrade?: (position: PurchasedPosition) => void }) {
  return <VStack gap={3} hAlign="start"><PositionReceipt position={position} showAmounts={showAmounts}/>{onCopyTrade && !position.market.winner && !position.settlement && <Button type="button" size="sm" variant="secondary" prefixIcon={DocumentDuplicateIcon} onClick={() => onCopyTrade(position)}>Use this position</Button>}</VStack>;
}

interface MarketComment { id: string; name: string; text: string; time: string; position?: PurchasedPosition; showAmounts?: boolean; likes?: number; replies?: MarketComment[] }
const initialComments: MarketComment[] = [
  {id:"c1",name:"Ada Okafor",text:"Backing Arsenal. Squad depth is the deciding factor for me this season.",time:"12 min ago",position:demoPositions[0],showAmounts:true,likes:6,replies:[{id:"r1",name:"Zara Chen",text:"Their depth looks strong. How much weight are you putting on the Champions League schedule?",time:"8 min ago",likes:2}]},
  {id:"c2",name:"Sam Rivers",text:"Still watching how the midfield settles. A long season ahead.",time:"24 min ago"},
];

export function CommentShareModal({ open, onClose, comment }: { open: boolean; onClose: () => void; comment: MarketComment }) {
  const [notice, setNotice] = useState("");
  const linkId = useId();
  const link = new URL(window.location.href);
  link.hash = `market-comment-${comment.id}`;
  const url = link.toString();
  const text = `${comment.name}: ${comment.text || "Shared a market position."}`;
  const targets = [
    { label: "WhatsApp", href: `https://wa.me/?${new URLSearchParams({ text: `${text}\n${url}` })}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?${new URLSearchParams({ u: url })}` },
    { label: "X", href: `https://twitter.com/intent/tweet?${new URLSearchParams({ text, url })}` },
  ];
  useEffect(() => { if (open) setNotice(""); }, [open]);
  return <Modal open={open} onClose={onClose} title="Share comment" size="md">
    <div className="pm-comment-share-modal">
      <blockquote><strong>{comment.name}</strong><p>{comment.text || "Shared a market position."}</p></blockquote>
      <div className="pm-share-destinations">{targets.map(target => <a key={target.label} href={target.href} target="_blank" rel="noopener noreferrer">{target.label}<ArrowUpRightIcon aria-hidden="true" /></a>)}</div>
      <label htmlFor={linkId}>Comment link</label>
      <div className="pm-share-link"><input id={linkId} type="url" readOnly value={url} onFocus={e => e.currentTarget.select()} /><Button prefixIcon={LinkIcon} onClick={async () => { try { await navigator.clipboard.writeText(url); setNotice("Link copied."); } catch { setNotice("Couldn't copy the link. Select it above to copy manually."); } }}>Copy link</Button></div>
      {typeof navigator.share === "function" && <Button prefixIcon={ShareIcon} onClick={async () => { try { await navigator.share({ title: "WorldStreet market comment", text, url }); } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setNotice("Sharing isn't available right now. Use a destination above or copy the link."); } }}>More sharing options</Button>}
      <p role="status">{notice}</p>
    </div>
  </Modal>;
}

function DiscussionComment({ comment, onCopyTrade, depth = 0 }: { comment: MarketComment; onCopyTrade: (position: PurchasedPosition) => void; depth?: number }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [threadOpen, setThreadOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [replies, setReplies] = useState(comment.replies ?? []);
  const [notice, setNotice] = useState("");
  const threadId = useId();
  const replyId = useId();
  const LikeIcon = liked ? FilledHeartIcon : HeartIcon;
  const ReplyIcon = threadOpen ? FilledCommentIcon : ChatBubbleLeftIcon;
  const SaveIcon = saved ? FilledBookmarkIcon : BookmarkIcon;
  const CommentShareIcon = shareOpen ? FilledShareIcon : ShareIcon;
  return <article className="pm-comment" id={`market-comment-${comment.id}`}>
    <header><Avatar name={comment.name} size="sm" /><strong>{comment.name}</strong><time>{comment.time}</time></header>
    {comment.text && <p>{comment.text}</p>}
    {comment.position && <OutcomePostCard position={comment.position} showAmounts={comment.showAmounts} onCopyTrade={onCopyTrade} />}
    <div className="pm-comment-actions" role="group" aria-label={`Actions for ${comment.name}'s comment`}>
      <button type="button" aria-label={`${liked ? "Unlike" : "Like"} ${comment.name}'s comment`} aria-pressed={liked} onClick={() => setLiked(!liked)}><LikeIcon aria-hidden="true" /><span>{(comment.likes ?? 0) + Number(liked)}</span></button>
      <button type="button" aria-label={`${threadOpen ? "Close" : "Open"} replies to ${comment.name}'s comment`} aria-expanded={threadOpen} aria-controls={threadId} onClick={() => setThreadOpen(!threadOpen)}><ReplyIcon aria-hidden="true" /><span>{replies.length}</span></button>
      <IconButton icon={SaveIcon} label={`${saved ? "Unsave" : "Save"} ${comment.name}'s comment`} aria-pressed={saved} onClick={() => setSaved(!saved)} />
      <IconButton icon={CommentShareIcon} label={`Share ${comment.name}'s comment`} onClick={() => setShareOpen(true)} aria-haspopup="dialog" />
    </div>
    <div id={threadId} className="pm-comment-thread" data-deep-thread={depth >= 2} hidden={!threadOpen}>
      {replies.map(reply => <DiscussionComment key={reply.id} comment={reply} depth={depth + 1} onCopyTrade={onCopyTrade} />)}
      <form className="pm-reply-composer" onSubmit={e => { e.preventDefault(); if (!draft.trim()) return; setReplies(prev => [...prev, { id: crypto.randomUUID(), name: "You", text: draft.trim(), time: "Just now" }]); setDraft(""); setNotice("Reply added."); }}>
        <Avatar name="You" size="sm" />
        <div><label className="sr-only" htmlFor={replyId}>Reply to {comment.name}</label><textarea id={replyId} placeholder={`Reply to ${comment.name}…`} value={draft} onChange={e => setDraft(e.target.value)} rows={2} maxLength={500} /><div className="pm-reply-submit"><span>{draft.length}/500</span><Button type="submit" prefixIcon={PaperAirplaneIcon} disabled={!draft.trim()}>Reply</Button></div></div>
      </form>
      <p className="pm-post-status" role="status">{notice}</p>
    </div>
    <CommentShareModal open={shareOpen} onClose={() => setShareOpen(false)} comment={comment} />
  </article>;
}

export function MarketDiscussion({ market, availablePositions = demoPositions }: { market?: PredictionMarket; availablePositions?: PurchasedPosition[] }) {
  const [tab, setTab] = useState("Comments");
  const [text, setText] = useState("");
  const [attach, setAttach] = useState(false);
  const [positionId, setPositionId] = useState(availablePositions[0]?.id ?? "");
  const [showAmounts, setShowAmounts] = useState(false);
  const [comments, setComments] = useState(market ? [{id:`${market.id}-discussion`,name:"Ada Okafor",text:"Watching the prices here. What would change your view on this market?",time:"12 min ago",likes:3}] as MarketComment[] : initialComments);
  const [status, setStatus] = useState("");
  const inputId = useId();
  const position = availablePositions.find(p => p.id === positionId);
  useEffect(() => {
    if (attach && !availablePositions.some(p => p.id === positionId)) { setAttach(false); setStatus("The attached position is no longer held. Choose another purchased position."); }
  }, [availablePositions, attach, positionId]);
  const copyTrade = (nextPosition: PurchasedPosition) => {
    if (!availablePositions.some(p => p.id === nextPosition.id)) { setStatus("Only your purchased positions can be attached."); return; }
    setPositionId(nextPosition.id);
    setAttach(true);
    setStatus("Trade details loaded into the composer.");
  };
  return <section className="pm-discussion" aria-label="Market community">
    <div className="pm-discussion-heading"><FilterTabs label="Market community view" value={tab} onChange={setTab} options={[{value:"Comments",label:`Comments (${comments.length})`},{value:"Activity",label:"Activity"}]} /><span>{market ? "This event · Preview" : "Demo community"}</span></div>
    <div hidden={tab !== "Comments"}>
      <form className="pm-comment-composer" onSubmit={e => { e.preventDefault(); if(!text.trim() && !(attach && position))return; setComments(prev => [{id:crypto.randomUUID(),name:"You",text:text.trim(),time:"Just now",position:attach ? position : undefined, showAmounts},...prev]); setText(""); setAttach(false); setShowAmounts(false); setStatus("Posted in this preview. No public post was sent."); }}>
        <div className="pm-composer-input"><Avatar name="You" size="md"/><label htmlFor={inputId} className="sr-only">Write a market comment</label><textarea id={inputId} placeholder="What's your take?" value={text} onChange={e => setText(e.target.value)} maxLength={500} rows={3}/></div>
        {attach && position && <div className="pm-attachment-editor"><div className="pm-attachment-select"><label>Purchased outcome<select aria-label="Purchased outcome to attach" value={positionId} onChange={e => setPositionId(e.target.value)}>{availablePositions.map(p => <option key={p.id} value={p.id}>{contractOutcome(p.market, p.outcomeId)?.label} · {p.market.question} · {p.id}</option>)}</select></label><IconButton type="button" icon={XMarkIcon} label="Remove purchased outcome" variant="ghost" onClick={() => setAttach(false)}/></div><label className="pm-privacy"><input type="checkbox" checked={showAmounts} onChange={e => setShowAmounts(e.target.checked)}/>Show my amount and shares</label><OutcomePostCard position={position} showAmounts={showAmounts} onCopyTrade={copyTrade}/></div>}
        <div className="pm-composer-actions"><Button type="button" variant={attach ? "tonal" : "ghost"} prefixIcon={TicketIcon} aria-pressed={attach} disabled={!availablePositions.length} onClick={() => { if (!attach) setPositionId(availablePositions[0]?.id ?? ""); setAttach(!attach); }}>Attach position</Button><span>{text.length}/500</span><Button type="submit" variant="primary" prefixIcon={PaperAirplaneIcon} disabled={!text.trim() && !(attach && position)}>Post</Button></div>
      </form>
      <p className="pm-post-status" role="status">{status}</p>
      <div className="pm-comments">{comments.map(comment => <DiscussionComment key={comment.id} comment={comment} onCopyTrade={copyTrade} />)}</div>
    </div><div className="pm-community-activity" hidden={tab !== "Activity"}>{market && !availablePositions.length && <p>No trades in this event yet. Your purchased positions will appear here.</p>}{(market ? availablePositions.map(p => ({id:p.id,name:"You",outcome:`${contractOutcome(p.market,p.outcomeId)?.label ?? "Position"} · ${p.market.question}`,amount:p.shares*p.entryPrice,time:"Purchased",side:"Bought"})) : [{id:"ada",name:"Ada Okafor",outcome:"Arsenal",amount:80,time:"12 min ago",side:"Bought"},{id:"sam",name:"Sam Rivers",outcome:"Manchester City",amount:62,time:"24 min ago",side:"Bought"},{id:"zara",name:"Zara Chen",outcome:"Liverpool",amount:48,time:"38 min ago",side:"Sold"}]).map(a => <div key={a.id}><Avatar name={a.name} size="md"/><p><strong>{a.name}</strong><span>{a.side} <b>{a.outcome}</b> <span>for {predictionMoney(a.amount)}</span></span></p><time>{a.time}</time></div>)}</div>
  </section>;
}
