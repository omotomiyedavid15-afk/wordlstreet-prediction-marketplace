import federalReserveImage from "./assets/federal-reserve.jpg";
import { sportsParticipants } from "./sportsAssets";
import { movieIdentities, partyIdentities, type OutcomeIdentity } from "./outcomeIdentityAssets";

export interface PredictionOutcome {
  id: string;
  label: string;
  probability: number;
  participant?: OutcomeIdentity;
}

export interface IndexCandle { time: number; open: number; high: number; low: number; close: number }
export type SportsMarketType = "Games" | "Props" | "To advance" | "Futures" | "Win totals" | "Awards";
export interface SportsScore { period: string; rows: { score: string; detail?: string; serving?: boolean }[] }

export interface PredictionMarket {
  id: string;
  question: string;
  category: "Crypto" | "Economics" | "Politics" | "Sports" | "Tech" | "Finance" | "Culture" | "Weather" | "Esports" | "Social media";
  symbol?: string;
  image?: string;
  openedAt?: string;
  breaking?: boolean;
  topics?: string[];
  liveDemo?: boolean;
  sportType?: SportsMarketType;
  league?: string;
  subcategory?: string;
  score?: SportsScore;
  priceHistory?: IndexCandle[];
  outcomeHistories?: Record<string, number[]>;
  outcomes: PredictionOutcome[];
  volume: number;
  closesAt: string;
  change: number;
  history: number[];
  rules: string;
  source: { label: string; url: string };
  winner?: string;
}

const binary = (yes: number): PredictionOutcome[] => [
  { id: "yes", label: "Yes", probability: yes },
  { id: "no", label: "No", probability: 100 - yes },
];

