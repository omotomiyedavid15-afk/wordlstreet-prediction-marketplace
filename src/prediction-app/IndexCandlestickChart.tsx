import { useId, useState } from "react";
import { scaleBand, scaleLinear } from "d3-scale";
import type { IndexCandle } from "../domains/finance/predictionData";

// OHLC extension using the normalized D3/SVG layout of our Rosen chart adapter.
// RosenCharts' public repository does not include a candlestick implementation.
export function IndexCandlestickChart({ candles, name, priceLabel = "Sample index price", intervalLabel = "5 min / UTC" }: { candles: IndexCandle[]; name: string; priceLabel?: string; intervalLabel?: string }) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  if (!candles.length) return <p>Price history is not available.</p>;
  const selected = active ?? candles.length - 1;
  const candle = candles[selected];
  const x = scaleBand<number>().domain(candles.map((_,i)=>i)).range([0,100]).padding(.24);
  const low = Math.min(...candles.map(c=>c.low));
  const high = Math.max(...candles.map(c=>c.high));
  const padding = Math.max((high-low)*.1,high*.0001);
  const y = scaleLinear().domain([low-padding,high+padding]).nice().range([100,0]);
  const number = (value:number) => value.toLocaleString("en-US",{maximumFractionDigits:high<10?4:2});
  const longRange=candles[candles.length-1].time-candles[0].time>86400000;
  const time = (value:number) => new Date(value).toLocaleString("en-GB",{...(longRange?{month:"short" as const,day:"numeric" as const}:{}),hour:"2-digit",minute:"2-digit",timeZone:"UTC"});
  const axisTime = (value:number) => longRange ? new Date(value).toLocaleDateString("en-GB",{month:"short",day:"numeric",timeZone:"UTC"}) : time(value);
  const change = (candle.close / candles[0].open - 1)*100;
  const description = `${time(candle.time)} UTC. Open ${number(candle.open)}, high ${number(candle.high)}, low ${number(candle.low)}, close ${number(candle.close)}`;
  const ticks = [...new Set([0,Math.floor(candles.length/3),Math.floor(candles.length*2/3),candles.length-1])];
  return <figure className="rosen-probability index-candlestick" aria-labelledby={id}>
    <figcaption id={id} className="index-chart-quote"><section><small>{name} / {priceLabel}</small><strong>{number(candle.close)}<small data-positive={change>=0}>{change>=0?"+":""}{change.toFixed(2)}%</small></strong></section><small>{intervalLabel}</small></figcaption>
    <section className="rosen-frame">
      <section className="rosen-plot" onPointerMove={e=>{const r=e.currentTarget.getBoundingClientRect();setActive(Math.max(0,Math.min(candles.length-1,Math.floor((e.clientX-r.left)/r.width*candles.length))));}} onPointerLeave={()=>setActive(null)}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={description}>
          {y.ticks(4).map(value=><line key={value} x1="0" x2="100" y1={y(value)} y2={y(value)} className="rosen-grid" vectorEffect="non-scaling-stroke"/>)}
          <line x1="0" x2="100" y1={y(candles[candles.length-1].close)} y2={y(candles[candles.length-1].close)} className="index-price-line" vectorEffect="non-scaling-stroke"/>
          {candles.map((c,i)=><g key={c.time} data-candle={i} data-direction={c.close>=c.open?"up":"down"}>
            <line x1={x(i)!+x.bandwidth()/2} x2={x(i)!+x.bandwidth()/2} y1={y(c.high)} y2={y(c.low)} stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
            <rect x={x(i)} y={y(Math.max(c.open,c.close))} width={x.bandwidth()} height={Math.max(.35,Math.abs(y(c.open)-y(c.close)))} fill="currentColor"/>
          </g>)}
          {active!==null&&<g><line x1={x(selected)!+x.bandwidth()/2} x2={x(selected)!+x.bandwidth()/2} y1="0" y2="100" className="rosen-crosshair" vectorEffect="non-scaling-stroke"/><line x1="0" x2="100" y1={y(candle.close)} y2={y(candle.close)} className="rosen-crosshair" vectorEffect="non-scaling-stroke"/></g>}
        </svg>
        <section className="rosen-x-axis" aria-hidden="true">{ticks.map(i=><small key={i} style={{left:`${i/Math.max(1,candles.length-1)*100}%`,transform:`translateX(${i===0?"0":i===candles.length-1?"-100%":"-50%"})`}}>{axisTime(candles[i].time)}</small>)}</section>
      </section>
      <section className="rosen-y-axis" aria-hidden="true">{y.ticks(4).map(value=><small key={value} style={{top:`${y(value)}%`}}>{number(value)}</small>)}</section>
    </section>
    <input className="rosen-inspector" type="range" aria-label="Inspect index candles" min="0" max={candles.length-1} value={selected} aria-valuetext={description} onChange={e=>setActive(Number(e.target.value))} onBlur={()=>setActive(null)}/>
    <output className="rosen-readout" aria-live="polite">{active===null?"Sample OHLC prices / Not a live feed":description}</output>
  </figure>;
}
