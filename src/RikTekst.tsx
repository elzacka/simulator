import { Fragment } from "react";
import { medHjemmelLenker } from "./lovdata";

function MedLenker({ tekst }: { tekst: string }) {
  return medHjemmelLenker(tekst).map((d, i) => typeof d === "string"
    ? <Fragment key={i}>{d}</Fragment>
    : <a key={i} className="lovlenke" href={d.href} target="_blank" rel="noopener noreferrer">{d.tekst}</a>);
}

/** Renders `**bold**` as <strong>, `*italic*` as <em> and legal citations as Lovdata links; no HTML is parsed. */
export default function RikTekst({ tekst }: { tekst: string }) {
  // One span keeps the text a single flex item next to icons
  return (
    <span>
      {tekst.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((del, i) => {
        if (del.startsWith("**") && del.endsWith("**") && del.length > 4) return <strong key={i}><MedLenker tekst={del.slice(2, -2)} /></strong>;
        if (del.startsWith("*") && del.endsWith("*") && del.length > 2) return <em key={i}><MedLenker tekst={del.slice(1, -1)} /></em>;
        return <MedLenker key={i} tekst={del} />;
      })}
    </span>
  );
}
