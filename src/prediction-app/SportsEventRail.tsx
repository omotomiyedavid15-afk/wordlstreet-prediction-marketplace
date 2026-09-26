import { useRef, useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Button, IconButton } from "../ui/Button";
import { ParticipantMark } from "../domains/finance/ParticipantMark";
import { leagueImages, marketLabel } from "../domains/finance/marketLabels";
import type { PredictionMarket } from "../domains/finance/predictionData";

export function SportsEventRail({ markets, onSelect }: { markets: PredictionMarket[]; onSelect: (market: PredictionMarket, outcome: string) => void }) {
  const rail = useRef<HTMLElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const groups = new Map<string, PredictionMarket[]>();
  markets.filter(m => m.sportType === "Games").forEach(m => { const league = marketLabel(m); groups.set(league, [...(groups.get(league) ?? []), m]); });
  const measure = () => { const el = rail.current; if (el) setEdges({ start: el.scrollLeft < 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 }); };
  useEffect(() => { const observer = new ResizeObserver(measure); if (rail.current) observer.observe(rail.current); measure(); return () => observer.disconnect(); }, []);
  const move = (direction: number) => rail.current?.scrollBy({ left: direction * rail.current.clientWidth * .75 });
  return <section className="sports-events" aria-label="Sports events">
    <IconButton icon={ChevronLeftIcon} label="Previous sports events" disabled={edges.start} onClick={() => move(-1)}/>
    <section ref={rail} onScroll={measure} className="sports-events-rail ws-scroll-x" data-start={edges.start} data-end={edges.end}>
      {[...groups].map(([league, events]) => <section className="sports-event-group" key={league} aria-label={league + " events"}>
        <h2>{leagueImages[league] && <img src={leagueImages[league]} alt=""/>}{league}<small>{events.length} events</small></h2>
        <section className="sports-event-group-cards">{events.map(m => <Button key={m.id} variant="ghost" className="sports-event" data-live={m.liveDemo || undefined} onClick={() => onSelect(m, m.outcomes[0].id)} aria-label={`Open ${m.question}${m.score ? `, sample score ${m.score.rows.map(r => r.score).join(" to ")}` : ""}`}>
          <small className={m.liveDemo ? "market-live" : ""}>{m.liveDemo ? "LIVE / DEMO" : "Upcoming"}{m.score && <em>{m.score.period}</em>}</small>
          {m.outcomes.slice(0,2).map((o,i) => <strong key={o.id}><ParticipantMark outcome={o}/><span>{o.label}</span>
            {m.score ? <><b className="sports-score" aria-label={`${o.label} score ${m.score.rows[i].score}`}>{m.score.rows[i].serving && <i aria-label="Serving"/>}{m.score.rows[i].score}</b>{m.score.rows[i].detail && <b className="sports-point">{m.score.rows[i].detail}</b>}</> : <b>{o.probability}%</b>}
          </strong>)}
        </Button>)}</section>
      </section>)}
    </section>
    <IconButton icon={ChevronRightIcon} label="Next sports events" disabled={edges.end} onClick={() => move(1)}/>
  </section>;
}
