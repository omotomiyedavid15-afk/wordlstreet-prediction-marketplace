/* Brand marks for the things a row refers to — a bank, a coin, a currency. Sources and
   licences are in ./logos/LICENSES.md. Loaded with import.meta.glob the way the avatar
   personas are, so adding a file is the only step: name it after its slug.

   Anything without a file falls back to a monogram, so a new bank or coin never
   renders a broken image. */

const load = (files: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(files).map(([path, url]) => [path.split("/").pop()!.replace(/\.(svg|png)$/, ""), url]),
  );

const banks = load(
  import.meta.glob<string>("./logos/banks/*.{svg,png}", { eager: true, query: "?url", import: "default" }),
);
const crypto = load(
  import.meta.glob<string>("./logos/crypto/*.{svg,png}", { eager: true, query: "?url", import: "default" }),
);
const flags = load(
  import.meta.glob<string>("./logos/flags/*.svg", { eager: true, query: "?url", import: "default" }),
);

// Bank names as they appear in data, to their file slugs.
const bankSlugs: Record<string, string> = {
  "First Bank of Nigeria": "firstbank",
  "Guaranty Trust Bank": "gtbank",
  "Access Bank": "access",
  "Zenith Bank": "zenith",
  "United Bank for Africa": "uba",
  "Wema Bank": "wema",
  "Stanbic IBTC": "stanbic",
  "Fidelity Bank": "fidelity",
  "Ecobank Nigeria": "ecobank",
  "Sterling Bank": "sterling",
  "Union Bank of Nigeria": "union",
  "Bank of Industry": "boi",
  "Moniepoint MFB": "moniepoint",
  "Kuda MFB": "kuda",
  OPay: "opay",
  "Providus Bank": "providus",
  "JPMorgan Chase": "chase",
  "Community Federal Savings Bank": "cfsb",
};

// Currency code to the flag of the country (or union) that issues it.
const currencyCountry: Record<string, string> = {
  USD: "us", NGN: "ng", EUR: "eu", GBP: "gb", JPY: "jp", CHF: "ch", AUD: "au", CAD: "ca", ZAR: "za", KES: "ke", GHS: "gh",
};

export const bankLogo = (name: string): string | undefined => banks[bankSlugs[name]];
export const cryptoLogo = (symbol: string): string | undefined => crypto[symbol.toLowerCase()];
export const currencyFlag = (code: string): string | undefined => flags[currencyCountry[code]];

/* The WorldStreet mark itself. One file, imported wherever the chrome shows the brand —
   the sandbox sidebar, the shell, the home page and the Universal Header — so a recolour
   is a change to the asset, not a hunt through four components. */
export { default as worldstreetLogo } from "./logos/worldstreet.svg";
