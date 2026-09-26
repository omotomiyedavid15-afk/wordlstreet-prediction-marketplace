import { useState } from "react";
import { Button } from "../ui/Button";
import { InputField } from "../ui/InputField";
import { SelectDropdown } from "../ui/Dropdown";
import { Switch } from "../ui/Choice";
import { Slider } from "../ui/Slider";
import { Modal } from "../ui/Modal";
import { FundingPicker, formatFunding, sampleFundingAssets } from "../domains/finance/predictionFunding";
import { usePerps } from "./PerpsContext";
import { liquidationEstimate, perpFeeRate, perpMoney, type PerpAsset, type PerpDirection, type PerpOrder } from "./perpsData";
import "../domains/finance/predictionTrade.css";

export function PerpPositionTicket({asset,initialDirection="up",initialLimit}:{asset:PerpAsset;initialDirection?:PerpDirection;initialLimit?:number}) {
  const {account,dispatch}=usePerps();
  const [mode,setMode]=useState<"open"|"close">("open");
  const [direction,setDirection]=useState<PerpDirection>(initialDirection);
  const [type,setType]=useState<"market"|"limit">(initialLimit?"limit":"market");
  const [collateral,setCollateral]=useState("USD");const [amount,setAmount]=useState("");
  const [leverage,setLeverage]=useState(Math.min(5,asset.maxLeverage));
  const [limit,setLimit]=useState(String(initialLimit??asset.price));
  const [protectedOrder,setProtected]=useState(false);const [tp,setTp]=useState("3");const [sl,setSl]=useState("2");
  const [percent,setPercent]=useState(100);const [positionId,setPositionId]=useState("");
  const [review,setReview]=useState<PerpOrder|null>(null);const [closing,setClosing]=useState(false);const [notice,setNotice]=useState("");
  const assets=sampleFundingAssets.map(a=>({...a,balance:account.balances[a.id]??0}));
  const funding=assets.find(a=>a.id===collateral)!;
  const margin=Number(amount),usd=margin*funding.usdRate,notional=usd*leverage,fee=notional*perpFeeRate;
  const entry=type==="limit"?Number(limit):asset.price;
  const quantity=entry>0?notional/entry:0;
  const liquidation=liquidationEstimate(entry,leverage,direction);
  const takeProfit=entry*(1+(direction==="up"?1:-1)*Number(tp)/100);
  const stopLoss=entry*(1+(direction==="up"?-1:1)*Number(sl)/100);
  const invalidProtection=protectedOrder&&(!Number.isFinite(Number(tp))||!Number.isFinite(Number(sl))||Number(tp)<=0||Number(sl)<=0||Number(sl)>=95/leverage||takeProfit<=0);
  const insufficient=margin+fee/funding.usdRate>funding.balance;
  const valid=[margin,entry,notional].every(n=>Number.isFinite(n)&&n>0)&&!insufficient&&!invalidProtection;
  const positions=account.positions.filter(p=>p.symbol===asset.symbol&&p.direction===direction);
  const position=positions.find(p=>p.id===positionId)??positions[0];
  const closeSize=position?position.quantity*asset.price*percent/100:0;
  const chooseMax=(fraction:number)=>setAmount(String(Math.floor(funding.balance*fraction/(1+leverage*perpFeeRate)*10**funding.decimals)/10**funding.decimals));
  return <aside className="perp-ticket" aria-label="Perpetual position ticket">
    <header className="perp-ticket-head"><section role="group" aria-label="Position action">{(["open","close"] as const).map(m=><Button key={m} variant="ghost" aria-pressed={mode===m} onClick={()=>{setMode(m);setNotice("");}}>{m==="open"?"Open":"Close"}</Button>)}</section>
      {mode==="open"&&<SelectDropdown label="Perpetual order type" hideLabel size="md" value={type} onChange={v=>setType(v as "market"|"limit")} options={[{value:"market",label:"Market"},{value:"limit",label:"Limit"}]}/>}</header>
    <section className="perp-ticket-body">
      <section className="trade-answer-tabs" role="group" aria-label="Position direction">{(["up","down"] as const).map(d=><Button key={d} variant={direction===d?"primary":"ghost"} shape="pill" aria-pressed={direction===d} onClick={()=>{setDirection(d);setNotice("");}}>{d==="up"?"Up / Long":"Down / Short"}</Button>)}</section>
      {mode==="open"?<>
        <section className="perp-margin">
          <p>Margin <small>Available {formatFunding(funding.balance,funding)}</small></p>
          <InputField label={`Margin (${collateral})`} hideLabel type="number" min="0" step="any" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)} trailingContent={<FundingPicker assets={assets} value={collateral} onChange={v=>{setCollateral(v);setAmount("");}}/>}/>
          <p><small>{perpMoney(Number.isFinite(usd)?usd:0)} equivalent</small><small>Size {perpMoney(Number.isFinite(notional)?notional:0)}</small></p>
        </section>
        <section className="perp-quick" aria-label="Margin shortcuts">{[.25,.5,1].map(n=><Button key={n} variant="secondary" size="sm" onClick={()=>chooseMax(n)}>{n===1?"Max":n*100+"%"}</Button>)}</section>
        {type==="limit"&&<InputField label="Limit price (USD)" type="number" min="0" step="any" value={limit} onChange={e=>setLimit(e.target.value)}/>}
        <section className="perp-leverage"><Slider label="Leverage" min={1} max={asset.maxLeverage} step={.1} value={leverage} onChange={setLeverage} format={n=>`${n.toFixed(1)}x`} marks={[{value:1,label:"1x"},{value:asset.maxLeverage/2,label:`${asset.maxLeverage/2}x`},{value:asset.maxLeverage,label:`${asset.maxLeverage}x`}]}/></section>
        <Switch label="Take profit / Stop loss" checked={protectedOrder} onChange={setProtected} labelPosition="before"/>
        {protectedOrder&&<section className="perp-protection">
          <InputField label="Take profit (%)" type="number" min="0.1" step=".1" value={tp} onChange={e=>setTp(e.target.value)}/><InputField label="Stop loss (%)" type="number" min="0.1" step=".1" value={sl} onChange={e=>setSl(e.target.value)}/>
          <p data-positive="true">TP {perpMoney(takeProfit)}<small>Est. +{perpMoney(notional*Number(tp)/100)}</small></p><p data-positive="false">SL {perpMoney(stopLoss)}<small>Est. -{perpMoney(notional*Number(sl)/100)}</small></p>
        </section>}
        <dl className="perp-ticket-metrics"><section><dt>Position size</dt><dd>{quantity.toLocaleString("en-US",{maximumFractionDigits:5})} {asset.symbol}</dd></section><section><dt>Est. liquidation</dt><dd>{entry>0?perpMoney(liquidation):"--"}</dd></section><section><dt>Opening fee</dt><dd>{perpMoney(Number.isFinite(fee)?fee:0)}</dd></section><section><dt>Funding / 8h</dt><dd>{asset.funding}%</dd></section><section><dt>Expiration</dt><dd>None</dd></section></dl>
        {invalidProtection&&<p className="perp-error" role="alert">Use positive targets. Stop loss must be before estimated liquidation.</p>}
        <Button variant="primary" className="perp-submit" disabled={!valid} onClick={()=>setReview({id:crypto.randomUUID(),symbol:asset.symbol,direction,collateral,margin,rate:funding.usdRate,entry,leverage,quantity,fee,type,...(protectedOrder?{takeProfit,stopLoss}:{})})}>{insufficient?"Insufficient balance":`Review ${direction==="up"?"long":"short"}`}</Button>
      </>:<>
        {positions.length?<><SelectDropdown label="Open position" value={position?.id??""} onChange={v=>setPositionId(String(v))} options={positions.map(p=>({value:p.id,label:`${p.leverage}x ${asset.symbol} / ${perpMoney(p.quantity*p.entry)}`}))}/><Slider label="Close position" min={1} max={100} value={percent} onChange={setPercent} format={n=>`${n}%`}/><dl className="perp-ticket-metrics"><section><dt>Closing size</dt><dd>{perpMoney(closeSize)}</dd></section><section><dt>Closing fee</dt><dd>{perpMoney(closeSize*perpFeeRate)}</dd></section><section><dt>Settlement asset</dt><dd>{position?.collateral}</dd></section></dl><Button variant="primary" onClick={()=>setClosing(true)}>Review close</Button></>:<p className="perp-empty">No open {direction==="up"?"long":"short"} position in {asset.symbol}.</p>}
      </>}
      {notice&&<p role="status" className="perp-notice">{notice}</p>}
      <p className="perp-disclaimer">Demo account. Sample prices and conversion rates. Liquidation is an estimate; fees and funding affect returns. TP/SL orders are recorded, not automatically executed.</p>
    </section>
    <Modal open={Boolean(review)} onClose={()=>setReview(null)} title="Review perpetual order" size="sm" footer={<><Button variant="ghost" onClick={()=>setReview(null)}>Back</Button><Button variant="primary" onClick={()=>{if(review){dispatch({type:"open",order:review});setNotice(review.type==="limit"?"Limit order placed. Margin reserved; no position filled.":"Demo position opened.");setReview(null);setAmount("");}}}>Confirm demo order</Button></>}>
      {review&&<section className="perp-review"><h3>{review.symbol} / {review.direction==="up"?"Long":"Short"}</h3><dl className="perp-ticket-metrics"><section><dt>Order</dt><dd>{review.type}</dd></section><section><dt>Margin</dt><dd>{formatFunding(review.margin,{id:review.collateral,decimals:funding.decimals})}</dd></section><section><dt>Leverage</dt><dd>{review.leverage.toFixed(1)}x</dd></section><section><dt>Notional</dt><dd>{perpMoney(review.quantity*review.entry)}</dd></section><section><dt>Entry price</dt><dd>{perpMoney(review.entry)}</dd></section><section><dt>Fee</dt><dd>{perpMoney(review.fee)}</dd></section></dl><p>Leverage magnifies losses as well as gains. You can lose the entire margin. This is a simulated order.</p></section>}
    </Modal>
    <Modal open={closing} onClose={()=>setClosing(false)} title="Close perpetual position" size="sm" footer={<Button variant="primary" onClick={()=>{if(position){dispatch({type:"close",id:position.id,fraction:percent/100,mark:asset.price,time:new Date().toISOString()});setNotice("Demo position closed. Remaining collateral returned.");}setClosing(false);}}>Confirm close</Button>}><p>Close {percent}% of your {asset.symbol} {direction} position at the sample mark price of {perpMoney(asset.price)}?</p><p>Closing fee: {perpMoney(closeSize*perpFeeRate)}. Any remaining position stays open.</p></Modal>
  </aside>;
}
