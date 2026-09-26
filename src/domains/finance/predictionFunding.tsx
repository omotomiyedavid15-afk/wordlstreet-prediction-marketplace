import { Dropdown } from "../../ui/Dropdown";
import { cryptoLogo, currencyFlag } from "../../ui/logos";

export interface FundingAsset { id: string; label: string; kind: "currency" | "crypto" | "asset"; usdRate: number; balance: number; decimals: number; network?: string }
export interface PredictionFunding { assetId: string; amount: number; usdRate: number }
// Fixed sandbox quotes and holdings, never live exchange rates or connected balances.
export const sampleFundingAssets: FundingAsset[] = [
  { id: "USD", label: "US dollar", kind: "currency", usdRate: 1, balance: 1250, decimals: 2 },
  { id: "NGN", label: "Nigerian naira", kind: "currency", usdRate: 1 / 1500, balance: 1500000, decimals: 2 },
  { id: "EUR", label: "Euro", kind: "currency", usdRate: 1.1, balance: 500, decimals: 2 },
  { id: "GBP", label: "British pound", kind: "currency", usdRate: 1.3, balance: 250, decimals: 2 },
  { id: "BTC", label: "Bitcoin", kind: "crypto", usdRate: 60000, balance: .025, decimals: 8, network: "Bitcoin" },
  { id: "ETH", label: "Ethereum", kind: "crypto", usdRate: 3000, balance: .75, decimals: 8, network: "Ethereum" },
  { id: "USDC", label: "USD Coin", kind: "crypto", usdRate: 1, balance: 300, decimals: 6, network: "Ethereum" },
  { id: "SOL", label: "Solana", kind: "crypto", usdRate: 150, balance: 4, decimals: 8, network: "Solana" },
  { id: "PAXG", label: "Tokenized gold", kind: "asset", usdRate: 2500, balance: .1, decimals: 8, network: "Ethereum" },
];
export const formatFunding = (amount: number, asset: Pick<FundingAsset, "id" | "decimals">) => `${amount.toLocaleString("en-US", { maximumFractionDigits: asset.decimals })} ${asset.id}`;
const marks = Object.fromEntries(sampleFundingAssets.map(asset => [asset.id, function FundingMark({ className }: { className?: string }) {
  const image = asset.kind === "currency" ? currencyFlag(asset.id) : cryptoLogo(asset.id);
  return image ? <img className={`trade-funding-mark ${className ?? ""}`} src={image} alt=""/> : <abbr className="trade-funding-mark" title={asset.label}>{asset.id.slice(0,2)}</abbr>;
}]));
export function FundingPicker({ assets, value, onChange, disabled }: { assets: FundingAsset[]; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return <Dropdown label="Payment asset" hideLabel size="md" className="trade-funding-picker" leadingIcon={marks[value]} searchable grouped disabled={disabled} value={value} onChange={v => onChange(String(v))}
    options={assets.map(asset => ({ value: asset.id, label: asset.id, icon: marks[asset.id], group: asset.kind === "currency" ? "Currencies" : asset.kind === "crypto" ? "Crypto" : "Assets", description: `${asset.label}${asset.network ? " · " + asset.network : ""} · ${formatFunding(asset.balance, asset)} available` }))}/>;
}
