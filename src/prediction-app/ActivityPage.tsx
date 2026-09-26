import { useState } from "react";
import { LiveOddsTicker } from "../domains/finance/PredictionMarkets";
import { FilterTabs } from "../ui/Table";
import { Chip } from "../ui/Badge";

export function ActivityPage() {
  const [feedState, setFeedState] = useState<"default" | "flash-up" | "flash-down">("default");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              Live Order Flow & Activity Feed
            </h1>
            <Chip size="sm" className="bg-domain-prediction/20 text-domain-prediction font-semibold">Real-Time</Chip>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Continuous ticker stream of order executions, probability flashes, and liquidity movements across all prediction contracts.
          </p>
        </div>

        <FilterTabs
          label="Activity filter"
          options={[
            { value: "default", label: "All Activity" },
            { value: "flash-up", label: "Price Up" },
            { value: "flash-down", label: "Price Down" }
          ]}
          value={feedState}
          onChange={setFeedState}
        />
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface-base p-6">
        <LiveOddsTicker display="feed" state={feedState} />
      </div>
    </div>
  );
}
