import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { arc, area, curveLinear, curveMonotoneX, line, pie } from "d3-shape";
import "./charts.css";

export type ChartTone = "primary" | "success" | "info" | "warning" | "danger" | "neutral";
const toneVars: Record<ChartTone, string> = {
  primary: "var(--ws-action-primary-default)", success: "var(--ws-feedback-success)",
  info: "var(--ws-feedback-info)", warning: "var(--ws-feedback-warning)",
  danger: "var(--ws-feedback-danger)", neutral: "var(--ws-text-secondary)",
};
export interface ChartSeries { id: string; label: string; values: number[]; tone?: ChartTone; color?: string }
export interface LineChartProps { series: ChartSeries[]; labels: string[]; height?: number; valueSuffix?: string; summary?: string; yDomain?: readonly [number, number]; variant?: "default" | "probability" }
export interface BarDatum { id: string; label: string; value: number; tone?: ChartTone; detail?: string }
export interface DonutDatum { id: string; label: string; value: number; tone?: ChartTone }

export function LineChart({ series, labels, height = 280, valueSuffix = "", summary, yDomain, variant = "default" }: LineChartProps) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<number | null>(null);
  const uid = useId();
  const plotRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  useEffect(() => {
    const element = plotRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(220, entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const shown = series.filter(s => !hidden.has(s.id));
  const values = series.flatMap(s => s.values).filter(Number.isFinite);
  const fixedDomain = yDomain && Number.isFinite(yDomain[0]) && Number.isFinite(yDomain[1]) && yDomain[1] > yDomain[0];
  const min = fixedDomain ? yDomain[0] : Math.floor(Math.min(0, ...values) / 20) * 20;
  const max = fixedDomain ? yDomain[1] : Math.max(min + 20, Math.ceil(Math.max(0, ...values) / 20) * 20);
  const active = Math.min(selected ?? labels.length - 1, labels.length - 1);
  const probability = variant === "probability";
  const left = probability ? 16 : 48;
  const right = probability ? 50 : 26;
  const plotWidth = width - left - right;
  const seriesColor = (s: ChartSeries) => s.color ?? toneVars[s.tone ?? "primary"];
  const x = (i: number) => left + i / Math.max(1, labels.length - 1) * plotWidth;
  const y = (v: number) => height - 30 - (v - min) / (max - min) * (height - 50);
  const geometry = line<number>().defined(Number.isFinite).x((_, i) => x(i)).y(y).curve(probability ? curveLinear : curveMonotoneX);
  const fill = area<number>().defined(Number.isFinite).x((_, i) => x(i)).y0(y(min)).y1(y).curve(curveMonotoneX);
  if (!labels.length || !values.length) return <p className="chart-empty">No trend data available.</p>;
  return <div ref={plotRef} className="refined-chart" data-chart="line" data-variant={variant}>
    <div className="line-legend">{series.map(s => <label key={s.id}><input type="checkbox" checked={!hidden.has(s.id)} style={{ accentColor: seriesColor(s), color: seriesColor(s) }} onChange={() => setHidden(prev => { const next = new Set(prev); next.has(s.id) ? next.delete(s.id) : next.add(s.id); return next; })}/><span>{s.label}</span><strong>{hidden.has(s.id) ? "—" : `${s.values[active] ?? "—"}${valueSuffix}`}</strong></label>)}{!probability && <span className="line-date">{labels[active]}</span>}</div>
    <svg className="line-plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={summary ?? "Trend comparison"} onPointerLeave={() => { if (probability) setSelected(null); }} onPointerMove={e => { const r = e.currentTarget.getBoundingClientRect(); const i = Math.round(((e.clientX - r.left) / r.width * width - left) / plotWidth * (labels.length - 1)); setSelected(Math.max(0, Math.min(labels.length - 1, i))); }}>
      <defs><linearGradient id={uid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={toneVars[shown[0]?.tone ?? "primary"]} stopOpacity=".12"/><stop offset="1" stopColor={toneVars[shown[0]?.tone ?? "primary"]} stopOpacity="0"/></linearGradient></defs>
      {[0, 1, 2, 3, 4].map(t => { const v = min + (max - min) * t / 4; return <g key={t}><line x1={left} x2={width - right} y1={y(v)} y2={y(v)} className="chart-gridline"/><text x={probability ? width - right + 12 : 39} y={y(v) + 4} textAnchor={probability ? "start" : "end"} className="chart-axis">{v}{valueSuffix}</text></g>; })}
      {!probability && shown[0] && <path d={fill(shown[0].values) ?? ""} fill={`url(#${uid})`}/>}
      {shown.map(s => <path key={s.id} data-series={s.id} d={geometry(s.values) ?? ""} fill="none" stroke={seriesColor(s)} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>)}
      {(!probability || selected !== null) && <line x1={x(active)} x2={x(active)} y1="15" y2={height - 30} className="chart-crosshair"/>}
      {shown.map(s => Number.isFinite(s.values[active]) && <g key={s.id}>{probability && <circle cx={x(active)} cy={y(s.values[active])} r="11" fill={seriesColor(s)} opacity=".2"/>}<circle cx={x(active)} cy={y(s.values[active])} r="4.5" fill={seriesColor(s)} stroke={probability ? "none" : "var(--ws-surface-base)"} strokeWidth="2"/></g>)}
      {labels.map((label, i) => (i === 0 || i === labels.length - 1 || (i < labels.length - Math.max(1, Math.ceil(labels.length / (width < 420 ? 3 : 6))) && i % Math.max(1, Math.ceil(labels.length / (width < 420 ? 3 : 6))) === 0)) && <text key={i} x={x(i)} y={height - 7} textAnchor="middle" className="chart-axis">{label}</text>)}
    </svg>
    <input className="chart-inspector" type="range" aria-label="Inspect comparison period" aria-valuetext={`${labels[active]}: ${shown.map(s => `${s.label} ${s.values[active]}${valueSuffix}`).join(", ")}`} min="0" max={labels.length - 1} value={active} onChange={e => setSelected(Number(e.target.value))}/>
    {!shown.length && <p className="chart-empty">Select a series to display.</p>}
  </div>;
}

export function BarChart({ data, valueSuffix = "", summary }: { data: BarDatum[]; valueSuffix?: string; summary?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const valid = data.filter(d => Number.isFinite(d.value));
  const min = Math.min(0, ...valid.map(d => d.value));
  const max = Math.max(0, ...valid.map(d => d.value));
  const span = max - min || 1;
  const zero = -min / span * 100;
  if (!valid.length) return <p className="chart-empty">No comparison data available.</p>;
  return <div className="refined-chart ranked-bars" data-chart="bar" role="group" aria-label={summary ?? "Category comparison"}>
    <div className="bar-axis"><span>{min}{valueSuffix}</span><span>{(min + (max - min) / 2).toLocaleString()}{valueSuffix}</span><span>{max}{valueSuffix}</span></div>
    {valid.map(d => <button className="bar-row" key={d.id} type="button" aria-pressed={active === d.id} aria-label={`${d.label}: ${d.value}${valueSuffix}`} onClick={() => setActive(active === d.id ? null : d.id)}>
      <span className="bar-label">{d.label}</span><span className="bar-track"><span className="bar-zero" style={{ left: `${zero}%` }}/><span className="bar-fill" style={{ left: `${Math.min(zero, (d.value - min) / span * 100)}%`, width: `${Math.abs(d.value) / span * 100}%`, background: toneVars[d.tone ?? "primary"], opacity: active === null || active === d.id ? 1 : .4 }}/></span><strong>{d.value.toLocaleString()}{valueSuffix}</strong>
    </button>)}
  </div>;
}

export function DonutChart({ data, centerLabel = "Total", summary }: { data: DonutDatum[]; centerLabel?: string; summary?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const valid = data.filter(d => Number.isFinite(d.value) && d.value > 0);
  const total = valid.reduce((sum, d) => sum + d.value, 0);
  const selected = valid.find(d => d.id === active);
  const slices = pie<DonutDatum>().sort(null).value(d => d.value).padAngle(.035)(valid);
  const shape = arc<(typeof slices)[number]>().innerRadius(77).outerRadius(99).cornerRadius(4);
  if (!total) return <p className="chart-empty">No composition data available.</p>;
  return <div className="refined-chart composition-chart" data-chart="donut">
    <svg viewBox="0 0 220 220" role="img" aria-label={`${summary ?? centerLabel}: ${valid.map(d => `${d.label} ${(d.value / total * 100).toFixed(1)}%`).join(", ")}`}><g transform="translate(110,110)">{slices.map(s => <path key={s.data.id} d={shape(s) ?? ""} fill={toneVars[s.data.tone ?? "primary"]} opacity={!selected || selected.id === s.data.id ? 1 : .3} onPointerEnter={() => setActive(s.data.id)} onClick={() => setActive(s.data.id)}/> )}</g><text x="110" y="110" textAnchor="middle" className="donut-value">{selected ? `${Math.round(selected.value / total * 100)}%` : total.toLocaleString()}</text><text x="110" y="133" textAnchor="middle" className="chart-axis">{selected ? "Share of total" : centerLabel}</text></svg>
    <div className="composition-legend">{valid.map(d => <button key={d.id} type="button" aria-pressed={active === d.id} onClick={() => setActive(active === d.id ? null : d.id)}><span className="composition-dot" style={{ background: toneVars[d.tone ?? "primary"] }}/><span>{d.label}</span><strong>{(d.value / total * 100).toFixed(0)}<small>%</small></strong><span className="composition-rail"><i style={{ width: `${d.value / total * 100}%`, background: toneVars[d.tone ?? "primary"] }}/></span></button>)}</div>
  </div>;
}

export function HeatmapChart({ rows, columns, summary, valueSuffix = "%" }: { rows: { id: string; label: string; values: number[] }[]; columns: string[]; summary?: string; valueSuffix?: string }) {
  const [active, setActive] = useState<{ row: number; column: number } | null>(null);
  const max = Math.max(...rows.flatMap(row => row.values), 1);
  const current = active ? rows[active.row]?.values[active.column] : undefined;
  return <div data-chart="heatmap"><div className="overflow-x-auto"><div className="min-w-[520px]"><div className="grid gap-1 text-[10px] text-text-tertiary" style={{ gridTemplateColumns: `112px repeat(${columns.length}, minmax(32px, 1fr))` }}><span />{columns.map(column => <span key={column} className="text-center">{column}</span>)}{rows.map((row, rowIndex) => <Fragment key={row.id}><span className="flex items-center text-text-secondary">{row.label}</span>{row.values.map((value, columnIndex) => <button key={`${row.id}-${columnIndex}`} type="button" className={`aspect-square rounded-sm transition-[transform,opacity] duration-150 hover:scale-105 focus-visible:relative focus-visible:z-10 ${active?.row === rowIndex && active.column === columnIndex ? "ring-2 ring-action-primary" : ""}`} aria-label={`${row.label}, ${columns[columnIndex]}: ${value}${valueSuffix}`} style={{ backgroundColor: toneVars[value > max * .7 ? "primary" : value > max * .4 ? "info" : "neutral"], opacity: .25 + value / max * .75 }} onClick={() => setActive({ row: rowIndex, column: columnIndex })}>{value > max * .8 ? <span className="sr-only">high</span> : null}</button>)}</Fragment>)}</div></div></div>{active && <p className="mt-3 text-xs text-text-secondary">{rows[active.row].label} in {columns[active.column]}: <strong className="tabular-nums text-text-primary">{current}{valueSuffix}</strong></p>}{summary && <p className="mt-3 text-xs leading-relaxed text-text-secondary">{summary}</p>}</div>;
}

export function Sparkline({ values, tone = "primary", label, value }: { values: number[]; tone?: ChartTone; label: string; value?: ReactNode }) {
  const id = useId();
  const valid = values.filter(Number.isFinite);
  const min = Math.min(...valid), max = Math.max(...valid);
  const points = valid.map((v, i) => [4 + i / Math.max(1, valid.length - 1) * 172, max === min ? 30 : 51 - (v - min) / (max - min) * 42] as [number, number]);
  const end = points[points.length - 1];
  return <span className="refined-sparkline" data-chart="sparkline">{value !== undefined && <strong>{value}</strong>}<svg viewBox="0 0 180 64" role="img" aria-label={`${label}: ${valid.join(", ")}`}><defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={toneVars[tone]} stopOpacity=".16"/><stop offset="1" stopColor={toneVars[tone]} stopOpacity="0"/></linearGradient></defs><path d={area<[number, number]>().x(p => p[0]).y0(61).y1(p => p[1]).curve(curveMonotoneX)(points) ?? ""} fill={`url(#${id})`}/><path d={line().curve(curveMonotoneX)(points) ?? ""} fill="none" stroke={toneVars[tone]} strokeWidth="2" strokeLinecap="round"/>{end && <circle cx={end[0]} cy={end[1]} r="3" fill={toneVars[tone]}/>}</svg></span>;
}

export { FlowChart as StreamChart } from "./ChartVisuals";
