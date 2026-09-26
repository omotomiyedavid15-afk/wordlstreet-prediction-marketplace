import { useState } from "react";
import { bankLogo, cryptoLogo } from "../ui/logos";
import type { PerpAsset } from "./perpsData";
const catalogLogos=Object.fromEntries(Object.entries(import.meta.glob<string>("../domains/finance/assets/perp-*.{png,svg}",{eager:true,query:"?url",import:"default"})).sort(([a],[b])=>Number(a.endsWith(".svg"))-Number(b.endsWith(".svg"))).map(([path,url])=>[path.split("/perp-")[1].replace(/\.(png|svg)$/,"").toUpperCase(),url]));
export function PerpAssetMark({asset}:{asset:PerpAsset}) {
  const [failed,setFailed]=useState<string>();
  const logo=asset.symbol==="SEPLAT"?undefined:cryptoLogo(asset.symbol)??catalogLogos[asset.symbol]??bankLogo(asset.name);
  return logo&&failed!==logo?<img className="perp-asset-mark" data-symbol={asset.symbol} data-group={asset.group} src={logo} alt="" onError={()=>setFailed(logo)}/>:<abbr className="perp-asset-mark" data-symbol={asset.symbol} title={asset.name}>{asset.symbol==="SILVER"?"AG":asset.symbol==="GOLD"?"AU":asset.symbol.slice(0,3)}</abbr>;
}
