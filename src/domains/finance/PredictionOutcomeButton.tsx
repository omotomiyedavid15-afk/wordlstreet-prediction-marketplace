import type { ComponentProps, CSSProperties } from "react";
import { Button } from "../../ui/Button";
import { clubAssets } from "./sportsAssets";
import type { PredictionMarket } from "./predictionData";

const palette = [
  { color: "var(--ws-feedback-success)", ink: "var(--ws-tonal-success-text)" },
  { color: "var(--ws-feedback-info)", ink: "var(--ws-tonal-info-text)" },
  { color: "var(--ws-feedback-danger)", ink: "var(--ws-tonal-error-text)" },
  { color: "var(--ws-action-primary-default)", ink: "var(--ws-action-primary-text)" },
];

export function outcomeAppearance(market: PredictionMarket, outcomeId: string) {
  const club = market.category === "Sports" ? clubAssets[outcomeId] : undefined;
  if (club) return { color: club.color, ink: club.ink };
  if (outcomeId === "yes") return palette[0];
  if (outcomeId === "no") return palette[2];
  return palette[Math.max(0, market.outcomes.findIndex(o => o.id === outcomeId)) % palette.length];
}

export function PredictionOutcomeButton({ market, outcomeId, appearance = "tonal", className = "", style, ...props }: {
  market: PredictionMarket;
  outcomeId: string;
  appearance?: "tonal" | "outline";
} & ComponentProps<typeof Button>) {
  const club = market.category === "Sports" ? clubAssets[outcomeId] : undefined;
  const color = club?.color ?? "var(--ws-action-primary-default)";
  const ink = club?.ink ?? "var(--ws-action-primary-text)";
  return <Button {...props} variant="tonal" className={`pm-outcome-action ${className}`} data-appearance={appearance}
    style={{ "--outcome-color": color, "--outcome-ink": ink, ...style } as CSSProperties} />;
}
