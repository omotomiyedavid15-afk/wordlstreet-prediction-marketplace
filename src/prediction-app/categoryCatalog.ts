import type { PredictionMarket } from "../domains/finance/predictionData";

export type MarketGroup = { label: string; children?: string[] };
export const categoryGroups: Record<string, MarketGroup[]> = {
  Politics: [{ label: "Congress" }, { label: "International", children: ["Nigeria", "United States", "Europe"] }, { label: "Local" }, { label: "Recurring" }, { label: "Courts" }, { label: "Elections" }],
  Culture: [{ label: "Movies", children: ["Box office", "Rotten Tomatoes"] }, { label: "Music", children: ["Music industry", "Music charts", "New music", "Live music"] }, { label: "Awards", children: ["Oscars", "Grammys", "VMA"] }, { label: "Collectibles" }, { label: "People" }, { label: "Television", children: ["Reality TV", "Streaming"] }, { label: "Video games" }],
  Crypto: [{ label: "15 min" }, { label: "Hourly" }, { label: "Daily" }, { label: "Weekly" }, { label: "Monthly" }, { label: "Annual" }, { label: "BTC", children: ["BTC price", "BTC milestones"] }, { label: "ETH", children: ["ETH price", "ETH milestones"] }, { label: "SOL", children: ["SOL price"] }],
  Finance: [{ label: "Public companies" }, { label: "Indices", children: ["S&P 500", "Nasdaq"] }, { label: "Foreign exchange" }, { label: "Interest rates" }, { label: "Company news", children: ["Earnings", "Mergers"] }, { label: "Metals", children: ["Gold", "Silver"] }],
  Economy: [{ label: "Econ daily" }, { label: "Econ weekly" }, { label: "Fed" }, { label: "GDP" }, { label: "Global central banks" }, { label: "Growth" }, { label: "Housing" }, { label: "Inflation" }, { label: "Jobs & economy" }, { label: "Oil and energy" }],
  Sports: [{ label: "Football", children: ["NFL", "NCAA Football"] }, { label: "Tennis", children: ["ATP", "WTA"] }, { label: "Baseball" }, { label: "Soccer", children: ["Premier League", "Champions League"] }, { label: "Basketball", children: ["NBA", "WNBA"] }, { label: "Golf" }, { label: "MMA" }, { label: "Cricket" }, { label: "Motorsport" }, { label: "Hockey" }],
  Esports: [{ label: "Counter-Strike" }, { label: "Dota 2" }, { label: "League of Legends" }, { label: "Valorant" }],
  Tech: [{ label: "Artificial intelligence", children: ["Benchmarks", "Model releases"] }, { label: "Space" }, { label: "Companies" }, { label: "Science" }],
  Weather: [{ label: "Daily temperature", children: ["New York", "Los Angeles", "Miami"] }, { label: "Climate" }, { label: "Hurricanes" }, { label: "Rainfall" }],
  "Social media": [{ label: "YouTube" }, { label: "Instagram" }, { label: "TikTok" }, { label: "Creators" }, { label: "Mentions" }],
};

const topics: Record<string, string[]> = {
  "btc-100k": ["Annual", "BTC", "BTC price", "BTC milestones"], "eth-5k": ["Annual", "ETH", "ETH price", "ETH milestones"], "sol-250": ["Annual", "SOL", "SOL price"],
  fed: ["Fed", "Interest rates"], "ng-reform": ["International", "Nigeria", "Elections"], football: ["Soccer", "Premier League", "Futures"],
  ai: ["Artificial intelligence", "Benchmarks"], "gold-3000": ["Metals", "Gold"], "album-chart": ["Music", "Music charts"],
  "temperature-record": ["Climate"], "esports-final": ["Counter-Strike"], "creator-milestone": ["YouTube", "Creators"],
};
export const hasMarketGroup = (market: PredictionMarket, group: string) => !group || [...(topics[market.id] ?? []), ...(market.topics ?? [])].includes(group);
export const isCategoryMarket = (market: PredictionMarket, category: string) => market.category === (category === "Economy" ? "Economics" : category);
