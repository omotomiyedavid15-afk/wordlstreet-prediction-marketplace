import { useState } from "react";
import { Link } from "react-router";
import {
  BanknotesIcon
} from "@heroicons/react/24/outline";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Badge";
import { FilterTabs } from "../ui/Table";
import { MarketResolutionCard } from "../domains/finance/PredictionMarkets";
import { resolvedMarket } from "../domains/finance/predictionData";
import { usePrediction } from "./PredictionContext";

export function PortfolioPage() {
  const { balance, positions, tradeHistory, claimableWinnings, claimWinnings } = usePrediction();
  const [tab, setTab] = useState("active");

  const totalPositionsValue = positions.reduce((acc, p) => acc + (p.shares * p.currentPrice), 0);
  const totalCost = positions.reduce((acc, p) => acc + (p.shares * p.avgPrice), 0);
  const unrealizedPnL = totalPositionsValue - totalCost;

  return (
    <div className="space-y-8">
      {/* Portfolio Overview Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">Positions & Portfolio</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your open binary contracts, settlement claims, and historical trade receipts.
          </p>
        </div>

        {claimableWinnings > 0 && (
          <Button
            variant="primary"
            prefixIcon={BanknotesIcon}
            onClick={() => claimWinnings("btc-settled", claimableWinnings)}
          >
            Claim ${claimableWinnings.toFixed(2)} Winnings
          </Button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border-subtle bg-surface-base p-5">
          <span className="text-xs text-text-tertiary">Available Wallet Balance</span>
          <p className="mt-1 font-mono text-2xl font-bold text-text-primary">
            ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface-base p-5">
          <span className="text-xs text-text-tertiary">Active Positions Value</span>
          <p className="mt-1 font-mono text-2xl font-bold text-text-primary">
            ${totalPositionsValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface-base p-5">
          <span className="text-xs text-text-tertiary">Unrealized P&L</span>
          <p className={`mt-1 font-mono text-2xl font-bold ${unrealizedPnL >= 0 ? "text-feedback-success" : "text-feedback-danger"}`}>
            {unrealizedPnL >= 0 ? "+" : ""}${unrealizedPnL.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface-base p-5">
          <span className="text-xs text-text-tertiary">Claimable Settlements</span>
          <p className="mt-1 font-mono text-2xl font-bold text-action-primary-text">
            ${claimableWinnings.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <FilterTabs
        label="Portfolio tab"
        options={[
          { value: "active", label: `Active Positions (${positions.length})` },
          { value: "settlements", label: "Settlements & Claims" },
          { value: "history", label: `Trade History (${tradeHistory.length})` }
        ]}
        value={tab}
        onChange={setTab}
      />

      {/* Tab 1: Active Positions */}
      {tab === "active" && (
        <section aria-label="Active Positions Table">
          {positions.length === 0 ? (
            <div className="rounded-xl border border-border-subtle bg-surface-base py-12 text-center">
              <p className="text-sm text-text-secondary">No active positions held.</p>
              <Link to="/" className="mt-3 inline-block">
                <Button variant="primary">Browse Prediction Markets</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface-base">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border-subtle font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                    <th className="px-5 py-3">Market / Contract</th>
                    <th className="px-5 py-3">Outcome</th>
                    <th className="px-5 py-3">Shares</th>
                    <th className="px-5 py-3">Avg Price</th>
                    <th className="px-5 py-3">Current Price</th>
                    <th className="px-5 py-3">Value</th>
                    <th className="px-5 py-3">P&L</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {positions.map(p => {
                    const value = p.shares * p.currentPrice;
                    const cost = p.shares * p.avgPrice;
                    const pnl = value - cost;
                    return (
                      <tr key={p.id} className="hover:bg-surface-raised/40">
                        <td className="px-5 py-4 font-semibold text-text-primary max-w-[280px]">
                          <Link to={`/market/${p.marketId}`} className="hover:underline">
                            {p.marketTitle}
                          </Link>
                        </td>
                        <td className="px-5 py-4">
                          <Chip className="bg-domain-prediction/20 text-domain-prediction font-semibold">
                            {p.outcomeLabel}
                          </Chip>
                        </td>
                        <td className="px-5 py-4 font-mono">{p.shares}</td>
                        <td className="px-5 py-4 font-mono">${p.avgPrice.toFixed(2)}</td>
                        <td className="px-5 py-4 font-mono">${p.currentPrice.toFixed(2)}</td>
                        <td className="px-5 py-4 font-mono font-semibold">${value.toFixed(2)}</td>
                        <td className={`px-5 py-4 font-mono font-semibold ${pnl >= 0 ? "text-feedback-success" : "text-feedback-danger"}`}>
                          {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link to={`/market/${p.marketId}`}>
                            <Button size="sm" variant="secondary">Trade / Close</Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Settlements & Claims */}
      {tab === "settlements" && (
        <section aria-label="Settlement & Claims Cards" className="space-y-6">
          <div className="rounded-xl border border-border-subtle bg-surface-base p-5">
            <h3 className="text-base font-semibold text-text-primary">Contract Settlement Overview</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Settled markets remove active trading and award winning Yes/No shares at $1.00 per share. Disputed claims are held during the appeal window.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MarketResolutionCard
              market={resolvedMarket}
              status="settled-winner"
              shares={350}
              cost={217}
              onClaim={async () => claimWinnings(resolvedMarket.id, claimableWinnings)}
            />
            <MarketResolutionCard
              market={{ ...resolvedMarket, id: "mkt-loser", question: "Fed Rate Above 5.5% on Dec 31?" }}
              status="settled-loser"
              shares={100}
              cost={45}
            />
            <MarketResolutionCard
              market={{ ...resolvedMarket, id: "mkt-disputed", question: "US GDP Growth Above 3.0% in Q3?" }}
              status="disputed"
              appealEndsAt={Date.now() + 86400000}
            />
          </div>
        </section>
      )}

      {/* Tab 3: Trade History */}
      {tab === "history" && (
        <section aria-label="Trade History Log" className="space-y-4">
          <div className="grid gap-4">
            {tradeHistory.map(t => (
              <div key={t.id} className="rounded-xl border border-border-subtle bg-surface-base p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <Chip size="sm" className={t.side === "buy" ? "bg-feedback-success/20 text-feedback-success" : "bg-feedback-danger/20 text-feedback-danger"}>
                      {t.side.toUpperCase()}
                    </Chip>
                    <span className="font-mono text-xs text-text-tertiary">Ref: {t.id}</span>
                  </div>
                  <span className="font-mono text-xs text-text-tertiary">
                    {new Date(t.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-text-primary text-sm">{t.marketTitle}</h4>
                    <p className="mt-1 text-xs text-text-secondary">
                      Outcome: <strong className="text-text-primary">{t.outcomeLabel}</strong> • Order: {t.orderType}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-base font-bold text-text-primary">${t.total.toFixed(2)}</span>
                    <p className="font-mono text-xs text-text-tertiary">{t.shares} shares @ ${t.price.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
