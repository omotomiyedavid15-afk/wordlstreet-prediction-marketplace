// Adapted from RosenCharts 3_LineChartMultiple.tsx (MIT, Filipe Sommer).
// Retains normalized D3 scales and non-scaling SVG strokes; adds token theming,
// bounded probability axes, series controls, and pointer/keyboard inspection.
import { useId, useState, type CSSProperties } from "react";
import { scaleTime, scaleLinear } from "d3-scale";
import { line, curveStepAfter } from "d3-shape";
import { Button } from "../ui/Button";
import type { ChartSeries } from "../ui/Charts";

export function RosenProbabilityChart({ series, labels, summary, variant = "default" }: { series: ChartSeries[]; labels: string[]; summary: string; variant?: "default" | "compact" }) {
  const id = useId();
  const [hidden, setHidden] = useState<string[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const length = labels.length;
  const dates = labels.map((_, i) => new Date(Date.UTC(2026, 8, 22 - length + 1 + i)));
  if (length < 2 || !series.length) return <p>History is not available.</p>;
  const xScale = scaleTime().domain([dates[0], dates[length - 1]]).range([0, 100]);
  const yScale = scaleLinear().domain([0, 100]).range([100, 0]);
  const path = line<{ date: Date; value: number }>().x(d => xScale(d.date)).y(d => yScale(d.value)).curve(curveStepAfter);
  const shown = series.filter(s => !hidden.includes(s.id));
  const selected = active ?? length - 1;
  const ticks = [...new Set([0, Math.round((length - 1) / 3), Math.round((length - 1) * 2 / 3), length - 1])];
  const readout = `${labels[selected]}: ${shown.map(s => `${s.label} ${s.values[selected]}%`).join(", ")}`;
  return <figure className="rosen-probability" data-variant={variant} aria-labelledby={id}>
    <figcaption id={id} className="sr-only">{summary}</figcaption>
    <section className="rosen-legend" aria-label="Chart outcomes">{series.map(s => <Button key={s.id} size="sm" variant="ghost"
      aria-pressed={!hidden.includes(s.id)} style={{ "--series-color": s.color } as CSSProperties}
      onClick={() => setHidden(current => current.includes(s.id) ? current.filter(key => key !== s.id) : current.length < series.length - 1 ? [...current, s.id] : current)}>
      <i aria-hidden="true"/>{s.label}<strong>{s.values[selected]}%</strong>
    </Button>)}</section>
    <section className="rosen-frame">
      <section className="rosen-plot" onPointerMove={e => {
        const rect = e.currentTarget.getBoundingClientRect();
        setActive(Math.max(0, Math.min(length - 1, Math.round((e.clientX - rect.left) / rect.width * (length - 1)))));
      }} onPointerLeave={() => setActive(null)}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={readout}>
          {yScale.ticks(4).map(value => <line key={value} x1="0" x2="100" y1={yScale(value)} y2={yScale(value)} className="rosen-grid" vectorEffect="non-scaling-stroke"/>)}
          {active !== null && <line x1={xScale(dates[selected])} x2={xScale(dates[selected])} y1="0" y2="100" className="rosen-crosshair" vectorEffect="non-scaling-stroke"/>}
          {shown.map(s => <g key={s.id} style={{ color: s.color }} data-series={s.id}>
            <path d={path(s.values.map((value, i) => ({ date: dates[i], value }))) ?? ""} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
            <path d={`M ${xScale(dates[selected])} ${yScale(s.values[selected])} l 0.0001 0`} stroke="currentColor" strokeWidth="20" strokeLinecap="round" opacity=".18" vectorEffect="non-scaling-stroke"/>
            <path d={`M ${xScale(dates[selected])} ${yScale(s.values[selected])} l 0.0001 0`} stroke="currentColor" strokeWidth="7" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
          </g>)}
        </svg>
        <section className="rosen-x-axis" aria-hidden="true">{ticks.map(index => <small key={index} style={{ left: `${xScale(dates[index])}%`, transform: `translateX(${index === 0 ? "0" : index === length - 1 ? "-100%" : "-50%"})` }}>{labels[index]}</small>)}</section>
      </section>
      <section className="rosen-y-axis" aria-hidden="true">{yScale.ticks(4).map(value => <small key={value} style={{ top: `${yScale(value)}%` }}>{value}%</small>)}</section>
    </section>
    <input className="rosen-inspector" type="range" aria-label="Inspect probability history" min={0} max={length - 1} value={selected} aria-valuetext={readout} onChange={e => setActive(Number(e.target.value))} onBlur={() => setActive(null)}/>
    <output className="rosen-readout" aria-live="polite">{active === null ? "Sample probability history" : readout}</output>
  </figure>;
}
