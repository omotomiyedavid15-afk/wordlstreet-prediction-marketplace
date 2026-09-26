import { useState } from "react";
import type { PredictionOutcome } from "./predictionData";
import { sportsParticipants } from "./sportsAssets";

export function ParticipantMark({ outcome }: { outcome: Pick<PredictionOutcome, "id" | "label" | "participant"> }) {
  const participant = outcome.participant ?? sportsParticipants[outcome.id];
  const [failed, setFailed] = useState<string | null>(null);
  if (!participant) return null;
  const description = { team: "crest", nation: "flag", person: "portrait", party: "logo", movie: "poster" }[participant.kind];
  return <figure className="pm-participant-mark" data-kind={participant.kind} title={participant.credit}>
    {failed !== participant.image
      ? <img src={participant.image} alt={`${outcome.label} ${description}`} onError={() => setFailed(participant.image)}/>
      : <abbr title={outcome.label}>{participant.abbreviation}</abbr>}
  </figure>;
}
