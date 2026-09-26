import type { PredictionMarket } from "./predictionData";
import premierLeague from "./assets/premier-league.jpeg";

export const leagueImages: Record<string, string> = { "Premier League": premierLeague };

const labels: Record<string, string> = {
  "btc-100k": "Bitcoin", "eth-5k": "Ethereum", "sol-250": "Solana", fed: "Federal Reserve",
  "ng-reform": "Nigeria elections", ai: "AI benchmarks", "gold-3000": "Gold",
  "album-chart": "Music charts", "temperature-record": "Global climate",
  "creator-milestone": "YouTube", "esports-final": "Counter-Strike",
};
export const marketLabel = (market: PredictionMarket) => market.league ?? market.subcategory ?? labels[market.id] ?? market.topics?.[0] ?? market.symbol ?? market.category;
