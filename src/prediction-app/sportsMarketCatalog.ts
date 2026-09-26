import { predictionMarkets, type PredictionMarket } from "../domains/finance/predictionData";

export interface SportsContract { group: string; section: string; label: string; market: PredictionMarket }
type Spec = [string, string, string, number];
export function sportOf(market: PredictionMarket) {
  const tags = `${market.league ?? ""} ${market.topics?.join(" ") ?? ""}`;
  if (/baseball|MLB/i.test(tags)) return "Baseball";
  if (/basketball|NBA/i.test(tags)) return "Basketball";
  if (/cricket/i.test(tags)) return "Cricket";
  if (/tennis|ATP/i.test(tags)) return "Tennis";
  if (/NFL|American football/i.test(tags)) return "American football";
  if (/hockey|NHL/i.test(tags)) return "Hockey";
  return "Football";
}
export function sportsContracts(event: PredictionMarket): SportsContract[] {
  if (event.category !== "Sports" || event.sportType !== "Games") return [];
  const team = event.outcomes[0].label;
  const sport = sportOf(event);
  const specs: Record<string, Spec[]> = {
    Football: [
      ["Game lines", "Goals", "Over 2.5 goals", 72], ["Game lines", "Goals", "Over 3.5 goals", 38], ["Game lines", "Goals", "Both teams to score", 81],
      ["Game lines", "Handicap", `${team} wins by over 1.5 goals`, 34],
      ["Game lines", "Cards", "A red card in the match", 18], ["Game lines", "Cards", "Over 4.5 yellow cards", 46],
      ["Game lines", "Corners", "Over 9.5 corners", 57],
      ["Player props", "Goalscorers", "Bukayo Saka to score", 42], ["Player props", "Goalscorers", "Erling Haaland to score", 61],
      ["Player props", "Shots", "Bukayo Saka over 1.5 shots on target", 54],
      ["Periods", "First half", "Over 1.5 first-half goals", 55], ["Periods", "Second half", `${team} to win the second half`, 48],
    ],
    Baseball: [
      ["Game lines", "Run line", `${team} wins by over 1.5 runs`, 39], ["Game lines", "Total runs", "Over 6.5 runs", 53], ["Game lines", "Total runs", "Over 7.5 runs", 37],
      ["Player props", "Batting", "Byron Buxton to record a hit", 68], ["Player props", "Pitching", "Logan Webb over 5.5 strikeouts", 57],
      ["Innings", "First 5 innings", `${team} to lead after 5 innings`, 46], ["Innings", "First inning", "A run scored in the first inning", 41], ["Innings", "First inning", "No runs in the first inning", 59],
    ],
    Basketball: [
      ["Game lines", "Spread", `${team} wins by over 4.5 points`, 48], ["Game lines", "Total points", "Over 224.5 points", 54], ["Game lines", "Total points", "Over 229.5 points", 39],
      ["Player props", "Points", "Jayson Tatum over 27.5 points", 58], ["Player props", "Rebounds", "LeBron James over 7.5 rebounds", 44],
      ["Quarters", "First quarter", "Over 55.5 first-quarter points", 51], ["Quarters", "First half", `${team} to lead at halftime`, 56],
    ],
    Cricket: [
      ["Game lines", "Runs", `${team} over 249.5 runs`, 62], ["Game lines", "Wickets", "Over 14.5 match wickets", 45],
      ["Player props", "Batting", "Joe Root to score 50 or more runs", 55], ["Player props", "Bowling", "Jofra Archer to take 3 or more wickets", 33],
      ["Innings", "First innings", "Over 259.5 first-innings runs", 48], ["Innings", "Powerplay", "Over 49.5 runs in the first 10 overs", 61],
    ],
    Tennis: [
      ["Game lines", "Games", "Over 22.5 total games", 58], ["Game lines", "Sets", "Match goes to 3 sets", 36],
      ["Player props", "Aces", `${team} over 5.5 aces`, 63], ["Player props", "Double faults", `${team} over 2.5 double faults`, 31],
      ["Sets", "First set", `${team} to win the first set`, 72], ["Sets", "Second set", "A tiebreak in the second set", 27],
    ],
    "American football": [
      ["Game lines", "Spread", `${team} wins by over 3.5 points`, 52], ["Game lines", "Total points", "Over 47.5 points", 57],
      ["Player props", "Touchdowns", "Patrick Mahomes over 1.5 passing touchdowns", 67], ["Player props", "Rushing", "Josh Allen over 39.5 rushing yards", 48],
      ["Quarters", "First quarter", "Over 9.5 first-quarter points", 44], ["Quarters", "First half", `${team} to lead at halftime`, 53],
    ],
    Hockey: [
      ["Game lines", "Puck line", `${team} wins by over 1.5 goals`, 38], ["Game lines", "Total goals", "Over 5.5 goals", 56],
      ["Player props", "Goals", "Connor McDavid to score", 48], ["Player props", "Shots", "Connor McDavid over 3.5 shots", 61],
      ["Periods", "First period", "Over 1.5 first-period goals", 46], ["Periods", "Second period", `${team} to win the second period`, 44],
    ],
  };
  // Named player props only belong to their seeded matchup.
  const named = new Set(["demo-soccer", "demo-baseball", "demo-basketball", "demo-cricket", "demo-nfl", "demo-hockey"]);
  return specs[sport].filter(s => s[0] !== "Player props" || sport === "Tennis" || named.has(event.id)).map(([group, section, label, probability]) => ({
    group, section, label,
    market: {
      ...event, id: `${event.id}--${`${group}-${section}-${label}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")}`, question: `${event.question} · ${label}?`, sportType: "Props", score: undefined,
      outcomes: [{ id: "yes", label: "Yes", probability }, { id: "no", label: "No", probability: 100 - probability }],
      history: [probability], outcomeHistories: undefined, winner: undefined,
      rules: `Sample ${sport.toLowerCase()} contract. Resolves Yes if ${label.toLowerCase()} according to the official event statistics; otherwise No. ${group === "Periods" || group === "Innings" || group === "Quarters" || group === "Sets" ? "Only the named period counts." : sport === "Football" ? "90 minutes plus stoppage time; extra time and shootouts excluded." : "Full match, including overtime where applicable."} If the event or named period is cancelled, the position is void and its cost returned. These are illustrative prices, not a live feed.`,
    },
  }));
}
export const allSportsContracts = predictionMarkets.flatMap(event => sportsContracts(event));
export const findPredictionMarket = (id: string) => predictionMarkets.find(m => m.id === id) ?? allSportsContracts.find(c => c.market.id === id)?.market;
