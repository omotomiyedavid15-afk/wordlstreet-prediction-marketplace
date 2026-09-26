import { PredictionBetSlip } from "../domains/finance/PredictionMarkets";
import type { PredictionMarket } from "../domains/finance/predictionData";
import { usePrediction } from "./PredictionContext";

export function PredictionTradeTicket({ market, initialOutcome }: { market: PredictionMarket; initialOutcome?: string }) {
  const { balance, fundingAssets, positions, tradeHistory, executeTrade } = usePrediction();
  const holdings: Record<string, number> = {};
  positions.filter(p => p.marketId === market.id).forEach(p => { holdings[p.outcomeId] = (holdings[p.outcomeId] ?? 0) + p.shares; });
  tradeHistory.filter(t => t.marketId === market.id && t.outcomeId && t.side === "sell" && t.status === "pending").forEach(t => { holdings[t.outcomeId!] = Math.max(0, (holdings[t.outcomeId!] ?? 0) - t.shares); });
  return <PredictionBetSlip key={market.id + initialOutcome} market={market} initialOutcome={initialOutcome} balance={balance} fundingAssets={fundingAssets} holdings={holdings}
    onSubmit={async order => executeTrade(market, order.outcomeId, order.side, order.orderType, order.shares, order.price, order.funding)}/>;
}