export const predictionMarkets: PredictionMarket[] = [
  {
    id: "btc-100k", question: "Will Bitcoin close above $100,000 this year?", category: "Crypto", symbol: "BTC",
    outcomes: binary(72), volume: 2483200, closesAt: "2026-12-31T23:59:00Z", change: 4.2,
    history: [43, 46, 45, 51, 49, 56, 52, 50, 55, 61, 59, 63, 58, 67, 64, 69, 68, 72],
    rules: "Resolves Yes if the Coinbase BTC-USD daily candle closes strictly above $100,000 at 23:59 UTC on December 31, 2026. Otherwise resolves No. If the source is unavailable, settlement is delayed until the closing price is published.",
    source: { label: "Coinbase BTC-USD", url: "https://www.coinbase.com/price/bitcoin" },
  },
  {
    id: "fed", question: "What will the Fed decide in December?", category: "Economics",
    image: federalReserveImage,
    breaking: true,
    outcomeHistories: { cut25: [42,44,41,49,48,53,55,52,58,61], hold: [35,33,36,30,32,29,28,31,28,27], cut50: [17,17,17,15,14,13,12,12,10,9], hike: [6,6,6,6,6,5,5,5,4,3] },
    outcomes: [{ id: "cut25", label: "Cut 25 bps", probability: 61 }, { id: "hold", label: "No change", probability: 27 }, { id: "cut50", label: "Cut 50+ bps", probability: 9 }, { id: "hike", label: "Raise rates", probability: 3 }],
    volume: 1864000, closesAt: "2026-12-09T19:00:00Z", change: 2.1,
    history: [42, 44, 41, 49, 48, 53, 55, 52, 58, 61],
    rules: "Resolves to the change in the upper bound of the federal funds target range announced at the December 2026 scheduled FOMC meeting, compared with the preceding target range. A cancelled meeting resolves to No change.",
    source: { label: "Federal Reserve", url: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm" },
  },
  {
    id: "ng-reform", question: "Will Nigeria pass electoral reform in 2026?", category: "Politics",
    outcomes: binary(38), volume: 342800, closesAt: "2026-12-31T22:59:00Z", change: -3.6,
    history: [55, 52, 51, 57, 48, 44, 46, 41, 43, 38],
    rules: "Resolves Yes if a new amendment to Nigeria's Electoral Act is passed by the National Assembly and signed into law by December 31, 2026, 23:59 WAT. An unsigned bill does not qualify. Otherwise resolves No.",
    source: { label: "National Assembly of Nigeria", url: "https://nass.gov.ng/" },
  },
  {
    id: "eth-5k", question: "Ethereum above $5,000 on December 31?", category: "Crypto", symbol: "ETH",
    outcomes: binary(46), volume: 982450, closesAt: "2026-12-31T23:59:00Z", change: 1.8,
    history: [29, 33, 31, 36, 34, 40, 39, 42, 44, 46],
    rules: "Resolves Yes if the Coinbase ETH-USD daily closing price on December 31, 2026 exceeds $5,000. A price equal to $5,000 resolves No. Source outages delay settlement until publication.",
    source: { label: "Coinbase ETH-USD", url: "https://www.coinbase.com/price/ethereum" },
  },
  {
    id: "football", question: "Who will win the 2026/27 Premier League?", category: "Sports", league: "Premier League", sportType: "Futures",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=160&h=160&fit=crop",
    outcomeHistories: { arsenal: [24,25,28,27,30,29,31,33,32,34], city: [40,39,37,38,35,35,34,32,33,31], liverpool: [25,25,24,24,24,25,24,24,24,24], other: [11,11,11,11,11,11,11,11,11,11] },
    outcomes: [{ id: "arsenal", label: "Arsenal", probability: 34 }, { id: "city", label: "Manchester City", probability: 31 }, { id: "liverpool", label: "Liverpool", probability: 24 }, { id: "other", label: "Another club", probability: 11 }],
    volume: 731600, closesAt: "2027-05-30T18:00:00Z", change: 2.4,
    history: [24, 25, 28, 27, 30, 29, 31, 33, 32, 34],
    rules: "Resolves to the official 2026/27 Premier League champion after the final standings are certified. Another club includes every team not individually listed. A cancelled season without a champion is void and stakes are returned.",
    source: { label: "Premier League", url: "https://www.premierleague.com/" },
  },
  {
    id: "ai", question: "An AI model scores 90% on FrontierMath in 2026?", category: "Tech",
    outcomes: binary(24), volume: 218900, closesAt: "2026-12-31T23:59:00Z", change: -1.2,
    history: [34, 31, 33, 28, 30, 27, 29, 25, 26, 24],
    rules: "Resolves Yes if Epoch AI publishes a verified FrontierMath overall score of at least 90% for any single model before January 1, 2027 UTC. Unverified model-provider claims do not qualify. Otherwise resolves No.",
    source: { label: "Epoch AI", url: "https://epoch.ai/benchmarks/frontiermath" },
  },
];

// Illustrative fixtures for discovery views, not a live odds feed.
predictionMarkets.push(
  {
    id: "gold-3000", question: "Will gold finish the year above $3,000?", category: "Finance", openedAt: "2026-09-22T08:00:00Z",
    image: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=160&h=160&fit=crop",
    outcomes: binary(68), volume: 624000, closesAt: "2026-12-31T23:59:00Z", change: 3.1, history: [42,48,46,52,57,55,62,68],
    rules: "Sample market. Resolves Yes if the final published LBMA Gold Price PM of 2026 exceeds $3,000 per troy ounce. Otherwise No.", source: {label: "LBMA", url: "https://www.lbma.org.uk/"},
  },
  {
    id: "album-chart", question: "An Afrobeats album tops the Billboard 200 in 2026?", category: "Culture", openedAt: "2026-09-21T09:00:00Z",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=160&h=160&fit=crop",
    outcomes: binary(32), volume: 186000, closesAt: "2026-12-31T23:59:00Z", change: 2, history: [18,21,24,22,28,27,30,32],
    rules: "Sample market. Resolves Yes if Billboard identifies an Afrobeats album at number one on a Billboard 200 chart dated in 2026. Otherwise No.", source: {label: "Billboard", url: "https://www.billboard.com/charts/billboard-200/"},
  },
  {
    id: "temperature-record", question: "Will 2026 be the warmest year on record?", category: "Weather", openedAt: "2026-09-20T09:00:00Z", breaking: true,
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=160&h=160&fit=crop",
    outcomes: binary(57), volume: 412000, closesAt: "2027-01-31T23:59:00Z", change: 5, history: [42,44,43,49,51,48,52,57],
    rules: "Sample market. Resolves Yes if NASA GISTEMP ranks calendar year 2026 as the warmest year in its first annual release for that year. A tie also qualifies.", source: {label: "NASA GISTEMP", url: "https://data.giss.nasa.gov/gistemp/"},
  },
  {
    id: "esports-final", question: "Team Amber vs. Team Jade", category: "Esports", openedAt: "2026-09-22T10:00:00Z",
    outcomes: [{id: "amber",label: "Team Amber",probability: 62},{id: "jade",label: "Team Jade",probability: 38}],
    volume: 303000, closesAt: "2026-10-01T18:00:00Z", change: 4, history: [50,52,56,53,59,58,60,62],
    rules: "Fictional matchup for the WorldStreet sandbox. No real event or settlement is attached to this demo market.", source: {label: "WorldStreet demo", url: "https://worldstreet.com/"},
  },
  {
    id: "creator-milestone", question: "MrBeast reaches 500 million YouTube subscribers in 2026?", category: "Social media", openedAt: "2026-09-19T10:00:00Z",
    outcomes: binary(74), volume: 274000, closesAt: "2026-12-31T23:59:00Z", change: 3, history: [52,55,59,62,60,67,71,74],
    rules: "Sample market. Resolves Yes if the public subscriber count on the MrBeast YouTube channel reaches 500 million by the end of 2026 UTC.", source: {label: "YouTube", url: "https://www.youtube.com/@MrBeast"},
  },
  {
    id: "sol-250", question: "Solana above $250 at the end of 2026?", category: "Crypto", symbol: "SOL", openedAt: "2026-09-18T10:00:00Z",
    outcomes: binary(41), volume: 528000, closesAt: "2026-12-31T23:59:00Z", change: -2, history: [52,49,51,47,45,46,43,41],
    rules: "Sample market. Resolves Yes if the Coinbase SOL-USD daily closing price on December 31, 2026 exceeds $250. Otherwise No.", source: {label: "Coinbase SOL-USD", url: "https://www.coinbase.com/price/solana"},
  },
);

// Demo-only category fixtures; these are not current quotes or live event feeds.
const categorySamples: { id: string; question: string; category: PredictionMarket["category"]; topics: string[]; labels: string[]; odds: number[]; participants?: (OutcomeIdentity | undefined)[]; liveDemo?: boolean; sportType?: SportsMarketType; league?: string; score?: SportsScore }[] = [
  { id: "demo-tennis", question: "Nicolai Budkov Kjaer vs Billy Harris", category: "Sports", topics: ["Tennis", "ATP"], labels: ["Nicolai Budkov Kjaer", "Billy Harris"], participants: [sportsParticipants.kjaer, sportsParticipants.harris], odds: [90,10], liveDemo: true, sportType: "Games" },
  { id: "demo-cricket", question: "England vs Sri Lanka", category: "Sports", topics: ["Cricket"], labels: ["England", "Sri Lanka"], participants: [sportsParticipants.england, sportsParticipants.sriLanka], odds: [69,31], liveDemo: true, sportType: "Games" },
  { id: "demo-soccer", question: "Arsenal vs Manchester City", category: "Sports", topics: ["Soccer", "Premier League"], labels: ["Arsenal", "Manchester City"], odds: [56,44], sportType: "Games", league: "Premier League", liveDemo: true, score: { period: "67 min", rows: [{ score: "2" }, { score: "1" }] } },
  { id: "demo-liverpool", question: "Liverpool vs Arsenal", category: "Sports", topics: ["Soccer", "Premier League"], labels: ["Liverpool", "Arsenal"], participants: [sportsParticipants.liverpool, sportsParticipants.arsenal], odds: [48,52], sportType: "Games", league: "Premier League" },
  { id: "demo-prop", question: "Arsenal vs Manchester City: over 2.5 goals?", category: "Sports", topics: ["Soccer", "Premier League"], labels: ["Yes", "No"], odds: [64,36], sportType: "Props", league: "Premier League" },
  { id: "demo-advance", question: "Arsenal to reach the Champions League final?", category: "Sports", topics: ["Soccer", "Champions League"], labels: ["Yes", "No"], odds: [35,65], sportType: "To advance", league: "Champions League" },
  { id: "demo-win-total", question: "Arsenal to win at least 25 league games?", category: "Sports", topics: ["Soccer", "Premier League"], labels: ["Yes", "No"], odds: [58,42], sportType: "Win totals", league: "Premier League" },
  { id: "demo-sports-award", question: "Premier League Golden Boot: winning club?", category: "Sports", topics: ["Soccer", "Premier League"], labels: ["Arsenal", "Manchester City"], odds: [42,58], sportType: "Awards", league: "Premier League" },
  { id: "demo-movie", question: "Which film will lead the year-end box office?", category: "Culture", topics: ["Movies", "Box office"], labels: ["The Odyssey", "Avengers: Doomsday", "Another film"], participants: [movieIdentities.odyssey, movieIdentities.doomsday], odds: [47,35,18] },
  { id: "demo-awards", question: "Oscar winner: Best Picture", category: "Culture", topics: ["Awards", "Oscars"], labels: ["The Odyssey", "Another film"], participants: [movieIdentities.odyssey], odds: [47,53] },
  { id: "demo-inflation", question: "US annual inflation below 3% in December?", category: "Economics", topics: ["Inflation", "Econ weekly"], labels: ["Yes", "No"], odds: [60,40] },
  { id: "demo-congress", question: "Which party will control the US House?", category: "Politics", topics: ["Congress", "Elections", "United States", "International"], labels: ["Democratic Party", "Republican Party"], participants: [partyIdentities.democratic, partyIdentities.republican], odds: [61,39] },
  { id: "demo-nasdaq", question: "Nasdaq-100 above 25,000 at year end?", category: "Finance", topics: ["Indices", "Nasdaq"], labels: ["Yes", "No"], odds: [58,42] },
  { id: "demo-weather", question: "Highest temperature in New York tomorrow?", category: "Weather", topics: ["Daily temperature", "New York"], labels: ["65 to 66 F", "67 to 68 F", "Another range"], odds: [40,35,25] },
];
categorySamples.forEach((sample, index) => {
  const outcomes = sample.labels.map((label, i) => ({ id: label === "Arsenal" ? "arsenal" : label === "Manchester City" ? "city" : `outcome-${i}`, label, probability: sample.odds[i], participant: sample.participants?.[i] }));
  const histories = Object.fromEntries(outcomes.map((outcome, i) => [outcome.id, [sample.odds[i], sample.odds[i], sample.odds[i]]]));
  predictionMarkets.push({ ...sample, outcomes, history: histories[outcomes[0].id], outcomeHistories: histories,
    volume: 120000 + index * 23500, change: 0, closesAt: "2026-12-31T23:59:00Z", openedAt: "2026-09-22T10:00:00Z",
    rules: "Illustrative sandbox market only. Names, probabilities, and event states are sample data; this fixture is not linked to a real event or settlement source.",
    source: { label: "WorldStreet sandbox", url: "https://worldstreet.com/" },
  });
});

const tennisDemo = predictionMarkets.find(m => m.id === "demo-tennis")!;
tennisDemo.league = "ATP Challenger";
tennisDemo.score = { period: "Set 2", rows: [{ score: "4", detail: "40", serving: true }, { score: "3", detail: "30" }] };
const cricketDemo = predictionMarkets.find(m => m.id === "demo-cricket")!;
cricketDemo.league = "ODI Cricket";
cricketDemo.score = { period: "32.4 overs", rows: [{ score: "186/4" }, { score: "182" }] };

// Illustrative OHLC prices, separate from contract probabilities.
const nasdaqSample = predictionMarkets.find(m => m.id === "demo-nasdaq")!;
nasdaqSample.priceHistory = [
  [24880,24935,24862,24920], [24920,24958,24905,24946], [24946,24962,24916,24928],
  [24928,24975,24920,24968], [24968,25012,24950,24996], [24996,25005,24957,24972],
  [24972,24990,24948,24960], [24960,24988,24945,24982], [24982,25024,24972,25016],
  [25016,25036,24996,25008], [25008,25028,24987,25014], [25014,25055,25000,25042],
  [25042,25062,25020,25054], [25054,25068,24998,25006], [25006,25017,24960,24976],
  [24976,25005,24954,24994], [24994,25018,24982,25002], [25002,25012,24976,24988],
  [24988,25009,24971,25004], [25004,25024,24995,25018],
].map(([open,high,low,close],i) => ({ time: Date.UTC(2026,8,22,14,i*5), open,high,low,close }));

export interface PredictionTrader { id: string; name: string; winRate: number; profit: number; positions: number; badge: string }
export const predictionTraders: PredictionTrader[] = [
  { id: "1", name: "Ada Okafor", winRate: 81, profit: 18420, positions: 24, badge: "Consistent" },
  { id: "2", name: "Tunde Markets", winRate: 76, profit: 15280, positions: 18, badge: "Top 1%" },
  { id: "3", name: "Zara Chen", winRate: 79, profit: 12940, positions: 31, badge: "Early call" },
  { id: "4", name: "David Cole", winRate: 72, profit: 10460, positions: 12, badge: "Macro" },
  { id: "5", name: "Nneka Obi", winRate: 74, profit: 9810, positions: 16, badge: "Top 5%" },
  { id: "6", name: "Sam Rivers", winRate: 68, profit: 7450, positions: 21, badge: "Sports" },
  { id: "7", name: "Maya Patel", winRate: 71, profit: 6820, positions: 14, badge: "Consistent" },
];

export interface PredictionActivity { id: string; trader: string; market: string; outcome: string; side: "bought" | "sold"; amount: number; probability: number; change: number; secondsAgo: number }
export const predictionActivity: PredictionActivity[] = [
  { id: "a1", trader: "Ada Okafor", market: "Bitcoin above $100k", outcome: "Yes", side: "bought", amount: 420, probability: 72, change: 4.2, secondsAgo: 2 },
  { id: "a2", trader: "Zara Chen", market: "Fed decision", outcome: "Cut 25 bps", side: "bought", amount: 1250, probability: 61, change: 2.1, secondsAgo: 18 },
  { id: "a3", trader: "David Cole", market: "Electoral reform", outcome: "Yes", side: "sold", amount: 180, probability: 38, change: -3.6, secondsAgo: 36 },
  { id: "a4", trader: "Nneka Obi", market: "Ethereum above $5k", outcome: "Yes", side: "bought", amount: 680, probability: 46, change: 1.8, secondsAgo: 54 },
];

export const resolvedMarket: PredictionMarket = { ...predictionMarkets[0], id: "btc-settled", question: "Bitcoin above $60,000 on June 30?", closesAt: "2026-06-30T23:59:00Z", outcomes: binary(100), winner: "yes", rules: "Illustrative settled market. The closing price exceeded the $60,000 threshold; Yes shares settle at $1 and No shares at $0." };

// Additional match fixtures for sport-specific market screens.
predictionMarkets.push(...([
  ["demo-baseball", "Minnesota vs San Francisco", "Baseball", "MLB", "Minnesota", "San Francisco", "2", "2", "Top 7th", "timberwolves", "city"],
  ["demo-basketball", "Boston Celtics vs Los Angeles Lakers", "Basketball", "NBA", "Boston Celtics", "Los Angeles Lakers", "84", "79", "Q3 · 4:32", "celtics", "lakers"],
  ["demo-nfl", "Kansas City Chiefs vs Buffalo Bills", "American football", "NFL", "Kansas City Chiefs", "Buffalo Bills", "21", "17", "Q3 · 8:14", "chiefs", "bills"],
  ["demo-hockey", "Edmonton Oilers vs Florida Panthers", "Hockey", "NHL", "Edmonton Oilers", "Florida Panthers", "2", "1", "P2 · 12:08", "oilers", "sixers"],
] as const).map(([id, question, sport, league, first, second, a, b, period, homeId, awayId]): PredictionMarket => ({
  id, question, category: "Sports", sportType: "Games", topics: [sport, league], league, liveDemo: true,
  outcomes: [{id: homeId, label: first, probability: 57, participant: sportsParticipants[homeId]}, {id: awayId, label: second, probability: 43, participant: sportsParticipants[awayId]}],
  score: {period, rows: [{score:a}, {score:b}]}, volume: 7775221, change: 3,
  history: [49,51,47,54,59,62,56,58,51,48,52,55,57],
  outcomeHistories: {[homeId]:[49,51,47,54,59,62,56,58,51,48,52,55,57], [awayId]:[51,49,53,46,41,38,44,42,49,52,48,45,43]},
  closesAt: "2026-09-26T23:59:00Z", rules: "Illustrative match. Winner includes overtime or extra innings. An abandoned event is void and the purchase cost returned. Sample prices and scores; no live settlement feed.",
  source: {label: "WorldStreet sandbox", url: "https://worldstreet.com/"},
})));
// Regulation-time football has three mutually exclusive results.
for (const id of ["demo-soccer", "demo-liverpool"]) {
  const match = predictionMarkets.find(m => m.id === id)!;
  match.outcomes[0].probability = 48;
  match.outcomes[1].probability = 30;
  match.outcomes.push({id:"draw",label:"Draw",probability:22});
  match.history = [38,41,39,45,43,49,46,48];
  match.outcomeHistories = { [match.outcomes[0].id]: match.history, [match.outcomes[1].id]: [37,34,36,32,34,29,32,30], draw: [25,25,25,23,23,22,22,22] };
  match.rules = "Sample match-winner market. Resolves to the team leading after 90 minutes plus stoppage time, or Draw if level. Extra time and penalties are excluded. A No contract wins if its named result does not occur. An abandoned match is void and the purchase cost returned.";
}
