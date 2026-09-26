import { useEffect, useReducer, useRef } from "react";

/* One countdown mechanism for the whole system. The Toast's "quote expires in 30 seconds"
   and the progress bar's "30 sec left" are the same behaviour — a number that counts
   down in place — so they run on this hook rather than two timers that could disagree. */

/** Time left until `endsAt` (epoch ms), re-rendering as each whole second ticks over.
 *
 *  It reads the wall clock rather than decrementing a counter, so a throttled background
 *  tab or a slow frame never makes it drift — whenever it renders, the number is the real
 *  time left. It deliberately does not pause while the tab is hidden: a quote expires
 *  whether anyone is looking at it or not. */
export function useCountdown(endsAt: number, onExpire?: () => void) {
  // Each tick bumps this, which both re-renders and re-arms the next timeout. A parent
  // re-render does not bump it, so it never stacks a second timer on the first.
  const [tick, bump] = useReducer((n: number) => n + 1, 0);
  const remaining = Math.max(0, endsAt - Date.now());

  const expire = useRef(onExpire);
  expire.current = onExpire;

  useEffect(() => {
    if (remaining <= 0) {
      expire.current?.();
      return;
    }
    // Wake just after the next whole second, not a flat 1000ms from now — otherwise the
    // digit flips up to a second late and the gaps between flips wobble.
    const id = setTimeout(bump, (remaining % 1000 || 1000) + 8);
    return () => clearTimeout(id);
    // `remaining` is read from the clock on every render; the deps are what should re-arm.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt, tick]);

  return { remaining, seconds: Math.ceil(remaining / 1000), expired: remaining <= 0 };
}

/** "30 sec" / "1 min 05 sec" — or, long, "30 seconds" / "1 minute 5 seconds". */
export function formatDuration(totalSeconds: number, long = false) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const unit = (n: number, short: string, word: string) =>
    long ? `${n} ${word}${n === 1 ? "" : "s"}` : `${n} ${short}`;

  if (h) return [unit(h, "hr", "hour"), m ? unit(m, "min", "minute") : ""].join(" ").trim();
  if (m) {
    // Short form pads seconds so "1 min 5 sec" → "1 min 05 sec" and the width holds.
    const secPart = long ? unit(sec, "sec", "second") : `${String(sec).padStart(2, "0")} sec`;
    return sec || !long ? `${unit(m, "min", "minute")} ${secPart}` : unit(m, "min", "minute");
  }
  return unit(sec, "sec", "second");
}

/** The ticking text, and what a screen reader hears instead of it.
 *
 *  Sighted readers get every second, in tabular figures so the digits do not jitter.
 *  Assistive tech gets a separate line that only changes on the tens — "30 seconds",
 *  "20 seconds" — and is exact at the moment it changes. Inside a polite live region
 *  (a Toast, a status row) the per-second text would otherwise be read out every second. */
export function CountdownText({
  seconds,
  long = false,
  className = "",
}: {
  seconds: number;
  long?: boolean;
  className?: string;
}) {
  const spoken = seconds > 60 ? Math.ceil(seconds / 60) * 60 : Math.ceil(seconds / 10) * 10;
  return (
    <span className={`tabular-nums ${className}`}>
      <span aria-hidden="true">{formatDuration(seconds, long)}</span>
      <span className="sr-only">{formatDuration(spoken, true)}</span>
    </span>
  );
}

/** Hook and text together, for the common case: a live duration dropped into a sentence.
 *  `<>Your quote expires in <Countdown endsAt={t} long />.</>` */
export function Countdown({
  endsAt,
  onExpire,
  long = false,
  className,
}: {
  endsAt: number;
  onExpire?: () => void;
  long?: boolean;
  className?: string;
}) {
  const { seconds } = useCountdown(endsAt, onExpire);
  return <CountdownText seconds={seconds} long={long} className={className} />;
}
