import { useId, useState } from "react";
import { arc, area, curveMonotoneX, line, stack, stackOffsetSilhouette, type SeriesPoint } from "d3-shape";
import type { ChartSeries } from "./Charts";
import "./chartVisuals.css";

export const chartColors = {
  primary: "var(--ws-action-primary-default)", success: "var(--ws-feedback-success)",
  info: "var(--ws-feedback-info)", danger: "var(--ws-feedback-danger)",
  warning: "var(--ws-domain-academy-accent)", neutral: "var(--ws-text-secondary)",
  violet: "var(--ws-domain-prediction-accent)",
};

export function ScoreRail({ value, color = chartColors.success }: { value: number; color?: string }) {
  return <div className="score-rail" role="meter" aria-label="Score" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>{Array.from({ length: 50 }, (_, i) => <span key={i} style={{ background: i < Math.round(value / 2) ? color : undefined, opacity: i < value / 2 ? .5 + i / 100 : 1 }} />)}</div>;
}

export function SegmentGauge({ value, label, color = chartColors.violet }: { value: number; label: string; color?: string }) {
  const segment = arc().innerRadius(98).outerRadius(131).cornerRadius(5);
  return <div className="segment-gauge"><svg viewBox="0 0 300 175" role="img" aria-label={`${value}% ${label}`}><g transform="translate(150,148)">{Array.from({ length: 20 }, (_, i) => <path key={i} d={segment({ startAngle: -Math.PI / 2 + i * Math.PI / 20 + .023, endAngle: -Math.PI / 2 + (i + 1) * Math.PI / 20 - .023, innerRadius: 98, outerRadius: 131 }) ?? ""} fill={i < Math.round(value / 5) ? color : "var(--ws-border-default)"} />)}</g><text x="150" y="126" textAnchor="middle" className="gauge-number">{value}%</text><text x="150" y="151" textAnchor="middle" className="chart-label">{label}</text></svg></div>;
}

export function TrendPlot({ values, labels, color = chartColors.danger, suffix = "h", compact = false }: { values: number[]; labels: string[]; color?: string; suffix?: string; compact?: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const id = useId();
  const max = Math.max(1, ...values) * 1.15;
  const x = (i: number) => 35 + i / Math.max(1, values.length - 1) * 365;
  const y = (v: number) => 170 - v / max * 145;
  const points = values.map((v, i) => [x(i), y(v)] as [number, number]);
  const path = line().curve(curveMonotoneX)(points) ?? "";
  return <div className={compact ? "trend-compact" : "trend-plot"}>
    <svg viewBox="0 0 420 205" role="img" aria-label={values.map((v, i) => `${labels[i]}: ${v}${suffix}`).join(", ")}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".16"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      {!compact && [0, 1, 2, 3].map(i => <g key={i}><line x1="35" x2="400" y1={y(max * i / 3)} y2={y(max * i / 3)} stroke="var(--ws-border-default)" strokeDasharray="2 5"/><text x="27" y={y(max * i / 3) + 4} textAnchor="end" className="chart-label">{Math.round(max * i / 3)}{suffix}</text></g>)}
      <path d={`${path} L400,170 L35,170 Z`} fill={`url(#${id})`} /><path d={path} stroke={color} strokeWidth="2.5" fill="none"/>
      {!compact && labels.map((label, i) => <text key={i} x={x(i)} y="198" textAnchor="middle" className="chart-label">{label}</text>)}
      {active !== null && <g><line x1={x(active)} x2={x(active)} y1="15" y2="170" stroke={color} strokeDasharray="3 5"/><circle cx={x(active)} cy={y(values[active])} r="5" fill={color}/></g>}
    </svg>
    {!compact && <><input className="plot-scrubber" type="range" min="0" max={values.length - 1} value={active ?? values.length - 1} onChange={e => setActive(Number(e.target.value))} aria-label="Inspect trend period"/><output className="plot-reading">{labels[active ?? values.length - 1]} <strong>{values[active ?? values.length - 1]}{suffix}</strong></output></>}
  </div>;
}

export function FlowChart({ series, labels, summary }: { series: ChartSeries[]; labels: string[]; summary?: string }) {
  const [selected, setSelected] = useState(Math.floor(labels.length / 2));
  const rows = labels.map((_, i) => Object.fromEntries(series.map(s => [s.id, Math.max(0, s.values[i] ?? 0)])));
  const layers = stack<Record<string, number>>().keys(series.map(s => s.id)).offset(stackOffsetSilhouette)(rows);
  const extent = Math.max(1, ...layers.flatMap(s => s.flatMap(p => [Math.abs(p[0]), Math.abs(p[1])])));
  const x = (i: number) => 12 + i / Math.max(1, labels.length - 1) * 576;
  const shape = area<SeriesPoint<Record<string, number>>>().x((_, i) => x(i)).y0(p => 130 - p[0] / extent * 97).y1(p => 130 - p[1] / extent * 97).curve(curveMonotoneX);
  if (!labels.length || !series.length) return <p>No volume data available.</p>;
  return <div className="flow-chart" data-chart="stream"><svg viewBox="0 0 600 260" role="img" aria-label={summary ?? "Centered volume by period"} onPointerMove={e => { const bounds = e.currentTarget.getBoundingClientRect(); setSelected(Math.max(0, Math.min(labels.length - 1, Math.round((e.clientX - bounds.left) / bounds.width * (labels.length - 1))))); }}>
    {layers.map((layer, i) => <path key={layer.key} d={shape(layer) ?? ""} fill={chartColors[series[i].tone ?? "info"]} opacity={1 - i * .15} />)}
    <line x1={x(selected)} x2={x(selected)} y1="12" y2="247" stroke="var(--ws-text-primary)" strokeOpacity=".5"/>
    <g transform={`translate(${Math.max(54, Math.min(546, x(selected)))},130)`}><rect x="-48" y="-16" width="96" height="32" rx="16" fill="var(--ws-surface-base)"/><text y="4" textAnchor="middle" className="flow-value">{rows[selected] && Object.values(rows[selected]).reduce((a, b) => a + b, 0).toLocaleString()}</text></g>
  </svg><div className="flow-periods">{labels.map((label, i) => <button type="button" key={label} aria-pressed={selected === i} onClick={() => setSelected(i)}>{label}</button>)}</div><div className="flow-legend">{series.map(s => <span key={s.id}><i style={{ background: chartColors[s.tone ?? "info"] }}/>{s.label} <strong>{(s.values[selected] ?? 0).toLocaleString()}</strong></span>)}</div></div>;
}

export function SalesReports() {
  const labels = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  return <div className="sales-reports">{[false, true].map(wave => {
    const values = wave ? [500, 1100, 6200, 9200, 9500, 6400, 1800, 800] : [600, 800, 2500, 4400, 4600, 7200, 9100, 9200];
    return <div className="min-w-0" key={String(wave)}><FlowChart labels={labels} summary={wave ? "Seasonal sales distribution" : "Regional sales growth"} series={[.55, 1, .7, .4].map((factor, i) => ({ id: String(i), label: ["Direct", "Retail", "Partners", "Other"][i], tone: wave ? "info" : "warning", values: values.map(v => Math.round(v * factor)) }))}/></div>;
  })}</div>;
}
