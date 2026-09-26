import { useState, type CSSProperties } from "react";
import { Link } from "react-router";
import { BookmarkIcon, LinkIcon, ArrowTopRightOnSquareIcon, CpuChipIcon, BuildingLibraryIcon, TrophyIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as SavedIcon } from "@heroicons/react/24/solid";
import { cryptoLogo } from "../ui/logos";
import { IconButton } from "../ui/Button";
import type { ChartSeries } from "../ui/Charts";
import { RosenProbabilityChart } from "./RosenProbabilityChart";
import { IndexCandlestickChart } from "./IndexCandlestickChart";
import { ProgressBar } from "../ui/Progress";
import { PredictionOutcomeButton, outcomeAppearance } from "../domains/finance/PredictionOutcomeButton";
import { ParticipantMark } from "../domains/finance/ParticipantMark";
import { leagueImages, marketLabel } from "../domains/finance/marketLabels";
import type { PredictionMarket } from "../domains/finance/predictionData";

export const marketVolume = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
type Props = { market: PredictionMarket; saved: boolean; onSave: () => void; onTrade: (outcome: string) => void };

export function MarketIdentity({ market }: { market: PredictionMarket }) {
  const [failed, setFailed] = useState<string | null>(null);
  const logo = leagueImages[marketLabel(market)] ?? market.image ?? (market.symbol ? cryptoLogo(market.symbol) : undefined);
  const Icon = market.category === "Tech" ? CpuChipIcon : market.category === "Sports" ? TrophyIcon : market.category === "Economics" ? BuildingLibraryIcon : GlobeAltIcon;
  return <figure className="board-mark" data-category={market.category}>{logo && failed !== logo ? <img src={logo} alt="" loading="lazy" onError={() => setFailed(logo)} /> : <Icon aria-hidden="true" />}</figure>;
}
function Save({ saved, onSave }: Pick<Props, "saved" | "onSave">) {
  return <IconButton size="sm" variant={saved ? "tonal" : "ghost"} icon={saved ? SavedIcon : BookmarkIcon} onClick={onSave} aria-pressed={saved} label={saved ? "Unsave market" : "Save market"} />;
}
export function MarketBoardCard({ market, saved, onSave, onTrade }: Props) {
  return <article className="board-market" data-market-card={market.id} data-live={market.liveDemo || undefined} data-sport={market.category === "Sports" || undefined}>
    <header className="board-card-category"><MarketIdentity market={market}/><p>{marketLabel(market)}</p>{market.sportType && <small>{market.sportType}</small>}</header>
    <section className="board-card-heading">
      <h3><Link to={"/market/" + market.id}>{market.question}</Link></h3>
      {market.liveDemo ? <p className="market-live"><i aria-hidden="true"/>LIVE <small>Demo event</small></p> : <time dateTime={market.closesAt}>{new Date(market.closesAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</time>}
    </section>
    <section className="board-contracts" aria-label="Market outcomes">{market.outcomes.slice(0, 2).map(outcome => {
      const appearance = outcomeAppearance(market, outcome.id);
      return <section className="board-contract-row" key={outcome.id} style={{ "--outcome-color": appearance.color } as CSSProperties}>
        <ParticipantMark outcome={outcome}/>
        <section className="board-contract-label"><p>{outcome.label}</p>
          <ProgressBar className="board-probability" value={outcome.probability} size="sm" aria-label={outcome.label + " probability"} />
        </section>
        {market.score && <abbr className="board-score" title={`${outcome.label} score`}>{market.score.rows[market.outcomes.indexOf(outcome)]?.score}</abbr>}
        <abbr className="board-multiple" title="Gross payout per dollar at this price, before fees">{outcome.probability ? (100 / outcome.probability).toFixed(2) + "x" : "-"}</abbr>
        <PredictionOutcomeButton market={market} outcomeId={outcome.id} appearance="outline" size="md" shape="pill"
          onClick={() => onTrade(outcome.id)} aria-label={"Buy " + outcome.label + " at " + outcome.probability + " cents"}>{outcome.probability}%</PredictionOutcomeButton>
      </section>;
    })}</section>
    <footer><small>{marketVolume(market.volume)} vol</small><Link to={"/market/" + market.id}>{market.outcomes.length} outcomes</Link><Save saved={saved} onSave={onSave}/></footer>
  </article>;
}
export function FeaturedMarket({ market, saved, onSave, onTrade }: Props) {
  const [shareStatus, setShareStatus] = useState("");
  // All series are explicit sample data, with a complementary line only for binary markets.
  const series: ChartSeries[] = market.outcomeHistories
    ? market.outcomes.map(o => ({ id: o.id, label: o.label, values: market.outcomeHistories![o.id], color: outcomeAppearance(market, o.id).color }))
    : [{ id: market.outcomes[0].id, label: market.outcomes[0].label, values: market.history, color: outcomeAppearance(market, market.outcomes[0].id).color }];
  if (!market.outcomeHistories && market.outcomes.length === 2) series.push({ id: market.outcomes[1].id, label: market.outcomes[1].label, values: market.history.map(p => 100 - p), color: outcomeAppearance(market, market.outcomes[1].id).color });
  const labels = market.history.map((_, i) => new Date(Date.UTC(2026, 8, 22 - market.history.length + 1 + i)).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }));
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(new URL("/market/" + market.id, window.location.origin).href); setShareStatus("Link copied"); }
    catch { setShareStatus("Could not copy link. Open the market to share its URL."); }
  };
  return <article className="board-featured" data-live={market.liveDemo || undefined}>
    <header><MarketIdentity market={market}/><section><p>{marketLabel(market)} · Featured</p><h2><Link to={"/market/" + market.id}>{market.question}</Link></h2></section>
      <IconButton icon={LinkIcon} label="Copy market link" onClick={copyLink}/><Save saved={saved} onSave={onSave}/></header>
    <section className="board-featured-body">
      <section className="board-featured-details" aria-label="Featured outcomes">
        <header className="featured-column-labels"><p>Market</p><p>Pays out</p><p>Odds</p></header>
        <section className="featured-contracts">{market.outcomes.slice(0, 4).map(outcome =>
          <section className="board-contract-row" key={outcome.id} style={{ "--outcome-color": outcomeAppearance(market, outcome.id).color } as CSSProperties}>
            <ParticipantMark outcome={outcome}/>
            <section className="board-contract-label"><p>{outcome.label}</p><ProgressBar className="board-probability" value={outcome.probability} size="sm" aria-label={outcome.label + " probability"}/></section>
            <abbr className="board-multiple" title="Gross payout per dollar before fees">{outcome.probability ? (100 / outcome.probability).toFixed(2) + "x" : "-"}</abbr>
            <PredictionOutcomeButton market={market} outcomeId={outcome.id} appearance="outline" shape="pill" onClick={() => onTrade(outcome.id)} aria-label={"Buy " + outcome.label + " at " + outcome.probability + " cents"}>{outcome.probability}%</PredictionOutcomeButton>
          </section>
        )}</section>
        <section className="board-resolution"><p>Resolution source</p><a href={market.source.url} target="_blank" rel="noreferrer">{market.source.label}<ArrowTopRightOnSquareIcon aria-hidden="true"/></a><p>{market.rules}</p><Link to={"/market/" + market.id}>Read full rules</Link></section>
      </section>
      <section className="board-featured-chart" aria-label={market.priceHistory ? "Index price history" : "Probability history"}>{market.priceHistory
        ? <IndexCandlestickChart key={market.id} candles={market.priceHistory} name={market.topics?.includes("Nasdaq") ? "Nasdaq-100" : "Index"}/>
        : <RosenProbabilityChart key={market.id} series={series} labels={labels} summary={market.question + " Sample probability history"}/>}</section>
    </section>
    <footer><small>{marketVolume(market.volume)} Vol.</small><small role="status">{shareStatus || "Sample market"}</small><small>WorldStreet</small></footer>
  </article>;
}
