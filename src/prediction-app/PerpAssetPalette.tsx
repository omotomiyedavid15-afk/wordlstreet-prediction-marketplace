import { useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon, StarIcon } from "@heroicons/react/24/outline";
import { Button, IconButton } from "../ui/Button";
import { InputField } from "../ui/InputField";
import { Modal } from "../ui/Modal";
import { PerpAssetMark } from "./PerpAssetMark";
import { usePerps } from "./PerpsContext";
import { compactPerpMoney, perpAssets, perpGroups, perpMoney } from "./perpsData";

export function PerpAssetPalette({open,onClose,onSelect}:{open:boolean;onClose:()=>void;onSelect:(symbol:string)=>void}) {
  const {watchlist,toggleWatch}=usePerps();
  const [query,setQuery]=useState("");const [group,setGroup]=useState("All");const [active,setActive]=useState(0);
  const input=useRef<HTMLInputElement>(null);
  const rows=perpAssets.filter(a=>(group==="All"||a.group===group||(group==="Watchlist"&&watchlist.includes(a.symbol)))&&`${a.symbol} ${a.name} ${a.exchange??""} ${a.referenceCurrency??""}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>b.volume-a.volume);
  useEffect(()=>{if(open){setQuery("");setActive(0);const timer=setTimeout(()=>input.current?.focus(),60);return()=>clearTimeout(timer);}},[open]);
  const selected=Math.min(active,Math.max(0,rows.length-1));
  useEffect(()=>{if(open)document.getElementById(`perp-option-${rows[selected]?.symbol}`)?.scrollIntoView({block:"nearest"});},[selected,open,rows]);
  return <Modal open={open} onClose={onClose} title="Switch perpetual" size="lg">
    <section className="perp-palette">
      <InputField label="Search perpetuals" hideLabel inputRef={input} leadingIcon={MagnifyingGlassIcon} placeholder="Search assets" value={query} onChange={e=>{setQuery(e.target.value);setActive(0);}} role="combobox" aria-expanded={open} aria-controls="perp-results" aria-activedescendant={rows.length?`perp-option-${rows[selected].symbol}`:undefined} onKeyDown={e=>{
        if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();setActive(i=>(i+(e.key==="ArrowDown"?1:-1)+rows.length)%Math.max(1,rows.length));}
        if(e.key==="Enter"&&rows[selected]){e.preventDefault();onSelect(rows[selected].symbol);}
      }}/>
      <nav className="perp-tabs" aria-label="Asset groups">{["All","Watchlist",...perpGroups].map(g=><Button key={g} size="sm" variant={group===g?"tonal":"ghost"} aria-pressed={group===g} onClick={()=>{setGroup(g);setActive(0);}}>{g}</Button>)}</nav>
      <section className="perp-palette-head" aria-hidden="true"><p>Asset</p><p>Price / 24h</p><p>Volume</p><p>Funding</p></section>
      <section id="perp-results" role="listbox" aria-label="Perpetual assets" className="perp-palette-results">
        {rows.map((asset,i)=><section key={asset.symbol} className="perp-palette-row" data-active={i===selected}>
          <button id={`perp-option-${asset.symbol}`} role="option" aria-selected={i===selected} onClick={()=>onSelect(asset.symbol)} onFocus={()=>setActive(i)}>
            <section className="perp-identity"><PerpAssetMark asset={asset}/><p><strong>{asset.symbol}</strong><small>{asset.name}</small><small>{asset.maxLeverage}x{asset.exchange?` / ${asset.exchange}`:""}</small></p></section>
            <p>{perpMoney(asset.price)}<small data-positive={asset.change>=0}>{asset.change>0?"+":""}{asset.change}%</small></p>
            <p>{compactPerpMoney(asset.volume)}</p><p data-positive={asset.funding>=0}>{asset.funding}%</p>
          </button>
          <IconButton icon={StarIcon} label={`${watchlist.includes(asset.symbol)?"Unwatch":"Watch"} ${asset.symbol}`} variant={watchlist.includes(asset.symbol)?"tonal":"ghost"} aria-pressed={watchlist.includes(asset.symbol)} onClick={()=>toggleWatch(asset.symbol)} size="sm"/>
        </section>)}
        {!rows.length&&<p className="perp-empty">No matching perpetuals.</p>}
      </section>
    </section>
  </Modal>;
}
