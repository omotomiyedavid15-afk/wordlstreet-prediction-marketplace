import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Grid } from "@astryxdesign/core/Grid";
import { Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import { CheckCircleIcon, XCircleIcon, TicketIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";
import { ParticipantMark } from "./ParticipantMark";
import type { PurchasedPosition } from "./predictionCardData";
import { receiptResult } from "./positionReceiptModel";

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const receiptCss = `
.ws-receipt { --receipt-accent: var(--ws-domain-prediction-accent); --receipt-ink: var(--ws-prim-neutral-50); width:100%; max-width:calc(var(--spacing-12) * 10); zoom:.7; color:var(--receipt-ink); background:radial-gradient(ellipse at 5% 90%,var(--receipt-accent),transparent 45%),radial-gradient(ellipse at 100% 110%,color-mix(in srgb,var(--receipt-accent),var(--receipt-ink) 55%),transparent 52%),var(--ws-prim-neutral-950); border-radius:var(--radius-page); overflow:hidden; isolation:isolate; }
.ws-receipt[data-result=won] { --receipt-accent:var(--ws-feedback-success); }
.ws-receipt[data-result=lost] { --receipt-accent:var(--ws-feedback-danger); }
.ws-receipt[data-result=void] { --receipt-accent:var(--ws-text-tertiary); }
.ws-receipt .astryx-text { color:inherit; }
.ws-receipt .receipt-label { font-size:var(--font-size-sm); letter-spacing:.13em; text-transform:uppercase; color:color-mix(in srgb,var(--receipt-ink),transparent 28%); }
.ws-receipt .receipt-name { font-family:"Handjet",var(--font-mono); font-size:clamp(var(--font-size-3xl),7vw,calc(var(--font-size-4xl) * 1.8)); font-weight:700; line-height:1.12; overflow-wrap:anywhere; }
.ws-receipt .receipt-hero { padding-block:var(--spacing-8) var(--spacing-3); }
.ws-receipt .astryx-token { color:var(--receipt-ink); background:color-mix(in srgb,var(--receipt-accent),transparent 65%); padding:var(--spacing-1) var(--spacing-2); border-radius:var(--radius-element); }
.ws-receipt .pm-participant-mark { width:calc(var(--spacing-12) * 1.7); height:calc(var(--spacing-12) * 1.7); flex:0 0 calc(var(--spacing-12) * 1.7); }
.ws-receipt .receipt-symbol { width:var(--spacing-12); height:var(--spacing-12); color:var(--receipt-accent); }
.ws-receipt .receipt-question { min-height:var(--spacing-12); line-height:1.6; font-size:var(--font-size-lg); }
.ws-receipt .receipt-numbers { padding-block:var(--spacing-6); }
.ws-receipt .receipt-value { font-size:clamp(var(--font-size-lg),4vw,var(--font-size-3xl)); font-weight:700; color:color-mix(in srgb,var(--receipt-accent),var(--receipt-ink) 48%); font-variant-numeric:tabular-nums; }
.ws-receipt .receipt-metric + .receipt-metric { border-inline-start:solid calc(var(--spacing-1) / 4) color-mix(in srgb,var(--receipt-ink),transparent 70%); padding-inline-start:var(--spacing-4); }
.ws-receipt .receipt-confirmation { font-size:var(--font-size-sm); padding-block:var(--spacing-2) var(--spacing-5); }
.ws-receipt .receipt-confirmation svg { width:var(--spacing-5); height:var(--spacing-5); }
.ws-receipt .receipt-stub { position:relative; padding:var(--spacing-6) var(--spacing-8); background:color-mix(in srgb,var(--receipt-accent),transparent 60%); border-top:dotted var(--spacing-1-5) color-mix(in srgb,var(--receipt-ink),transparent 12%); }
.ws-receipt { mask:radial-gradient(circle var(--spacing-4) at 0 calc(100% - var(--spacing-12) * 3.1),transparent 98%,var(--ws-prim-neutral-950)) left,radial-gradient(circle var(--spacing-4) at 100% calc(100% - var(--spacing-12) * 3.1),transparent 98%,var(--ws-prim-neutral-950)) right; mask-composite:intersect; }
.ws-receipt .receipt-stub { min-height:calc(var(--spacing-12) * 3.1); }
.ws-receipt .receipt-route { font-family:var(--font-mono); font-weight:600; text-transform:uppercase; font-size:var(--font-size-lg); }
.ws-receipt .receipt-brand { background:var(--receipt-ink); color:var(--ws-prim-neutral-950); padding:var(--spacing-2) var(--spacing-3); border-radius:var(--radius-full); font-size:var(--font-size-sm); font-weight:700; }
.ws-receipt .receipt-brand svg { width:var(--spacing-4); height:var(--spacing-4); color:var(--receipt-accent); }
`;
export function PositionReceipt({ position, showAmounts = false }: { position: PurchasedPosition; showAmounts?: boolean }) {
  const result = receiptResult(position);
  if (!result) return <Text>Position details unavailable.</Text>;
  const { outcome, base, isNo, status, cost, payout, profit } = result;
  const title = base.label === "Yes" || base.label === "No" ? outcome.label : base.label;
  const statusLabel = {open:"Open",won:"Won",lost:"Lost",void:"Voided"}[status];
  const Icon = status === "lost" ? XCircleIcon : CheckCircleIcon;
  return <><style>{receiptCss}</style><VStack as="article" gap={0} className="ws-receipt" data-result={status} aria-label={`${statusLabel} position: ${outcome.label}`}>
    <VStack padding={6} gap={4} style={{padding:"var(--spacing-8)"}}>
      <HStack hAlign="between" vAlign="center" gap={3}>
        <VStack gap={1}><Text className="receipt-label">Category</Text><Text size="sm">WORLDSTREET / PREDICTION</Text></VStack>
        <VStack gap={1} hAlign="end"><Text className="receipt-label">Status</Text><Token label={statusLabel.toUpperCase()} color={status === "won" ? "green" : status === "lost" ? "red" : "purple"}/></VStack>
      </HStack>
      <HStack className="receipt-hero" hAlign="between" vAlign="center" gap={5}>
        <VStack gap={3} style={{minWidth:0}}><Text className="receipt-label">{isNo ? "I’m backing No" : "I’m backing Yes"}</Text><Text className="receipt-name">{title}</Text>{isNo && base.label !== "No" && <Text size="sm">This outcome will not happen</Text>}</VStack>
        {base.participant || position.market.category === "Sports" && ["arsenal","city","liverpool"].includes(base.id) ? <ParticipantMark outcome={base}/> : <TicketIcon className="receipt-symbol"/>}
      </HStack>
      <Text as="p" className="receipt-question">{position.market.question}</Text>
      <Grid columns={showAmounts ? 3 : 2} gap={3} className="receipt-numbers">
        <VStack gap={2} className="receipt-metric"><Text className="receipt-label">Entry price</Text><Text className="receipt-value">{Math.round(position.entryPrice * 100)}¢</Text><Text size="sm">/ share</Text></VStack>
        <VStack gap={2} className="receipt-metric"><Text className="receipt-label">Purchased</Text><Text className="receipt-value">{showAmounts ? usd(cost) : "Private"}</Text></VStack>
        {showAmounts && <VStack gap={2} className="receipt-metric"><Text className="receipt-label">Shares</Text><Text className="receipt-value">{position.shares.toLocaleString()}</Text></VStack>}
      </Grid>
      <HStack hAlign="between" vAlign="center" gap={3} className="receipt-confirmation"><HStack gap={2} vAlign="center"><Icon/><Text size="sm">{status === "open" ? "Purchased outcome" : status === "void" ? "Purchase refunded" : status === "won" ? "Position settled · won" : "Position settled · lost"}</Text></HStack><Text type="code" size="sm">{position.id}</Text></HStack>
    </VStack>
    <VStack className="receipt-stub" gap={3}>
      <HStack hAlign="between" gap={3}><Text className="receipt-route">{isNo ? "NO" : "YES"} → {position.market.league ?? position.market.category}</Text><Text size="sm">{statusLabel.toUpperCase()}</Text></HStack>
      <Text weight="bold" size="xl">{status === "open" ? `${new Date(position.market.closesAt).getUTCFullYear()} · ${position.market.sportType === "Futures" ? "SEASON" : "PREDICTION"}` : status === "void" ? `Refund ${showAmounts ? usd(cost) : "private"}` : `${status === "won" ? "Net gain" : "Net loss"} ${showAmounts ? `${profit! > 0 ? "+" : "−"}${usd(Math.abs(profit!))}` : "private"}`}</Text>
      <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap"><Text size="sm">{status === "open" ? "Awaiting outcome" : `Payout ${showAmounts ? usd(payout!) : "private"}`}</Text><HStack className="receipt-brand" gap={2} vAlign="center"><ArrowTrendingUpIcon/>WorldStreet Prediction</HStack></HStack>
    </VStack>
  </VStack></>;
}
