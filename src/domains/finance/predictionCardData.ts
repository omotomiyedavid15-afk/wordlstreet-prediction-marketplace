import { predictionMarkets, type PredictionMarket } from "./predictionData";

// Illustrative candidates and prices, never a live election forecast.
export const candidateMarket: PredictionMarket = {
  id: "demo-election", question: "Who will win the next US presidential election?", category: "Politics",
  outcomes: [{ id: "reed", label: "Morgan Reed", probability: 42 }, { id: "chen", label: "Alex Chen", probability: 31 }, { id: "ellis", label: "Jordan Ellis", probability: 18 }, { id: "other", label: "Other candidates", probability: 9 }],
  volume: 1248000, closesAt: "2028-11-08T12:00:00Z", change: 4,
  history: [34, 36, 35, 38, 40, 39, 42],
  rules: "Demonstration only. All named candidates are fictional. In production, resolve to the certified election winner; Other candidates includes all unlisted candidates. These mutually exclusive outcomes form one complete market.",
  source: { label: "US election process", url: "https://www.usa.gov/presidential-election" },
};

export const candidateHistories = [
  [34, 36, 35, 38, 40, 39, 42], [36, 34, 35, 33, 31, 32, 31],
  [20, 21, 20, 19, 19, 19, 18], [10, 9, 10, 10, 10, 10, 9],
];

export const mentionsMarket: PredictionMarket = {
  id: "demo-mentions", question: "What will be mentioned at the next tech keynote?", category: "Tech",
  outcomes: [{ id: "agents", label: "AI agents", probability: 88 }, { id: "privacy", label: "Privacy", probability: 74 }, { id: "open", label: "Open source", probability: 52 }, { id: "robotics", label: "Robotics", probability: 28 }, { id: "quantum", label: "Quantum", probability: 12 }],
  volume: 186200, closesAt: "2026-10-01T18:00:00Z", change: 3,
  history: [72, 75, 74, 80, 83, 85, 88],
  rules: "Illustrative keynote market. Each topic is a separate Yes/No contract and can resolve independently. A topic must be explicitly spoken during the main keynote, according to the official recording. Multiple topics may resolve Yes; probabilities do not sum to 100%.",
  source: { label: "Demo resolution source", url: "https://www.worldstreet.com" },
};

export const momentumMarket: PredictionMarket = {
  ...predictionMarkets[0], id: "btc-weekly-demo", question: "Bitcoin above $100,000 at year-end?",
  outcomes: [{ id: "yes", label: "Yes", probability: 70 }, { id: "no", label: "No", probability: 30 }],
  history: [40, 50, 60, 50, 60, 60, 70], change: 30,
};

export { clubAssets } from "./sportsAssets";

export interface PurchasedPosition {
  id: string;
  market: PredictionMarket;
  outcomeId: string;
  shares: number;
  entryPrice: number;
  settlement?: "void";
}

export const demoPositions: PurchasedPosition[] = [
  { id: "WS-0148", market: predictionMarkets[4], outcomeId: "arsenal", shares: 250, entryPrice: .32 },
  { id: "WS-0149", market: predictionMarkets[0], outcomeId: "yes", shares: 100, entryPrice: .68 },
  { id: "WS-0150", market: candidateMarket, outcomeId: "reed", shares: 200, entryPrice: .38 },
];
