import { useEffect, useRef, useState } from "react";
import { ArrowTopRightOnSquareIcon, BookmarkIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon, ClockIcon, GlobeAltIcon, MagnifyingGlassIcon, PauseIcon, PlayIcon, ScaleIcon, TicketIcon, TrophyIcon, BoltIcon } from "@heroicons/react/24/outline";
import { Button, IconButton } from "../../ui/Button";
import { Chip, StatusPill, TrendPill } from "../../ui/Badge";
import { InputField } from "../../ui/InputField";
import { SelectDropdown } from "../../ui/Dropdown";
import { Slider } from "../../ui/Slider";
import { ProgressBar } from "../../ui/Progress";
import { Avatar } from "../../ui/Avatar";
import { Countdown } from "../../ui/Countdown";
import { Modal } from "../../ui/Modal";
import { AssetMark, DataTable, FilterTabs, TablePagination, type Column } from "../../ui/Table";
import { predictionActivity, predictionTraders, type PredictionActivity, type PredictionMarket, type PredictionOutcome, type PredictionTrader } from "./predictionData";
import "./prediction.css";
import { ParticipantMark } from "./ParticipantMark";
import { FundingPicker, sampleFundingAssets, formatFunding, type FundingAsset, type PredictionFunding } from "./predictionFunding";
import { contractOutcome, isBinaryMarket } from "./predictionContracts";
import "./predictionTrade.css";

export const predictionMoney = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
const compactMoney = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(n);
const dateLabel = (date: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(date));
const panel = "min-w-0 rounded-lg border border-border-subtle bg-surface-base p-4";

function MarketMark({ market }: { market: PredictionMarket }) {
  const Icon = market.category === "Sports" ? TrophyIcon : market.category === "Tech" ? BoltIcon : market.category === "Economics" ? ScaleIcon : GlobeAltIcon;
  return <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-surface-sunken ring-1 ring-border-subtle">{market.symbol ? <AssetMark symbol={market.symbol} /> : <Icon className="size-6 text-domain-prediction" />}</span>;
}

