import arsenal from "./assets/holographic/arsenal.png";
import city from "./assets/holographic/manchester-city.png";
import liverpool from "./assets/liverpool.png";
import astonVilla from "./assets/holographic/aston-villa.png";
import barcelona from "./assets/holographic/barcelona.png";
import realMadrid from "./assets/holographic/real-madrid.png";
import timberwolves from "./assets/holographic/timberwolves.png";
import celtics from "./assets/holographic/celtics.png";
import lakers from "./assets/holographic/lakers.png";
import chiefs from "./assets/holographic/chiefs.png";
import bills from "./assets/holographic/buffalo-bills.png";
import oilers from "./assets/holographic/edmonton-oilers.png";
import sixers from "./assets/holographic/76ers.png";
import england from "./assets/england.png";
import sriLanka from "./assets/sri-lanka.png";
import kjaer from "./assets/nicolai-kjaer.jpg";
import harris from "./assets/billy-harris.jpg";
import type { OutcomeIdentity } from "./outcomeIdentityAssets";

export const clubAssets: Record<string, { logo: string; abbreviation: string; color: string; ink: string }> = {
  arsenal: { logo: arsenal, abbreviation: "ARS", color: "var(--ws-feedback-danger)", ink: "var(--ws-tonal-error-text)" },
  city: { logo: city, abbreviation: "MCI", color: "var(--ws-feedback-info)", ink: "var(--ws-tonal-info-text)" },
  liverpool: { logo: liverpool, abbreviation: "LIV", color: "var(--ws-feedback-danger)", ink: "var(--ws-tonal-error-text)" },
  astonVilla: { logo: astonVilla, abbreviation: "AVL", color: "var(--ws-domain-prediction-accent)", ink: "var(--ws-domain-prediction-accent)" },
  barcelona: { logo: barcelona, abbreviation: "FCB", color: "var(--ws-feedback-info)", ink: "var(--ws-tonal-info-text)" },
  realMadrid: { logo: realMadrid, abbreviation: "RMA", color: "var(--ws-action-primary-default)", ink: "var(--ws-action-primary-text)" },
  timberwolves: { logo: timberwolves, abbreviation: "MIN", color: "var(--ws-domain-prediction-accent)", ink: "var(--ws-domain-prediction-accent)" },
  celtics: { logo: celtics, abbreviation: "BOS", color: "var(--ws-feedback-success)", ink: "var(--ws-tonal-success-text)" },
  lakers: { logo: lakers, abbreviation: "LAL", color: "var(--ws-domain-prediction-accent)", ink: "var(--ws-domain-prediction-accent)" },
  chiefs: { logo: chiefs, abbreviation: "KC", color: "var(--ws-feedback-danger)", ink: "var(--ws-tonal-error-text)" },
  bills: { logo: bills, abbreviation: "BUF", color: "var(--ws-feedback-info)", ink: "var(--ws-tonal-info-text)" },
  oilers: { logo: oilers, abbreviation: "EDM", color: "var(--ws-feedback-info)", ink: "var(--ws-tonal-info-text)" },
  sixers: { logo: sixers, abbreviation: "PHI", color: "var(--ws-feedback-info)", ink: "var(--ws-tonal-info-text)" },
};

export const sportsParticipants: Record<string, OutcomeIdentity> = {
  ...Object.fromEntries(Object.entries(clubAssets).map(([id, club]) => [id, { kind: "team" as const, image: club.logo, abbreviation: club.abbreviation }])),
  england: { kind: "nation", image: england, abbreviation: "ENG" },
  sriLanka: { kind: "nation", image: sriLanka, abbreviation: "SL" },
  kjaer: { kind: "person", image: kjaer, abbreviation: "NK", credit: "Hameltion / Wikimedia Commons / CC BY-SA 4.0" },
  harris: { kind: "person", image: harris, abbreviation: "BH", credit: "si.robi / Wikimedia Commons / CC BY-SA 2.0" },
};
