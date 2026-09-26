import democraticParty from "./assets/democratic-party.png";
import republicanParty from "./assets/republican-party.png";
import odyssey from "./assets/the-odyssey.jpg";
import doomsday from "./assets/avengers-doomsday.jpg";

export interface OutcomeIdentity {
  kind: "team" | "nation" | "person" | "party" | "movie";
  image: string;
  abbreviation: string;
  credit?: string;
}

export const partyIdentities = {
  democratic: { kind: "party", image: democraticParty, abbreviation: "D", credit: "Democratic Party / Wikimedia Commons" },
  republican: { kind: "party", image: republicanParty, abbreviation: "R", credit: "Republican Party / Wikimedia Commons" },
} satisfies Record<string, OutcomeIdentity>;

export const movieIdentities = {
  odyssey: { kind: "movie", image: odyssey, abbreviation: "TO", credit: "The Odyssey poster / Universal Pictures" },
  doomsday: { kind: "movie", image: doomsday, abbreviation: "AD", credit: "Avengers: Doomsday poster / Marvel Studios" },
} satisfies Record<string, OutcomeIdentity>;
