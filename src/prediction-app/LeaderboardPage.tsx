import { PredictionLeaderboard } from "../domains/finance/PredictionMarkets";
import { Chip } from "../ui/Badge";

export function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Forecaster Rankings
          </h1>
          <Chip size="sm" className="bg-domain-prediction/20 text-domain-prediction font-semibold">Global Leaderboard</Chip>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          Track top prediction market forecasters, win rates, earnings, and historical accuracy.
        </p>
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface-base p-5">
        <PredictionLeaderboard variant="global" />
      </div>
    </div>
  );
}
