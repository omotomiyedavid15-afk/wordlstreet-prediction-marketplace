import type { PredictionMarket, PredictionOutcome } from "./predictionData";

export const isBinaryMarket = (market: PredictionMarket) => market.outcomes.length === 2 && market.outcomes[0].label.toLowerCase() === "yes" && market.outcomes[1].label.toLowerCase() === "no";
export function contractOutcome(market: PredictionMarket, id: string): PredictionOutcome | undefined {
  const direct = market.outcomes.find(o => o.id === id);
  if (direct) return direct;
  if (!id.endsWith("::no")) return undefined;
  const base = market.outcomes.find(o => o.id === id.slice(0,-4));
  return base ? { ...base, id, label: `No - ${base.label}`, probability: 100 - base.probability } : undefined;
}