export interface ProbabilityChartProps { values: number[]; label: string; compact?: boolean }
export function ProbabilityChart({ values, label, compact = false }: ProbabilityChartProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [range, setRange] = useState("1M");
  const [point, setPoint] = useState<number | null>(null);
  useEffect(() => {
    const element = plotRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(220, entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const count = range === "1D" ? 5 : range === "1W" ? 9 : values.length;
  const series = values.slice(-count);
  const height = compact ? 90 : 220;
  const x = (i: number) => 8 + i / Math.max(1, series.length - 1) * (width - 44);
  const y = (v: number) => 8 + (100 - v) / 100 * (height - 24);
  const points = series.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const index = point === null ? series.length - 1 : Math.min(point, series.length - 1);
  if (!series.length) return <div ref={plotRef} className="py-8 text-sm text-text-secondary">No probability history available.</div>;
  return <div ref={plotRef} className="pm-probability-chart min-w-0">
    {!compact && <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-text-secondary">Yes probability <strong className="ml-2 tabular-nums text-feedback-success">{series[index]}%</strong></span><FilterTabs label="Chart period" value={range} onChange={(v) => { setRange(v); setPoint(null); }} options={["1D", "1W", "1M", "ALL"].map(value => ({ value, label: value }))} /></div>}
    <svg viewBox={`0 0 ${width} ${height}`} className="block w-full" style={{height}} role="img" aria-label={`${label}. ${series.join(", ")} percent.`} onMouseLeave={() => setPoint(null)} onMouseMove={e => { const rect = e.currentTarget.getBoundingClientRect(); setPoint(Math.round(Math.max(0, Math.min(1, ((e.clientX - rect.left) / rect.width * width - 8) / (width - 44))) * (series.length - 1))); }}>
      {!compact && [0, 25, 50, 75, 100].map(v => <g key={v}><line x1="8" x2={width - 36} y1={y(v)} y2={y(v)} stroke="var(--ws-border-default)" strokeDasharray="3 5" /><text x={width - 26} y={y(v) + 4} fill="var(--ws-text-secondary)" fontSize="10">{v}%</text></g>)}
      <polygon points={`8,${height - 8} ${points} ${x(series.length - 1)},${height - 8}`} fill="var(--ws-feedback-success)" opacity="0.07" />
      <polyline points={points} fill="none" stroke="var(--ws-feedback-success)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(index)} cy={y(series[index])} r="4" fill="var(--ws-feedback-success)" />
    </svg>
    {!compact && <><div className="mt-2 flex justify-between text-[11px] text-text-secondary"><span>{range === "1D" ? "24 hours ago" : range === "1W" ? "7 days ago" : "30 days ago"}</span><span>Latest sample</span></div><input className="chart-inspector" type="range" min={0} max={series.length - 1} value={index} aria-label={`Inspect ${label}`} aria-valuetext={`Sample ${index + 1}: ${series[index]}%`} onChange={e => setPoint(Number(e.target.value))} /></>}
  </div>;
}

export interface OutcomeSelectorProps {
  type?: "binary" | "categorical" | "scalar";
  outcomes?: PredictionOutcome[];
  value?: string;
  onChange?: (value: string) => void;
  scalarValue?: number;
  onScalarChange?: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}
export function OutcomeSelector({ type = "binary", outcomes = [], value, onChange, scalarValue = 5000, onScalarChange, min = 1000, max = 10000, disabled }: OutcomeSelectorProps) {
  if (type === "scalar") return <Slider label="ETH closing price prediction" min={min} max={max} step={50} value={scalarValue} onChange={v => onScalarChange?.(v)} format={predictionMoney} disabled={disabled} marks={[{ value: min, label: predictionMoney(min) }, { value: max, label: predictionMoney(max) }]} />;
  return <div role="group" aria-label="Choose outcome" className={type === "binary" ? "grid grid-cols-2 gap-2" : "grid gap-2"}>
    {outcomes.map(outcome => <Button key={outcome.id} size="lg" variant={outcome.id === "no" ? "danger-tonal" : "tonal"} disabled={disabled} aria-pressed={value === outcome.id} data-outcome={outcome.id} onClick={() => onChange?.(outcome.id)} className={`pm-outcome-button ${value === outcome.id ? "ring-1 ring-current" : ""}`}>
      <span className="flex min-w-0 items-center gap-1.5"><ParticipantMark outcome={outcome}/>{value === outcome.id && <CheckIcon className="size-4 shrink-0" />}<span>{outcome.label}</span></span>
      <span className="pm-outcome-price">{outcome.probability}%<span>{predictionMoney(outcome.probability / 100)}/share</span></span>
    </Button>)}
  </div>;
}

export interface PredictionMarketCardProps {
  market: PredictionMarket;
  variant?: "default" | "compact" | "featured" | "multi-outcome";
  state?: "open" | "resolved";
  onTrade?: (market: PredictionMarket, outcome: string) => void;
  onOpen?: (market: PredictionMarket) => void;
}
export function PredictionMarketCard({ market, variant = "default", state = "open", onTrade, onOpen }: PredictionMarketCardProps) {
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [localOutcome, setLocalOutcome] = useState<string | null>(null);
  const resolved = state === "resolved" || Boolean(market.winner);
  const categorical = market.outcomes.length > 2;
  const featured = variant === "featured";
  const trade = (outcome: string) => onTrade ? onTrade(market, outcome) : setLocalOutcome(outcome);
  const main = market.outcomes[0];
  return <article className="pm-standard-card" data-market-card={market.id} data-variant={variant}>
    <div className="flex items-start gap-3"><MarketMark market={market} /><div className="min-w-0 flex-1"><div className="mb-2 flex items-center gap-2 text-xs text-text-secondary"><span>{market.category}</span>{featured && <Chip size="sm">Most traded</Chip>}</div><h3 className="pm-standard-title">{onOpen ? <button className="text-left hover:underline" onClick={() => onOpen(market)}>{market.question}</button> : market.question}</h3></div><IconButton icon={BookmarkIcon} size="sm" label={saved ? `Unsave ${market.question}` : `Save ${market.question}`} variant={saved ? "tonal" : "ghost"} aria-pressed={saved} onClick={() => setSaved(!saved)} /></div>
    {resolved ? <div className="my-5"><StatusPill tone="success">Resolved: {market.outcomes.find(o => o.id === market.winner)?.label ?? main.label}</StatusPill></div> : variant === "compact" ? <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold tabular-nums">{main.probability}% {main.label}</span><Button variant="tonal" onClick={() => trade(main.id)}>Trade</Button></div> : <>
      {!categorical && <div className="pm-standard-probability"><div className="mb-3 flex items-end justify-between gap-2"><span className="text-4xl font-semibold tabular-nums text-text-primary">{main.probability}<span className="text-xl text-text-secondary">%</span><span className="ml-2 text-xs font-normal text-text-secondary">chance</span></span><TrendPill size="sm" direction={market.change >= 0 ? "up" : "down"} value={`${market.change > 0 ? "+" : ""}${market.change} pp`} /></div>{!featured && <ProgressBar value={main.probability} tone="success" size="sm" aria-label="Yes probability" />}</div>}
      {featured && <ProbabilityChart values={market.history} label={market.question} />}
      <div className="pm-card-trading"><OutcomeSelector type={categorical ? "categorical" : "binary"} outcomes={categorical && !expanded ? market.outcomes.slice(0, 2) : market.outcomes} onChange={trade} /></div>
      {categorical && <Button variant="ghost" size="sm" className="mt-1 self-start" suffixIcon={ChevronDownIcon} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Fewer outcomes" : `Show ${market.outcomes.length - 2} more outcomes`}</Button>}
    </>}
    <footer className="pm-standard-footer"><span><strong>{compactMoney(market.volume)}</strong> volume</span><span className="flex items-center gap-1"><ClockIcon className="size-3.5" />{dateLabel(market.closesAt)}</span></footer>
    <Modal open={localOutcome !== null} onClose={() => setLocalOutcome(null)} title="Trade outcome" size="md"><PredictionBetSlip key={localOutcome} market={market} initialOutcome={localOutcome ?? main.id} /></Modal>
  </article>;
}

export interface PredictionOrder { marketId: string; outcomeId: string; side: "buy" | "sell"; orderType: "market" | "limit"; shares: number; price: number; total: number; expiration: string; funding?: PredictionFunding }

interface TradeSummaryProps {
  side: "buy" | "sell";
  orderType: "market" | "limit";
  outcome: PredictionOutcome;
  shares: number;
  price: number;
  total: number;
  expiration: string;
  fundingLabel?: string;
}

function TradeSummary({ side, orderType, outcome, shares, price, total, expiration, fundingLabel }: TradeSummaryProps) {
  return <div className="space-y-3" data-trade-summary>
    {fundingLabel && <p className="trade-funding-summary">{side === "buy" ? "Pay" : "Receive"}: {fundingLabel} · Sample conversion</p>}
    <div className="rounded-lg border border-border-subtle bg-surface-sunken p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">{side} · {orderType}</p><p className="mt-1 text-lg font-semibold">{outcome.label}</p></div><p className="text-3xl font-semibold tabular-nums text-text-primary">{predictionMoney(total)}</p></div><p className="mt-2 text-xs text-text-secondary">{shares.toLocaleString("en-US")} shares at {predictionMoney(price)} each</p></div>
    <dl className="divide-y divide-border-subtle rounded-lg border border-border-subtle bg-surface-base px-4 text-xs tabular-nums"><div className="flex justify-between gap-4 py-3"><dt className="text-text-secondary">Potential payout</dt><dd>{predictionMoney(shares)}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-text-secondary">Potential profit</dt><dd className="text-feedback-success">+{predictionMoney(shares - total)}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-text-secondary">Fees</dt><dd>Not included</dd></div>{orderType === "limit" && <div className="flex justify-between gap-4 py-3"><dt className="text-text-secondary">Expires</dt><dd>{expiration === "gtc" ? "Good till cancelled" : expiration === "1h" ? "In 1 hour" : "In 24 hours"}</dd></div>}</dl>
  </div>;
}

export interface TradeReviewModalProps extends TradeSummaryProps {
  open: boolean;
  market: PredictionMarket;
  onClose: () => void;
  onConfirm: () => void;
}

export function TradeReviewModal({ open, market, onClose, onConfirm, ...summary }: TradeReviewModalProps) {
  return <Modal open={open} onClose={onClose} title="Review trade" description="Check the outcome, price and estimated payout before continuing." size="md" mobile="sheet" footer={<><Button variant="ghost" onClick={onClose}>Edit trade</Button><Button variant="primary" suffixIcon={ChevronRightIcon} onClick={onConfirm}>Continue to confirmation</Button></>}><div className="space-y-5"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-action-primary-tonal text-action-primary-text"><CheckIcon className="size-5" /></span><div><p className="text-xs text-text-secondary">You are about to trade</p><h3 className="mt-1 text-base font-semibold leading-snug">{market.question}</h3></div></div><TradeSummary {...summary} /><p className="text-xs leading-relaxed text-text-tertiary">This is an estimate from the current market. Market orders can move before execution; limit orders may remain unfilled.</p></div></Modal>;
}

export interface TradeConfirmationModalProps extends TradeSummaryProps {
  open: boolean;
  market: PredictionMarket;
  busy?: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

export function TradeConfirmationModal({ open, market, busy = false, onBack, onConfirm, ...summary }: TradeConfirmationModalProps) {
  return <Modal open={open} onClose={onBack} title="Confirm trade" description="This action will submit the order to the market." size="sm" mobile="dialog" busy={busy} footer={<><Button variant="ghost" disabled={busy} onClick={onBack}>Go back</Button><Button variant="primary" loading={busy} onClick={onConfirm}>Place trade</Button></>}><div className="space-y-4"><div className="rounded-lg border border-action-primary/30 bg-action-primary-tonal p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-action-primary-text">Final check</p><p className="mt-2 text-sm font-semibold leading-snug">Submit {summary.side} order for {summary.outcome.label}?</p><p className="mt-1 text-xs leading-relaxed text-action-primary-text/80">{market.question}</p></div><TradeSummary {...summary} /><p className="text-[11px] leading-relaxed text-text-tertiary">Winning shares pay $1. Losing shares pay $0. Simulated orders only; no funds move.</p></div></Modal>;
}

export interface PredictionBetSlipProps {
  market: PredictionMarket;
  initialOutcome?: string;
  orderType?: "market" | "limit";
  state?: "default" | "insufficient-funds" | "executing";
  balance?: number;
  fundingAssets?: FundingAsset[];
  holdings?: Record<string, number>;
  onSubmit?: (order: PredictionOrder) => Promise<void>;
  onDeposit?: () => void;
}

export interface TradeReceiptTicketProps {
  market: PredictionMarket;
  outcome: PredictionOutcome;
  side: "buy" | "sell";
  orderType?: "market" | "limit";
  status?: "filled" | "pending";
  shares: number;
  price: number;
  total: number;
  reference?: string;
  executedAt?: string;
}

export function TradeReceiptTicket({ market, outcome, side, orderType = "market", status = "filled", shares, price, total, reference = "WS-0204", executedAt }: TradeReceiptTicketProps) {
  const closeDate = dateLabel(market.closesAt);
  const timestamp = executedAt ? new Date(executedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }) : "Just now";
  const pending = status === "pending";
  const ReceiptStatusIcon = pending ? ClockIcon : CheckIcon;
  return <article className="pm-trade-receipt" data-trade-side={side} data-trade-status={status} aria-label={`${pending ? "Pending" : "Completed"} ${side} trade receipt for ${outcome.label}`}>
    <div className="pm-receipt-content">
      <div className="pm-receipt-identity"><span className="pm-receipt-mark"><TicketIcon /></span><h3>{market.question}</h3></div>
      <p className="pm-receipt-order">{side === "buy" ? "Buy" : "Sell"} · {orderType === "limit" ? "Limit" : "Market"} · {pending ? "Pending" : "Filled"}</p>
      <dl className="pm-receipt-details"><div><dt>Prediction</dt><dd><span className="pm-receipt-outcome" data-outcome={outcome.id}>{outcome.label}</span></dd></div><div><dt>Due date</dt><dd>{closeDate}</dd></div><div><dt>Qty</dt><dd>{shares.toLocaleString("en-US")}</dd></div><div><dt>Avg. price</dt><dd>{predictionMoney(price)}<small>/ share</small></dd></div><div><dt>Total</dt><dd>{predictionMoney(total)}</dd></div><div className="pm-receipt-emphasis"><dt>{side === "buy" ? "To win" : "Proceeds"}</dt><dd>{side === "buy" ? predictionMoney(shares) : predictionMoney(total)}</dd></div></dl>
    </div>
    <footer className="pm-receipt-footer"><span><ReceiptStatusIcon /> {pending ? "Limit order placed" : "Trade executed"}</span><span>{reference}</span><small>{timestamp}{executedAt ? " UTC" : ""}</small></footer>
  </article>;
}

export function PredictionBetSlip({ market, initialOutcome, orderType = "market", state = "default", balance = 1250, fundingAssets, holdings = {}, onSubmit, onDeposit }: PredictionBetSlipProps) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [type, setType] = useState(orderType);
  const binary = isBinaryMarket(market);
  const [baseId, setBaseId] = useState(initialOutcome?.replace(/::no$/, "") ?? market.outcomes[0].id);
  const [answer, setAnswer] = useState<"yes" | "no">(initialOutcome?.endsWith("::no") || (binary && initialOutcome === market.outcomes[1].id) ? "no" : "yes");
  const baseOutcome = market.outcomes.find(o => o.id === baseId) ?? market.outcomes[0];
  const outcomeId = binary ? market.outcomes[answer === "yes" ? 0 : 1].id : baseOutcome.id + (answer === "no" ? "::no" : "");
  const outcome = contractOutcome(market, outcomeId)!;
  const [amount, setAmount] = useState("");
  const assets = fundingAssets ?? sampleFundingAssets.map(asset => asset.id === "USD" ? { ...asset, balance } : asset);
  const [assetId, setAssetId] = useState("USD");
  const asset = assets.find(a => a.id === assetId) ?? assets[0];
  const [limit, setLimit] = useState(String(outcome.probability));
  const [expiration, setExpiration] = useState("gtc");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [lastReceipt, setLastReceipt] = useState<Omit<TradeReceiptTicketProps, "market" | "outcome"> & { outcome: PredictionOutcome } | null>(null);
  const [used, setUsed] = useState<Record<string, number>>({});
  const [spent, setSpent] = useState<Record<string, number>>({});
  const submissionLock = useRef(false);
  const input = Number(amount);
  const price = type === "limit" ? Number(limit) / 100 : outcome.probability / 100;
  const priceValid = Number.isFinite(price) && price >= 0.01 && price <= 0.99;
  const amountValid = Number.isFinite(input) && input > 0;
  const shares = priceValid && amountValid ? (side === "buy" ? Math.floor(input * asset.usdRate / price + 1e-9) : Math.floor(input)) : 0;
  const total = Math.round(shares * price * 100) / 100;
  const fundingAmount = Math.max(0, Math.ceil((total / asset.usdRate - 1e-10) * 10 ** asset.decimals) / 10 ** asset.decimals);
  const available = state === "insufficient-funds" ? 0 : Math.max(0, asset.balance - (onSubmit ? 0 : spent[asset.id] ?? 0));
  const owned = Math.max(0, (holdings[outcomeId] ?? 0) - (used[outcomeId] ?? 0));
  const insufficient = side === "buy" && fundingAmount > available;
  const oversell = side === "sell" && shares > owned;
  const executing = busy || state === "executing";
  const invalid = !priceValid || !amountValid || !Number.isSafeInteger(shares) || shares < 1 || (side === "sell" && !Number.isInteger(input)) || oversell || Boolean(market.winner);
  const reset = () => { setReviewOpen(false); setConfirmationOpen(false); setNotice(""); };
  const openReview = () => { setNotice(""); setReviewOpen(true); };
  const openConfirmation = () => { setReviewOpen(false); setConfirmationOpen(true); };
  async function submit() {
    if (submissionLock.current || invalid || insufficient) return;
    submissionLock.current = true;
    setBusy(true);
    try {
      const order: PredictionOrder = { marketId: market.id, outcomeId, side, orderType: type, shares, price, total, expiration, funding: { assetId: asset.id, amount: fundingAmount, usdRate: asset.usdRate } };
      if (onSubmit) await onSubmit(order); else await new Promise(resolve => setTimeout(resolve, 650));
      if (!onSubmit) {
        if (side === "buy" || type === "market") setSpent(v => ({ ...v, [asset.id]: (v[asset.id] ?? 0) + (side === "buy" ? fundingAmount : -fundingAmount) }));
        if (side === "sell" || type === "market") setUsed(v => ({ ...v, [outcomeId]: (v[outcomeId] ?? 0) + (side === "sell" ? shares : -shares) }));
      }
      setNotice(`${onSubmit ? "Order submitted" : "Demo order recorded"}: ${shares} ${outcome.label} shares${type === "limit" ? ", pending fill" : ""}.`);
      setLastReceipt({ outcome, side, orderType: type, status: type === "limit" ? "pending" : "filled", shares, price, total, reference: `WS-${String(Math.round(total * 100)).padStart(4, "0")}` });
      setConfirmationOpen(false);
    } catch { setNotice("Order could not be submitted. Your balance has not changed. Please retry."); }
    finally { setBusy(false); submissionLock.current = false; }
  }
  if (lastReceipt) return <div className="space-y-4" data-bet-slip data-trade-complete><TradeReceiptTicket market={market} {...lastReceipt} /><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-text-secondary">{lastReceipt.status === "pending" ? "Your limit order is waiting for a matching fill." : "Your order was recorded in this preview."}</p><Button variant="secondary" onClick={() => { setLastReceipt(null); setNotice(""); }}>New trade</Button></div></div>;
  return <section className="prediction-trade-form" data-bet-slip>
    <header className="trade-ticket-toolbar">
      <section role="group" aria-label="Trade side">{(["buy", "sell"] as const).map(v => <Button key={v} variant="ghost" disabled={executing} aria-pressed={side === v} onClick={() => { setSide(v); setAmount(""); reset(); }}>{v === "buy" ? "Buy" : "Sell"}</Button>)}</section>
      <SelectDropdown label="Order type" hideLabel size="md" value={type} disabled={executing} onChange={v => { setType(v as "market" | "limit"); reset(); }} options={[{ value: "market", label: "Market" }, { value: "limit", label: "Limit" }]}/>
    </header>
    <p className="trade-market-question">{market.question}</p>
    <fieldset disabled={executing}>
      {!binary && <section className="trade-contract-heading"><ParticipantMark outcome={baseOutcome}/><SelectDropdown label="Outcome" hideLabel value={baseOutcome.id} onChange={v => { const next = market.outcomes.find(o => o.id === v)!; setBaseId(next.id); setAnswer("yes"); setLimit(String(next.probability)); reset(); }} options={market.outcomes.map(o => ({ value: o.id, label: o.label }))}/></section>}
      <section className="trade-answer-tabs" role="group" aria-label="Contract answer">{(["yes", "no"] as const).map(value => {
        const probability = binary ? market.outcomes[value === "yes" ? 0 : 1].probability : value === "yes" ? baseOutcome.probability : 100 - baseOutcome.probability;
        return <Button key={value} shape="pill" variant={answer === value ? "primary" : "ghost"} aria-pressed={answer === value} onClick={() => { setAnswer(value); setLimit(String(probability)); reset(); }}>{value === "yes" ? "Yes" : "No"} {probability}¢</Button>;
      })}</section>
      <InputField label={side === "buy" ? `Amount (${asset.id})` : "Shares to sell"} hideLabel placeholder={side === "buy" ? "Amount" : "Shares"} type="number" min="0" step={side === "buy" ? String(10 ** -asset.decimals) : "1"} value={amount}
        trailingContent={<FundingPicker assets={assets} value={asset.id} disabled={executing} onChange={value => { setAssetId(value); setAmount(""); reset(); }}/>} onChange={e => { setAmount(e.target.value); reset(); }}
        error={oversell ? `You only hold ${owned} ${outcome.label} shares.` : amount && !amountValid ? "Enter an amount greater than zero." : side === "sell" && !Number.isInteger(input) ? "Enter a whole number of shares." : undefined}/>
      <section className="trade-available"><p>{side === "buy" ? `${formatFunding(available, asset)} available` : `${owned} shares held · Receive ${asset.id}`}</p><Button size="sm" variant="ghost" onClick={() => { setAmount(String(side === "buy" ? available : owned)); reset(); }}>Max</Button></section>
      {type === "limit" && <section className="trade-limit-fields"><InputField label="Limit price (cents per share)" type="number" min="1" max="99" step="1" value={limit} onChange={e => { setLimit(e.target.value); reset(); }} error={!priceValid ? "Price must be between 1 and 99 cents." : undefined}/><SelectDropdown label="Expiration" value={expiration} onChange={v => { setExpiration(String(v)); reset(); }} options={[{ value: "gtc", label: "Good till cancelled" }, { value: "1h", label: "In 1 hour" }, { value: "1d", label: "In 24 hours" }]}/></section>}
    </fieldset>
    <dl className="trade-ticket-summary">
      <section><dt>Odds</dt><dd>{outcome.probability}% chance</dd></section>
      <section><dt>Shares</dt><dd>{shares.toLocaleString("en-US")}</dd></section>
      <section><dt>{side === "buy" ? "Estimated cost" : "Estimated proceeds"}</dt><dd>{formatFunding(fundingAmount, asset)}</dd></section>
      <section className="trade-max-payout"><dt>{side === "buy" ? "Max payout" : "USD equivalent"}<small>{dateLabel(market.closesAt)}</small></dt><dd>{predictionMoney(side === "buy" ? shares : total)}</dd></section>
    </dl>
    <Button variant="primary" size="lg" shape="pill" className="trade-review-button" loading={executing} disabled={invalid || executing || (insufficient && !onDeposit)} onClick={() => insufficient && onDeposit ? onDeposit() : openReview()}>{insufficient ? "Insufficient balance" : `Review ${side === "buy" ? "Buy" : "Sell"}`}</Button>
    {notice && <p role="status">{notice}</p>}
    <p className="trade-demo-note">Simulated trade. Sample conversion rates. Fees excluded.{type === "limit" ? " Limit orders reserve funds or shares until filled." : " Winning shares settle at $1 USD."}</p>
    <TradeReviewModal open={reviewOpen} market={market} side={side} orderType={type} outcome={outcome} shares={shares} price={price} total={total} expiration={expiration} fundingLabel={formatFunding(fundingAmount, asset)} onClose={() => setReviewOpen(false)} onConfirm={openConfirmation}/>
    <TradeConfirmationModal open={confirmationOpen} market={market} side={side} orderType={type} outcome={outcome} shares={shares} price={price} total={total} expiration={expiration} fundingLabel={formatFunding(fundingAmount, asset)} busy={busy} onBack={() => { setConfirmationOpen(false); setReviewOpen(true); }} onConfirm={() => void submit()}/>
  </section>;
}

export interface LiveOddsTickerProps { display?: "banner" | "feed"; state?: "default" | "flash-up" | "flash-down"; items?: PredictionActivity[] }
export function LiveOddsTicker({ display = "banner", state = "default", items = predictionActivity }: LiveOddsTickerProps) {
  const [paused, setPaused] = useState(false);
  return <div className={display === "banner" ? "flex min-w-0 items-center gap-3 border-y border-border-subtle py-3" : "min-w-0"}>
    {display === "banner" ? <><span className="shrink-0 text-[10px] font-semibold text-text-secondary">ODDS FEED</span><div className="prediction-ticker min-w-0 flex-1 overflow-hidden"><div className={`prediction-ticker-track ${paused ? "is-paused" : ""}`}>{items.map(item => <div key={item.id} className="flex shrink-0 items-center gap-2 text-xs"><span>{item.market}</span><strong className="tabular-nums">{item.probability}%</strong><span className={item.change >= 0 ? "text-feedback-success" : "text-feedback-danger"}>{item.change > 0 ? "+" : ""}{item.change} pp</span></div>)}</div></div><IconButton icon={paused ? PlayIcon : PauseIcon} label={paused ? "Play odds ticker" : "Pause odds ticker"} variant="ghost" onClick={() => setPaused(!paused)} /></> : <ul className="divide-y divide-border-subtle">{items.map((item, i) => <li key={item.id} className={`flex items-start gap-3 py-3 ${i === 0 && state !== "default" ? state === "flash-up" ? "bg-feedback-success/10" : "bg-feedback-danger/10" : ""}`}><Avatar name={item.trader} size="sm" /><div className="min-w-0 flex-1 text-xs"><div className="flex justify-between gap-2"><strong className="font-medium">{item.trader}</strong><span className="shrink-0 text-text-tertiary">{item.secondsAgo}s ago</span></div><p className="mt-1 text-text-secondary">{item.side} <span className={item.side === "bought" ? "text-feedback-success" : "text-feedback-danger"}>{item.outcome}</span> for <span className="tabular-nums text-text-primary">{predictionMoney(item.amount)}</span></p><p className="mt-1 truncate text-text-tertiary">{item.market}</p></div></li>)}</ul>}
  </div>;
}

export interface MarketResolutionCardProps { market: PredictionMarket; status?: "disputed" | "settled-winner" | "settled-loser"; shares?: number; cost?: number; appealEndsAt?: number; onClaim?: () => Promise<void> }
export function MarketResolutionCard({ market, status = "settled-winner", shares = 250, cost = 180, appealEndsAt, onClaim }: MarketResolutionCardProps) {
  const [claimed, setClaimed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [defaultDeadline] = useState(() => Date.now() + 7200000);
  const claimLock = useRef(false);
  const disputed = status === "disputed";
  return <article className={`${panel} space-y-4`}><StatusPill tone={disputed ? "warning" : status === "settled-winner" ? "success" : "neutral"}>{disputed ? "Under dispute" : "Settled"}</StatusPill><h3 className="text-base font-semibold leading-snug">{market.question}</h3><p className="text-sm text-text-secondary">{disputed ? "Proposed outcome" : "Final outcome"}: <strong className="text-text-primary">{market.outcomes.find(o => o.id === market.winner)?.label ?? "Yes"}</strong></p><p className="text-xs leading-relaxed text-text-secondary">{market.rules}</p><a className="inline-flex items-center gap-1 text-xs text-action-primary-text underline underline-offset-4" href={market.source.url} target="_blank" rel="noreferrer">{market.source.label}<ArrowTopRightOnSquareIcon className="size-3.5" /></a>{disputed ? <div className="border-t border-border-subtle pt-4 text-xs text-tonal-warning-text">Appeal window: <Countdown endsAt={appealEndsAt ?? defaultDeadline} />. Payouts are paused pending the final decision.</div> : <><dl className="space-y-2 border-t border-border-subtle pt-4 text-xs"><div className="flex justify-between"><dt className="text-text-secondary">Your position</dt><dd>{shares} {status === "settled-winner" ? "winning" : "losing"} shares</dd></div><div className="flex justify-between"><dt className="text-text-secondary">Position cost</dt><dd>{predictionMoney(cost)}</dd></div><div className="flex justify-between"><dt className="text-text-secondary">Net return before fees</dt><dd className={status === "settled-winner" ? "text-feedback-success" : "text-feedback-danger"}>{predictionMoney((status === "settled-winner" ? shares : 0) - cost)}</dd></div></dl><p className="text-3xl font-semibold tabular-nums">{predictionMoney(status === "settled-winner" ? shares : 0)}<span className="ml-2 text-xs font-normal text-text-secondary">payout</span></p>{status === "settled-winner" && <Button variant="primary" size="lg" className="w-full" loading={busy} disabled={claimed || busy} onClick={async () => { if (claimLock.current) return; claimLock.current = true; setBusy(true); setError(""); try { if (onClaim) await onClaim(); else await new Promise(resolve => setTimeout(resolve, 500)); setClaimed(true); } catch { setError("Claim failed. Please retry."); } finally { setBusy(false); claimLock.current = false; } }}>{claimed ? (onClaim ? "Earnings claimed" : "Demo earnings claimed") : "Claim Earnings"}</Button>}{error && <p role="alert" className="text-xs text-feedback-danger">{error}</p>}</>}</article>;
}

export interface PredictionLeaderboardProps { timeframe?: "daily" | "weekly" | "all-time"; variant?: "global" | "widget"; traders?: PredictionTrader[] }
export function PredictionLeaderboard({ timeframe = "weekly", variant = "global", traders = predictionTraders }: PredictionLeaderboardProps) {
  const [period, setPeriod] = useState(timeframe);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(5);
  const filtered = traders.filter(t => t.name.toLowerCase().includes(query.toLowerCase())).map((t, i) => ({ ...t, profit: period === "all-time" ? t.profit * (4 + i % 3) : period === "daily" ? t.profit * (0.07 + i % 3 * 0.03) : t.profit })).sort((a, b) => b.profit - a.profit);
  const columns: Column<PredictionTrader>[] = [
    { id: "rank", header: "Rank", cell: t => <span className="text-text-tertiary">{filtered.findIndex(row => row.id === t.id) + 1}</span>, width: "60px" },
    { id: "trader", header: "Trader", rowHeader: true, cell: t => <span className="flex items-center gap-3"><Avatar name={t.name} size="sm" /><span>{t.name}</span></span> },
    { id: "win", header: "Win rate", numeric: true, cell: t => `${t.winRate}%` },
    { id: "pnl", header: "Net profit", numeric: true, cell: t => <span className="text-feedback-success">+{predictionMoney(t.profit)}</span> },
    { id: "positions", header: "Positions", numeric: true, cell: t => t.positions },
    { id: "badge", header: "Achievement", cell: t => <Chip size="sm">{t.badge}</Chip> },
  ];
  return <div className="min-w-0 space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-base font-semibold"><TrophyIcon className="size-5 text-action-primary-text" />Top forecasters</h3><FilterTabs label="Leaderboard timeframe" value={period} onChange={v => { setPeriod(v); setPage(1); }} options={[{ value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }, { value: "all-time", label: "All time" }]} /></div>{variant === "widget" ? <ol className="divide-y divide-border-subtle">{filtered.slice(0, 3).map((t, i) => <li key={t.id} className="flex items-center gap-3 py-3 text-xs"><span className="w-4 tabular-nums text-text-tertiary">{i + 1}</span><Avatar name={t.name} size="sm" /><span className="flex-1">{t.name}<span className="mt-1 block text-text-tertiary">{t.winRate}% win rate</span></span><strong className="tabular-nums text-feedback-success">+{compactMoney(t.profit)}</strong></li>)}</ol> : <><InputField label="Search traders" hideLabel placeholder="Search traders" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} leadingIcon={MagnifyingGlassIcon} /><div className="overflow-x-auto"><DataTable caption="Prediction leaderboard" columns={columns} rows={filtered.slice((page - 1) * size, page * size)} rowKey={t => t.id} rowLabel={t => t.name} density="compact" /></div>{filtered.length > 0 ? <TablePagination page={page} pageCount={Math.ceil(filtered.length / size)} pageSize={size} pageSizes={[5, 10]} onPage={setPage} onPageSize={v => { setSize(v); setPage(1); }} total={filtered.length} /> : <p className="py-4 text-sm text-text-secondary">No traders match your search.</p>}</>}</div>;
}
