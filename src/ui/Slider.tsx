import { type ReactNode } from "react";
import { FieldLabel, FieldMessage, describedBy, useFieldIds } from "./Field";

/* Sliders are the native range input, restyled (.ws-range in app.css) — so arrow keys,
   Page Up/Down, Home/End, touch dragging and the screen-reader value all come from the
   browser. What is drawn here is the track, the gold fill and the tick marks.

   A native thumb does not travel the full width: its centre runs from one radius in to
   one radius short of the end. Every position below is measured the same way —
   THUMB/2 + (100% − THUMB) × p — so the fill ends, and each tick sits, exactly under the
   thumb's centre at that value, rather than drifting a few pixels off at either end. */

const THUMB = 18;
const at = (p: number) => `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${p})`;

export type SliderMark = { value: number; label?: string };

function Track({ from, to, marks, min, max, active }: { from: number; to: number; marks?: SliderMark[]; min: number; max: number; active: [number, number] }) {
  const p = (v: number) => (v - min) / (max - min);
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2">
      <span className="absolute inset-y-0 rounded-full bg-text-primary/10" style={{ left: at(0), right: `calc(100% - ${at(1)})` }} />
      <span
        className="absolute inset-y-0 rounded-full bg-action-primary"
        style={{ left: at(from), width: `calc((100% - ${THUMB}px) * ${to - from})` }}
      />
      {marks?.map((m) => {
        const inside = m.value >= active[0] && m.value <= active[1];
        return (
          <span
            key={m.value}
            className={`absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${inside ? "bg-text-on-accent/50" : "bg-text-primary/25"}`}
            style={{ left: at(p(m.value)) }}
          />
        );
      })}
    </span>
  );
}

function MarkLabels({ marks, min, max, onPick, disabled }: { marks: SliderMark[]; min: number; max: number; onPick?: (v: number) => void; disabled?: boolean }) {
  const p = (v: number) => (v - min) / (max - min);
  return (
    <div className="relative mt-2 h-4">
      {marks
        .filter((m) => m.label)
        .map((m, i, all) => {
          const edge = i === 0 ? "translate-x-0" : i === all.length - 1 ? "-translate-x-full" : "-translate-x-1/2";
          const style = { left: i === 0 ? 0 : i === all.length - 1 ? "100%" : at(p(m.value)) };
          // A labelled mark is a shortcut: clicking "50%" jumps there. Keyboard users have
          // the slider itself, so these stay out of the tab order.
          return onPick ? (
            <button
              key={m.value}
              type="button"
              tabIndex={-1}
              disabled={disabled}
              onClick={() => onPick(m.value)}
              className={`absolute top-0 ${edge} text-[11.5px] tabular-nums text-text-tertiary transition-colors duration-150 hover:text-text-primary`}
              style={style}
            >
              {m.label}
            </button>
          ) : (
            <span key={m.value} className={`absolute top-0 ${edge} text-[11.5px] tabular-nums text-text-tertiary`} style={style}>
              {m.label}
            </span>
          );
        })}
    </div>
  );
}

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  marks,
  format = String,
  helperText,
  disabled,
  id: providedId,
  className = "",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Ticks on the track; labelled ones become click targets under it. */
  marks?: SliderMark[];
  /** Formats the value for the label row and for screen readers — "25×", "₦53,226". */
  format?: (value: number) => string;
  helperText?: ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  const { id, messageId } = useFieldIds(providedId);
  const p = (value - min) / (max - min);
  return (
    <div className={`min-w-0 ${className}`}>
      <FieldLabel htmlFor={id} disabled={disabled} aside={<span className="font-medium text-text-primary">{format(value)}</span>}>
        {label}
      </FieldLabel>
      <div className={`relative mt-2 h-5 ${disabled ? "opacity-40" : ""}`}>
        <Track from={0} to={p} marks={marks} min={min} max={max} active={[min, value]} />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-valuetext={format(value)}
          aria-describedby={describedBy(messageId, helperText)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="ws-range relative"
        />
      </div>
      {marks?.some((m) => m.label) ? <MarkLabels marks={marks} min={min} max={max} onPick={onChange} disabled={disabled} /> : null}
      <div className="mt-2">
        <FieldMessage id={messageId} helperText={helperText} />
      </div>
    </div>
  );
}

/** Two thumbs on one track, for a band — a price range, a date-less filter on size. Each
 *  thumb is its own native range input, labelled for what it sets, and they cannot cross:
 *  the low one stops a step short of the high one. */
export function RangeSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  marks,
  format = String,
  thumbLabels = ["Minimum", "Maximum"],
  helperText,
  disabled,
  id: providedId,
  className = "",
}: {
  label: string;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  marks?: SliderMark[];
  format?: (value: number) => string;
  thumbLabels?: [string, string];
  helperText?: ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  const { id, messageId, labelId } = useFieldIds(providedId);
  const [lo, hi] = value;
  const p = (v: number) => (v - min) / (max - min);
  // Where both thumbs meet, the one that can still move must be on top: near the top
  // end that is the low thumb (it can only go left), near the bottom the high one.
  const loOnTop = lo - min > (max - min) / 2;
  const input = (which: 0 | 1) => (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[which]}
      disabled={disabled}
      aria-label={`${thumbLabels[which]} ${label.toLowerCase()}`}
      aria-valuetext={format(value[which])}
      aria-describedby={describedBy(messageId, helperText)}
      onChange={(e) => {
        const n = Number(e.target.value);
        onChange(which === 0 ? [Math.min(n, hi - step), hi] : [lo, Math.max(n, lo + step)]);
      }}
      className={`ws-range ws-range-dual ${which === 0 && loOnTop ? "z-20" : "z-10"}`}
    />
  );
  return (
    <div role="group" aria-labelledby={labelId} className={`min-w-0 ${className}`}>
      <FieldLabel
        id={labelId}
        disabled={disabled}
        aside={
          <span className="font-medium text-text-primary">
            {format(lo)} <span className="text-text-tertiary">–</span> {format(hi)}
          </span>
        }
      >
        {label}
      </FieldLabel>
      <div id={id} className={`relative mt-2 h-5 ${disabled ? "opacity-40" : ""}`}>
        <Track from={p(lo)} to={p(hi)} marks={marks} min={min} max={max} active={[lo, hi]} />
        {input(0)}
        {input(1)}
      </div>
      {marks?.some((m) => m.label) ? <MarkLabels marks={marks} min={min} max={max} /> : null}
      <div className="mt-2">
        <FieldMessage id={messageId} helperText={helperText} />
      </div>
    </div>
  );
}
