import type { PurchasedPosition } from "./predictionCardData";
import { contractOutcome } from "./predictionContracts.ts";
export function receiptResult(position: PurchasedPosition) {
  const outcome = contractOutcome(position.market, position.outcomeId);
  if (!outcome) return null;
  const isNo = position.outcomeId.endsWith("::no") || outcome.label.toLowerCase() === "no";
  const base = position.market.outcomes.find(o => o.id === position.outcomeId.replace(/::no$/, "")) ?? outcome;
  const winner = position.market.winner;
  const won = position.outcomeId.endsWith("::no") ? winner !== base.id : winner === outcome.id;
  const status = position.settlement === "void" ? "void" : winner ? (won ? "won" : "lost") : "open";
  const cost = position.shares * position.entryPrice;
  const payout = status === "open" ? null : status === "void" ? cost : status === "won" ? position.shares : 0;
  return {outcome, base, isNo, status, cost, payout, profit: payout === null ? null : payout - cost} as const;
}
